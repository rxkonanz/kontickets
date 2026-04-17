import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create a test venue
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

  console.log("Created venue:", venue.name);
  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
