"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { reserveInventory } from "@/server/services/inventory";
import { createPaymentIntent, calculateFees } from "@/server/services/payment";
import { nanoid } from "nanoid";
import { CHECKOUT_EXPIRY_MINUTES } from "@/lib/constants";
import type { CartItem } from "@/types";

export async function createOrderIntent(
  eventId: string,
  items: CartItem[]
): Promise<{ orderId: string; clientSecret: string }> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("Usuario no encontrado");

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

  // Create draft order
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
      items: {
        create: items.map((item) => {
          const tt = ticketTypes.find((t) => t.id === item.ticketTypeId)!;
          return {
            ticketTypeId: item.ticketTypeId,
            quantity: item.quantity,
            unitPrice: tt.price,
            subtotal: tt.price * item.quantity,
          };
        }),
      },
    },
  });

  // Create Stripe payment intent
  const paymentIntent = await createPaymentIntent({
    orderId: order.id,
    amount: total,
    metadata: { userId: user.id, eventId },
  });

  // Advance order to pending_payment
  await prisma.order.update({
    where: { id: order.id },
    data: { status: "PENDING_PAYMENT" },
  });

  return {
    orderId: order.id,
    clientSecret: paymentIntent.client_secret!,
  };
}
