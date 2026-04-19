// Shows the most recent orders + payments + tickets to diagnose checkout issues.
// Run: npx tsx --env-file=.env.local db/inspect-orders.ts

import { prisma } from "../lib/prisma";

async function main() {
  const orders = await prisma.order.findMany({
    include: {
      event: { select: { title: true } },
      user: { select: { email: true, firstName: true } },
      items: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  console.log(`\n=== Last ${orders.length} orders ===\n`);
  for (const o of orders) {
    console.log(`Order ${o.id}`);
    console.log(`  user       ${o.user.email} (${o.user.firstName ?? "—"})`);
    console.log(`  event      ${o.event.title}`);
    console.log(`  status     ${o.status}`);
    console.log(`  total      ${(o.total / 100).toFixed(2)} ${o.currency}`);
    console.log(`  created    ${o.createdAt.toISOString()}`);
    console.log(`  confirmed  ${o.confirmedAt?.toISOString() ?? "—"}`);
    console.log(`  items      ${o.items.length}`);
    console.log(`  payments:`);
    for (const p of o.payments) {
      console.log(`    - ${p.status.padEnd(16)} ${p.providerPaymentId ?? "—"}`);
    }
    const tickets = await prisma.ticket.findMany({
      where: { orderId: o.id },
      select: { id: true, code: true, status: true },
    });
    console.log(`  tickets    ${tickets.length}`);
    for (const t of tickets) {
      console.log(`    - ${t.status.padEnd(10)} ${t.code}`);
    }
    console.log();
  }

  // Ticket type reservation state for the test event
  const tts = await prisma.ticketType.findMany({
    select: { id: true, name: true, capacity: true, reserved: true, sold: true },
    take: 5,
  });
  console.log("=== Ticket inventory ===\n");
  for (const tt of tts) {
    console.log(
      `  ${tt.name.padEnd(40)} cap=${tt.capacity} reserved=${tt.reserved} sold=${tt.sold}`
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
