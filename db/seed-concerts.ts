import { config } from "dotenv";

config({ path: ".env.local" });
config();

import { PrismaClient } from "../lib/generated/prisma";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "";
const adapter = new PrismaNeonHttp(connectionString, {});
const prisma = new PrismaClient({ adapter } as never);

type VenueSeed = {
  name: string;
  slug: string;
  address: string;
  city: string;
  province: string;
  capacity: number;
};

type EventSeed = {
  title: string;
  slug: string;
  description: string;
  venueSlug: string;
  sessionStart: Date;
};

const venues: VenueSeed[] = [
  {
    name: "Teatro Nacional Sucre",
    slug: "teatro-nacional-quito",
    address: "Manabí OE1-166 y Guayaquil",
    city: "Quito",
    province: "Pichincha",
    capacity: 1200,
  },
  {
    name: "Centro de Convenciones Simón Bolívar",
    slug: "centro-convenciones-simon-bolivar-gye",
    address: "Av. de las Américas y Kennedy",
    city: "Guayaquil",
    province: "Guayas",
    capacity: 4000,
  },
  {
    name: "Teatro Pumapungo",
    slug: "teatro-pumapungo-cuenca",
    address: "Calle Larga y Huayna Cápac",
    city: "Cuenca",
    province: "Azuay",
    capacity: 600,
  },
  {
    name: "Quinta La Liria",
    slug: "quinta-la-liria-ambato",
    address: "Av. Los Capulíes y Montalvo",
    city: "Ambato",
    province: "Tungurahua",
    capacity: 2500,
  },
];

const events: EventSeed[] = [
  {
    title: "Juan Fernando Velasco — Gira Para Siempre",
    slug: "juan-fernando-velasco-gira-para-siempre-quito",
    description:
      "Una noche inolvidable con los clásicos de Juan Fernando Velasco en el emblemático Teatro Nacional Sucre. Vive sus mejores éxitos en formato acústico y con banda completa, rodeado del encanto del centro histórico de Quito.",
    venueSlug: "teatro-nacional-quito",
    sessionStart: new Date("2026-06-14T20:00:00-05:00"),
  },
  {
    title: "Mirella Cesa — Noche de Andipop",
    slug: "mirella-cesa-noche-andipop-guayaquil",
    description:
      "La reina del andipop llega a Guayaquil con una producción espectacular que mezcla raíces andinas y pop moderno. Prepárate para cantar, bailar y vibrar con sus mayores éxitos.",
    venueSlug: "centro-convenciones-simon-bolivar-gye",
    sessionStart: new Date("2026-07-05T21:00:00-05:00"),
  },
  {
    title: "Nicola Cruz — Raíces Andinas en Vivo",
    slug: "nicola-cruz-raices-andinas-cuenca",
    description:
      "Un viaje sonoro entre la electrónica contemporánea y los ritmos ancestrales del Ecuador. Nicola Cruz llega a Cuenca para una noche hipnótica en Teatro Pumapungo.",
    venueSlug: "teatro-pumapungo-cuenca",
    sessionStart: new Date("2026-08-02T20:30:00-05:00"),
  },
  {
    title: "Daniel Betancourth — Acústico",
    slug: "daniel-betancourth-acustico-ambato",
    description:
      "El querido cantautor ecuatoriano presenta un concierto íntimo y acústico en Quinta La Liria. Las canciones que te han acompañado durante años, ahora en vivo y cerca de ti.",
    venueSlug: "quinta-la-liria-ambato",
    sessionStart: new Date("2026-06-28T20:00:00-05:00"),
  },
];

const tiers = [
  {
    name: "General",
    description: "Acceso general. Asientos libres o zona de pie.",
    price: 50,
    capacity: 200,
    sortOrder: 0,
    perks: [] as string[],
  },
  {
    name: "Premium",
    description: "Asiento numerado en zona preferencial.",
    price: 99,
    capacity: 100,
    sortOrder: 1,
    perks: ["Asiento numerado", "Entrada preferencial"],
  },
  {
    name: "VIP",
    description: "Acceso VIP con mejor ubicación y beneficios exclusivos.",
    price: 150,
    capacity: 30,
    sortOrder: 2,
    perks: ["Asiento VIP", "Meet & greet (cuando aplique)", "Kit de bienvenida"],
  },
];

async function main() {
  console.log("Seeding 4 additional concert events...\n");

  const seedUserRows = await prisma.user.findMany({
    where: { clerkId: "seed_organizer" },
    take: 1,
  });
  const seedUser = seedUserRows[0];
  if (!seedUser) {
    console.error("✗ Seed organizer user missing — run `npx tsx db/seed.ts` first.");
    process.exit(1);
  }

  const organizerRows = await prisma.organizer.findMany({
    where: { userId: seedUser.id },
    take: 1,
  });
  const organizer = organizerRows[0];
  if (!organizer) {
    console.error("✗ Seed organizer record missing — run `npx tsx db/seed.ts` first.");
    process.exit(1);
  }
  console.log(`✓ Using organizer: ${organizer.name}\n`);

  const venueIdBySlug = new Map<string, string>();
  for (const v of venues) {
    const existing = await prisma.venue.findMany({
      where: { slug: v.slug },
      take: 1,
    });
    if (existing[0]) {
      venueIdBySlug.set(v.slug, existing[0].id);
      console.log(`  ↻ Venue exists: ${v.name}`);
    } else {
      const created = await prisma.venue.create({
        data: {
          name: v.name,
          slug: v.slug,
          address: v.address,
          city: v.city,
          province: v.province,
          country: "Ecuador",
          capacity: v.capacity,
        },
      });
      venueIdBySlug.set(v.slug, created.id);
      console.log(`  + Venue created: ${v.name} (${v.city})`);
    }
  }
  console.log("");

  for (const e of events) {
    const venueId = venueIdBySlug.get(e.venueSlug);
    if (!venueId) {
      console.error(`✗ Venue ${e.venueSlug} not found, skipping ${e.title}`);
      continue;
    }

    const existingEventRows = await prisma.event.findMany({
      where: { slug: e.slug },
      take: 1,
    });
    let event = existingEventRows[0];
    if (!event) {
      event = await prisma.event.create({
        data: {
          organizerId: organizer.id,
          venueId,
          title: e.title,
          slug: e.slug,
          description: e.description,
          category: "CONCERT",
          status: "PUBLISHED",
          coverImageUrl: "/test-event.jpg",
          publishedAt: new Date(),
        },
      });
      console.log(`✓ Event created: ${event.title}`);
    } else {
      console.log(`↻ Event exists: ${event.title}`);
    }

    const existingSessions = await prisma.eventSession.findMany({
      where: { eventId: event.id },
      take: 1,
    });
    if (existingSessions.length === 0) {
      await prisma.eventSession.create({
        data: {
          eventId: event.id,
          startAt: e.sessionStart,
          timezone: "America/Guayaquil",
        },
      });
      console.log(`  + Session @ ${e.sessionStart.toISOString()}`);
    } else {
      console.log(`  ↻ Session already exists`);
    }

    for (const tier of tiers) {
      const existingTts = await prisma.ticketType.findMany({
        where: { eventId: event.id, name: tier.name },
        take: 1,
      });
      if (existingTts.length === 0) {
        await prisma.ticketType.create({
          data: {
            eventId: event.id,
            name: tier.name,
            description: tier.description,
            price: tier.price,
            capacity: tier.capacity,
            maxPerOrder: 10,
            minPerOrder: 1,
            sortOrder: tier.sortOrder,
            perks: tier.perks,
            isVisible: true,
          },
        });
        console.log(`  + Ticket: ${tier.name} ($${(tier.price / 100).toFixed(2)})`);
      } else {
        console.log(`  ↻ Ticket exists: ${tier.name}`);
      }
    }
    console.log("");
  }

  console.log("Seed complete. Visit /events to see all 5 events.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
