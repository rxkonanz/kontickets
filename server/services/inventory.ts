import { prisma } from "@/lib/prisma";
import type { CartItem } from "@/types";

/**
 * Atomically reserve inventory for cart items.
 * INVARIANT: Only this function (and releaseInventory) may modify
 *            TicketType.reserved. Use $transaction to prevent races.
 */
export async function reserveInventory(items: CartItem[]): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const ticketType = await tx.ticketType.findUnique({
        where: { id: item.ticketTypeId },
        select: { id: true, capacity: true, reserved: true, sold: true },
      });

      if (!ticketType) {
        throw new Error(`Tipo de entrada no encontrado: ${item.ticketTypeId}`);
      }

      const available = ticketType.capacity - ticketType.reserved - ticketType.sold;
      if (available < item.quantity) {
        throw new Error(`Inventario insuficiente para: ${item.ticketTypeId}`);
      }

      await tx.ticketType.update({
        where: { id: item.ticketTypeId },
        data: { reserved: { increment: item.quantity } },
      });
    }
  });
}

/**
 * Release previously reserved inventory (e.g., on checkout expiry or cancellation).
 * INVARIANT: Only modifies TicketType.reserved inside $transaction.
 */
export async function releaseInventory(items: CartItem[]): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      await tx.ticketType.update({
        where: { id: item.ticketTypeId },
        data: {
          reserved: { decrement: item.quantity },
        },
      });
    }
  });
}

/**
 * Convert reserved inventory to sold (called after payment confirmed).
 * INVARIANT: Only modifies TicketType.reserved and TicketType.sold inside $transaction.
 */
export async function confirmInventory(items: CartItem[]): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      await tx.ticketType.update({
        where: { id: item.ticketTypeId },
        data: {
          reserved: { decrement: item.quantity },
          sold: { increment: item.quantity },
        },
      });
    }
  });
}
