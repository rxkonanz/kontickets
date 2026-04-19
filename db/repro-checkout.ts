// Isolates each Prisma call in createOrderIntent to pinpoint which one
// throws "Transactions are not supported in HTTP mode".
//
// Run with: npx tsx db/repro-checkout.ts

import { prisma } from "../lib/prisma";
import { nanoid } from "nanoid";

const FAKE_USER = {
  clerkId: `repro_${Date.now()}`,
  email: `repro+${Date.now()}@example.com`,
};

async function run(label: string, fn: () => Promise<unknown>) {
  process.stdout.write(`  ${label.padEnd(40)} `);
  try {
    await fn();
    console.log("✓ OK");
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`✗ FAIL → ${msg}`);
    return false;
  }
}

async function runFullCheckoutFlow() {
  console.log("\n=== Full createOrderIntent simulation ===\n");

  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED" },
    take: 1,
    include: { ticketTypes: { take: 1 } },
  });
  const event = events[0];
  const ticketType = event.ticketTypes[0];
  const clerkId = `flow_${Date.now()}`;
  let userId = "";
  let orderId = "";

  try {
    // Step 1: find-or-create user (patched upsert path)
    await run("1. find-or-create user", async () => {
      const existing = await prisma.user.findMany({
        where: { clerkId },
        take: 1,
      });
      if (existing.length === 0) {
        const u = await prisma.user.create({
          data: {
            clerkId,
            email: `${clerkId}@example.com`,
            firstName: "Flow",
            lastName: "Test",
            role: "BUYER",
          },
        });
        userId = u.id;
      } else {
        userId = existing[0].id;
      }
    });

    await run("2. validate ticketTypes (findMany)", () =>
      prisma.ticketType.findMany({
        where: { id: { in: [ticketType.id] }, eventId: event.id, isVisible: true },
      })
    );

    await run("3. reserve inventory (raw SQL)", async () => {
      await prisma.$executeRaw`
        UPDATE "ticket_types"
        SET "reserved" = "reserved" + 1
        WHERE "id" = ${ticketType.id}
          AND ("capacity" - "reserved" - "sold") >= 1
      `;
    });

    await run("4. create draft order", async () => {
      const o = await prisma.order.create({
        data: {
          userId,
          eventId: event.id,
          status: "DRAFT",
          subtotal: ticketType.price,
          fees: 0,
          tax: 0,
          total: ticketType.price,
          currency: "USD",
          idempotencyKey: nanoid(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });
      orderId = o.id;
    });

    await run("5. create order items (loop)", async () => {
      await prisma.orderItem.create({
        data: {
          orderId,
          ticketTypeId: ticketType.id,
          quantity: 1,
          unitPrice: ticketType.price,
          subtotal: ticketType.price,
        },
      });
    });

    await run("6. create payment record", () =>
      prisma.payment.create({
        data: {
          orderId,
          status: "INITIATED",
          provider: "stripe",
          providerPaymentId: `pi_flow_${nanoid()}`,
          amount: ticketType.price,
          currency: "USD",
        },
      })
    );

    await run("7. advance order to PENDING_PAYMENT", () =>
      prisma.order.update({
        where: { id: orderId },
        data: { status: "PENDING_PAYMENT" },
      })
    );
  } finally {
    console.log("\nCleanup...");
    if (orderId) {
      await prisma.$executeRaw`DELETE FROM "order_items" WHERE "orderId" = ${orderId}`;
      await prisma.$executeRaw`DELETE FROM "payments"    WHERE "orderId" = ${orderId}`;
      await prisma.$executeRaw`DELETE FROM "orders"      WHERE "id"      = ${orderId}`;
    }
    if (userId) {
      await prisma.$executeRaw`DELETE FROM "users" WHERE "id" = ${userId}`;
    }
    await prisma.$executeRaw`
      UPDATE "ticket_types" SET "reserved" = GREATEST(0, "reserved" - 1) WHERE "id" = ${ticketType.id}
    `;
    console.log("  cleaned up\n");
  }
}

async function main() {
  console.log("\n=== Prisma HTTP-mode checkout repro ===\n");

  // 1. findMany (baseline — known safe)
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED" },
    take: 1,
    include: { ticketTypes: { take: 1 } },
  });
  const event = events[0];
  if (!event || event.ticketTypes.length === 0) {
    console.error("No published event with ticket types found. Seed first.");
    process.exit(1);
  }
  const ticketType = event.ticketTypes[0];
  console.log(`Using event ${event.id} / ticketType ${ticketType.id}\n`);

  let userId = "";
  let orderId = "";

  try {
    // Create the user via raw SQL so we have a userId for downstream tests regardless
    const rawId = `repro_${Date.now()}`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO "users" ("id", "clerkId", "email", "firstName", "lastName", "role", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, 'Repro', 'User', 'BUYER'::"Role", NOW(), NOW())`,
      rawId,
      FAKE_USER.clerkId,
      FAKE_USER.email
    );
    userId = rawId;
    console.log(`  (seeded user via raw SQL: ${userId})\n`);

    await run("user.upsert (update branch)", async () => {
      await prisma.user.upsert({
        where: { clerkId: FAKE_USER.clerkId },
        update: { firstName: "Updated" },
        create: {
          clerkId: FAKE_USER.clerkId,
          email: FAKE_USER.email,
          role: "BUYER",
        },
      });
    });

    await run("user.upsert (empty update)", async () => {
      await prisma.user.upsert({
        where: { clerkId: FAKE_USER.clerkId },
        update: {},
        create: {
          clerkId: FAKE_USER.clerkId,
          email: FAKE_USER.email,
          role: "BUYER",
        },
      });
    });

    await run("ticketType.findMany (with where+eventId)", () =>
      prisma.ticketType.findMany({
        where: { id: { in: [ticketType.id] }, eventId: event.id, isVisible: true },
      })
    );

    await run("$executeRaw UPDATE inventory", async () => {
      await prisma.$executeRaw`
        UPDATE "ticket_types"
        SET "reserved" = "reserved" + 1
        WHERE "id" = ${ticketType.id}
          AND ("capacity" - "reserved" - "sold") >= 1
      `;
    });

    await run("order.create (singular)", async () => {
      const o = await prisma.order.create({
        data: {
          userId,
          eventId: event.id,
          status: "DRAFT",
          subtotal: ticketType.price,
          fees: 0,
          tax: 0,
          total: ticketType.price,
          currency: "USD",
          idempotencyKey: nanoid(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });
      orderId = o.id;
    });

    await run("orderItem.createMany", () =>
      prisma.orderItem.createMany({
        data: [
          {
            orderId,
            ticketTypeId: ticketType.id,
            quantity: 1,
            unitPrice: ticketType.price,
            subtotal: ticketType.price,
          },
        ],
      })
    );

    await run("orderItem.create (singular)", () =>
      prisma.orderItem.create({
        data: {
          orderId,
          ticketTypeId: ticketType.id,
          quantity: 1,
          unitPrice: ticketType.price,
          subtotal: ticketType.price,
        },
      })
    );

    await run("payment.create (singular)", () =>
      prisma.payment.create({
        data: {
          orderId,
          status: "INITIATED",
          provider: "stripe",
          providerPaymentId: `pi_repro_${nanoid()}`,
          amount: ticketType.price,
          currency: "USD",
        },
      })
    );

    await run("order.update ({where: {id}})", () =>
      prisma.order.update({
        where: { id: orderId },
        data: { status: "PENDING_PAYMENT" },
      })
    );

    await run("order.updateMany ({where: {id}})", () =>
      prisma.order.updateMany({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      })
    );
  } finally {
    // Cleanup
    console.log("\nCleanup...");
    if (orderId) {
      await prisma.$executeRaw`DELETE FROM "order_items" WHERE "orderId" = ${orderId}`;
      await prisma.$executeRaw`DELETE FROM "payments"    WHERE "orderId" = ${orderId}`;
      await prisma.$executeRaw`DELETE FROM "orders"      WHERE "id"      = ${orderId}`;
    }
    if (userId) {
      await prisma.$executeRaw`DELETE FROM "users" WHERE "id" = ${userId}`;
    }
    await prisma.$executeRaw`
      UPDATE "ticket_types" SET "reserved" = GREATEST(0, "reserved" - 1) WHERE "id" = ${ticketType.id}
    `;
    console.log("  cleaned up\n");
  }
}

main()
  .then(() => runFullCheckoutFlow())
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
