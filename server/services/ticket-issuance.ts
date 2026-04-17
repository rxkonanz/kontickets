import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { confirmInventory } from "./inventory";
import type { CartItem } from "@/types";

/**
 * Issue tickets after payment is confirmed.
 * Should be called from the Stripe webhook handler only.
 * Wrapped in a transaction for safety.
 */
export async function issueTickets(orderId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { ticketType: true },
        },
      },
    });

    if (!order) throw new Error(`Pedido no encontrado: ${orderId}`);
    if (order.status === "CONFIRMED") {
      // Already confirmed (idempotent — safe to skip)
      return;
    }

    // Issue one ticket per quantity in each order item
    for (const item of order.items) {
      for (let i = 0; i < item.quantity; i++) {
        await tx.ticket.create({
          data: {
            code: nanoid(12).toUpperCase(),
            orderId: order.id,
            userId: order.userId,
            ticketTypeId: item.ticketTypeId,
            status: "ISSUED",
            issuedAt: new Date(),
          },
        });
      }
    }

    // Confirm order
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });

    // Update payment to PAID
    await tx.payment.updateMany({
      where: { orderId, status: { in: ["INITIATED", "PENDING", "AUTHORIZED"] } },
      data: { status: "PAID", paidAt: new Date() },
    });
  });

  // Confirm inventory outside the main transaction (separate update)
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (order) {
    const cartItems: CartItem[] = order.items.map((item) => ({
      ticketTypeId: item.ticketTypeId,
      quantity: item.quantity,
    }));
    await confirmInventory(cartItems);
  }
}
