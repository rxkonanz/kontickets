import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { PrismaClient } from "../lib/generated/prisma";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const adapter = new PrismaNeonHttp(
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  {}
);
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  const event = await prisma.event.update({
    where: { slug: "test-evento-kontickets" },
    data: {
      title: "Buebele - Prueba!",
      category: "COMEDY",
      // Bump createdAt so it sorts first (newest)
      createdAt: new Date(),
    },
  });
  console.log("✓ Event updated:", event.title, "| category:", event.category);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
