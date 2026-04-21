// Find every order with quantity > 1 and show its ticket situation.
// Run: npx tsx --env-file=.env.local db/find-multi-ticket.ts

import { prisma } from "../lib/prisma";
import { stripe } from "../lib/stripe";

async function main() {
  // Get all orders + items, filter to qty>1 after
  const orders = await prisma.order.findMany({
    include: {
      event: { select: { title: true } },
      user: { select: { email: true } },
      items: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const multi = orders.filter((o) =>
    o.items.some((i) => i.quantity > 1) || o.items.length > 1
  );

  console.log(`\n=== ${multi.length} orders with multiple tickets ===\n`);

  for (const o of multi) {
    const totalQty = o.items.reduce((a, i) => a + i.quantity, 0);
    const tickets = await prisma.ticket.findMany({
      where: { orderId: o.id },
      select: { code: true, status: true, ticketTypeId: true },
    });

    console.log(`Order ${o.id}`);
    console.log(`  user        ${o.user.email}`);
    console.log(`  status      ${o.status}`);
    console.log(`  total       $${(o.total / 100).toFixed(2)}`);
    console.log(`  qty total   ${totalQty}  (in ${o.items.length} item rows)`);
    console.log(`  tickets DB  ${tickets.length}`);
    for (const t of tickets) {
      console.log(`    - ${t.status} ${t.code}`);
    }
    for (const p of o.payments) {
      if (!p.providerPaymentId) continue;
      try {
        const pi = await stripe.paymentIntents.retrieve(p.providerPaymentId);
        console.log(`  Stripe PI   ${p.providerPaymentId} — ${pi.status}`);
      } catch {}
    }
    console.log();
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
