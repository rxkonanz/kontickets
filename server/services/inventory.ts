import { prisma } from "@/lib/prisma";
import type { CartItem } from "@/types";

/**
 * Atomically reserve inventory for cart items.
 *
 * INVARIANT: Only this function (and releaseInventory) may modify
 *            TicketType.reserved.
 *
 * Uses a conditional SQL UPDATE (single statement) instead of an interactive
 * transaction — PrismaNeonHttp (HTTP mode) does not support interactive
 * transactions. A single-statement UPDATE is atomic at the DB level.
 */
export async function reserveInventory(items: CartItem[]): Promise<void> {
  for (const item of items) {
    const updated: number = await prisma.$executeRaw`
      UPDATE "TicketType"
      SET    "reserved" = "reserved" + ${item.quantity}
      WHERE  "id" = ${item.ticketTypeId}
        AND  ("capacity" - "reserved" - "sold") >= ${item.quantity}
    `;

    if (updated === 0) {
      throw new Error(`Inventario insuficiente para: ${item.ticketTypeId}`);
    }
  }
}

/**
 * Release previously reserved inventory (e.g., on checkout expiry or cancellation).
 */
export async function releaseInventory(items: CartItem[]): Promise<void> {
  for (const item of items) {
    await prisma.$executeRaw`
      UPDATE "TicketType"
      SET    "reserved" = GREATEST(0, "reserved" - ${item.quantity})
      WHERE  "id" = ${item.ticketTypeId}
    `;
  }
}

/**
 * Convert reserved inventory to sold (called after payment confirmed).
 */
export async function confirmInventory(items: CartItem[]): Promise<void> {
  for (const item of items) {
    await prisma.$executeRaw`
      UPDATE "TicketType"
      SET    "reserved" = GREATEST(0, "reserved" - ${item.quantity}),
             "sold"     = "sold" + ${item.quantity}
      WHERE  "id" = ${item.ticketTypeId}
    `;
  }
}
