import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { confirmInventory } from "./inventory";
// import { sendTicketConfirmationEmail } from "./email";
import type { CartItem } from "@/types";

/**
 * Issue tickets after payment is confirmed.
 * Called from the Stripe webhook handler only.
 *
 * NOTE: PrismaNeonHttp does NOT support interactive transactions.
 * We use sequential queries instead. The webhook handler should be
 * idempotent — we check order status before issuing.
 */
export async function issueTickets(orderId: string): Promise<void> {
  // 1. Load order + items (use findMany to avoid DataLoader transactions)
  const orders = await prisma.order.findMany({
    where: { id: orderId },
    include: {
      items: {
        include: { ticketType: true },
      },
    },
    take: 1,
  });

  const order = orders[0];
  if (!order) throw new Error(`Pedido no encontrado: ${orderId}`);

  // Idempotent — if already confirmed, skip
  if (order.status === "CONFIRMED") return;

  // 2. Issue one ticket per quantity in each order item
  for (const item of order.items) {
    const ticketData = Array.from({ length: item.quantity }, () => ({
      code: nanoid(12).toUpperCase(),
      orderId: order.id,
      userId: order.userId,
      ticketTypeId: item.ticketTypeId,
      status: "ISSUED" as const,
      issuedAt: new Date(),
    }));

    // createMany wraps in a transaction (unsupported in HTTP mode).
    // Loop of singular create() — OK for small N (tickets per order).
    for (const t of ticketData) {
      await prisma.ticket.create({ data: t });
    }
  }

  // 3. Confirm order
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "CONFIRMED",
      confirmedAt: new Date(),
    },
  });

  // 4. Update payment to PAID — raw SQL because updateMany wraps in a tx
  // and the where uses a non-unique composite filter.
  await prisma.$executeRaw`
    UPDATE "payments"
    SET    "status" = 'PAID', "paidAt" = NOW()
    WHERE  "orderId" = ${orderId}
      AND  "status" IN ('INITIATED', 'PENDING', 'AUTHORIZED')
  `;

  // 5. Confirm inventory (move reserved → sold)
  const cartItems: CartItem[] = order.items.map((item) => ({
    ticketTypeId: item.ticketTypeId,
    quantity: item.quantity,
  }));
  await confirmInventory(cartItems);

  // 6. Email ticket confirmation — disabled until Resend domain is verified.
  // await sendTicketConfirmationEmail(orderId);
}
