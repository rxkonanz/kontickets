import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { PrismaClient } from "../lib/generated/prisma";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  const result = await prisma.ticketType.updateMany({
    where: { event: { slug: "test-evento-kontickets" } },
    data: { name: "Buebele, prueba esta compra! - RK" },
  });
  console.log("Updated:", result.count, "ticket type(s)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
