import { config } from "dotenv";

config({ path: ".env.local" });
config();

import { PrismaClient } from "../lib/generated/prisma";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "";
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  console.log("Seeding database...");

  // Venue
  const venue = await prisma.venue.upsert({
    where: { slug: "teatro-nacional-quito" },
    update: {},
    create: {
      name: "Teatro Nacional Sucre",
      slug: "teatro-nacional-quito",
      address: "Manabí OE1-166 y Guayaquil",
      city: "Quito",
      province: "Pichincha",
      capacity: 1200,
    },
  });
  console.log("✓ Venue:", venue.name);

  // Seed organizer user (placeholder — replaced when real user logs in)
  const seedUser = await prisma.user.upsert({
    where: { clerkId: "seed_organizer" },
    update: {},
    create: {
      clerkId: "seed_organizer",
      email: "organizer@kontickets.com",
      firstName: "Kontickets",
      lastName: "Team",
      role: "ORGANIZER",
    },
  });

  const organizer = await prisma.organizer.upsert({
    where: { userId: seedUser.id },
    update: {},
    create: {
      userId: seedUser.id,
      name: "Kontickets",
      slug: "kontickets",
      description: "Plataforma de entradas para eventos en Ecuador.",
      status: "APPROVED",
    },
  });
  console.log("✓ Organizer:", organizer.name);

  // Test event
  const event = await prisma.event.upsert({
    where: { slug: "test-evento-kontickets" },
    update: {
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
    create: {
      organizerId: organizer.id,
      venueId: venue.id,
      title: "Test Evento — Kontickets",
      slug: "test-evento-kontickets",
      description:
        "Evento de prueba para verificar el flujo de compra de entradas en Kontickets. ¡Bienvenido a la plataforma!",
      category: "OTHER",
      status: "PUBLISHED",
      coverImageUrl: "/test-event.jpg",
      publishedAt: new Date(),
    },
  });
  console.log("✓ Event:", event.title);

  // $0.99 ticket type (price in cents = 99)
  const existing = await prisma.ticketType.findFirst({
    where: { eventId: event.id, name: "Entrada General" },
  });

  if (!existing) {
    await prisma.ticketType.create({
      data: {
        eventId: event.id,
        name: "Entrada General",
        description: "Acceso general al evento de prueba",
        price: 99, // $0.99 in cents
        capacity: 100,
        maxPerOrder: 10,
        sortOrder: 0,
      },
    });
    console.log("✓ Ticket type: Entrada General — $0.99");
  } else {
    console.log("✓ Ticket type already exists — skipped");
  }

  console.log("\nSeed completed. Visit /events to see the test event.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
