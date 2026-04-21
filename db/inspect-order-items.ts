// Deep-dive on orders — show item quantities and per-order ticket counts.
// Also queries Stripe for PI status to reveal webhook failures.
// Run: npx tsx --env-file=.env.local db/inspect-order-items.ts

import { prisma } from "../lib/prisma";
import { stripe } from "../lib/stripe";

async function main() {
  const orders = await prisma.order.findMany({
    include: {
      event: { select: { title: true } },
      user: { select: { email: true } },
      items: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  console.log("");
  for (const o of orders) {
    const totalQty = o.items.reduce((acc, i) => acc + i.quantity, 0);
    const tickets = await prisma.ticket.findMany({
      where: { orderId: o.id },
      select: { code: true, status: true },
    });

    console.log(`Order ${o.id}`);
    console.log(`  user           ${o.user.email}`);
    console.log(`  status         ${o.status}`);
    console.log(`  total          $${(o.total / 100).toFixed(2)}`);
    console.log(`  rows           ${o.items.length} (total qty: ${totalQty})`);
    for (const item of o.items) {
      console.log(`    → ticketType=${item.ticketTypeId}  qty=${item.quantity}`);
    }
    console.log(`  tickets in DB  ${tickets.length}`);

    // Query Stripe for each payment intent's actual status
    for (const p of o.payments) {
      if (!p.providerPaymentId) continue;
      try {
        const pi = await stripe.paymentIntents.retrieve(p.providerPaymentId);
        const flag =
          pi.status === "succeeded"
            ? "💰 PAID"
            : pi.status === "requires_payment_method"
            ? "⚠️  no payment method"
            : pi.status;
        console.log(`  Stripe PI      ${p.providerPaymentId} — ${flag}`);
      } catch (e) {
        console.log(`  Stripe PI      ${p.providerPaymentId} — ERROR ${e}`);
      }
    }
    console.log("");
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
