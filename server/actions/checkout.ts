"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { reserveInventory, releaseInventory } from "@/server/services/inventory";
import { createPaymentIntent, calculateFees } from "@/server/services/payment";
import { stripe } from "@/lib/stripe";
import { nanoid } from "nanoid";
import { CHECKOUT_EXPIRY_MINUTES } from "@/lib/constants";
import type { CartItem } from "@/types";

function itemsEqual(a: CartItem[], b: CartItem[]): boolean {
  if (a.length !== b.length) return false;
  const bMap = new Map(b.map((i) => [i.ticketTypeId, i.quantity]));
  return a.every((i) => bMap.get(i.ticketTypeId) === i.quantity);
}

export async function createOrderIntent(
  eventId: string,
  items: CartItem[]
): Promise<{ orderId: string; clientSecret: string }> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Find-or-create the user — upsert with `update: {}` triggers an interactive
  // transaction in HTTP mode, which isn't supported. findMany + conditional
  // create uses only single-statement operations.
  const existingUsers = await prisma.user.findMany({
    where: { clerkId: userId },
    take: 1,
  });
  let user = existingUsers[0];
  if (!user) {
    const { currentUser } = await import("@clerk/nextjs/server");
    const clerkUser = await currentUser();
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: clerkUser?.emailAddresses[0]?.emailAddress ?? `${userId}@unknown.com`,
        firstName: clerkUser?.firstName ?? null,
        lastName: clerkUser?.lastName ?? null,
        imageUrl: clerkUser?.imageUrl ?? null,
        role: "BUYER",
      },
    });
  }

  // Validate items belong to the event
  const ticketTypes = await prisma.ticketType.findMany({
    where: {
      id: { in: items.map((i) => i.ticketTypeId) },
      eventId,
      isVisible: true,
    },
  });

  if (ticketTypes.length !== items.length) {
    throw new Error("Tipos de entrada inválidos");
  }

  // Dedup: look for an existing unexpired in-flight order for this user+event.
  // If items match exactly, reuse it (idempotent retry). If they differ, cancel
  // the stale one, release its inventory + Stripe intent, then fall through.
  const existingOrders = await prisma.order.findMany({
    where: {
      userId: user.id,
      eventId,
      status: { in: ["DRAFT", "PENDING_PAYMENT"] },
      expiresAt: { gt: new Date() },
    },
    include: {
      items: true,
      payments: {
        where: { status: { in: ["INITIATED", "PENDING", "REQUIRES_ACTION"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 1,
  });

  const existing = existingOrders[0];
  if (existing) {
    const existingCart: CartItem[] = existing.items.map((ei) => ({
      ticketTypeId: ei.ticketTypeId,
      quantity: ei.quantity,
    }));
    const latestPayment = existing.payments[0];

    if (itemsEqual(existingCart, items) && latestPayment?.providerPaymentId) {
      // Reuse — pull the same client_secret back from Stripe
      const pi = await stripe.paymentIntents.retrieve(
        latestPayment.providerPaymentId
      );
      if (pi.client_secret && pi.status !== "canceled" && pi.status !== "succeeded") {
        return { orderId: existing.id, clientSecret: pi.client_secret };
      }
    }

    // Cancel stale order: release inventory, cancel Stripe PI, mark CANCELLED
    await releaseInventory(existingCart);
    if (latestPayment?.providerPaymentId) {
      try {
        await stripe.paymentIntents.cancel(latestPayment.providerPaymentId);
      } catch {
        // PI may already be in a non-cancellable state (succeeded, canceled). Ignore.
      }
      await prisma.$executeRaw`
        UPDATE "payments" SET "status" = 'CANCELLED'
        WHERE "id" = ${latestPayment.id}
      `;
    }
    await prisma.$executeRaw`
      UPDATE "orders" SET "status" = 'CANCELLED', "cancelledAt" = NOW()
      WHERE "id" = ${existing.id}
    `;
  }

  // Calculate subtotal
  const subtotal = items.reduce((acc, item) => {
    const tt = ticketTypes.find((t) => t.id === item.ticketTypeId)!;
    return acc + tt.price * item.quantity;
  }, 0);

  const { fees, total } = calculateFees(subtotal);

  // Reserve inventory
  await reserveInventory(items);

  const idempotencyKey = nanoid();
  const expiresAt = new Date(Date.now() + CHECKOUT_EXPIRY_MINUTES * 60 * 1000);

  // Create draft order — no nested creates (Prisma wraps them in an interactive
  // transaction which PrismaNeonHttp / HTTP mode does not support)
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      eventId,
      status: "DRAFT",
      subtotal,
      fees,
      tax: 0,
      total,
      currency: "USD",
      idempotencyKey,
      expiresAt,
    },
  });

  // Create order items — singular create() per row. createMany wraps in a
  // transaction in HTTP mode, which isn't supported.
  for (const item of items) {
    const tt = ticketTypes.find((t) => t.id === item.ticketTypeId)!;
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        ticketTypeId: item.ticketTypeId,
        quantity: item.quantity,
        unitPrice: tt.price,
        subtotal: tt.price * item.quantity,
      },
    });
  }

  // Create Stripe payment intent
  const paymentIntent = await createPaymentIntent({
    orderId: order.id,
    amount: total,
    metadata: { userId: user.id, eventId },
  });

  // Advance order to pending_payment — singular update() is a single
  // UPDATE ... WHERE id = ? in HTTP mode. updateMany surprisingly wraps in a tx.
  await prisma.order.update({
    where: { id: order.id },
    data: { status: "PENDING_PAYMENT" },
  });

  return {
    orderId: order.id,
    clientSecret: paymentIntent.client_secret!,
  };
}
