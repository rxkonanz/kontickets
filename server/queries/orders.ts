import { prisma } from "@/lib/prisma";
import type { OrderWithDetails } from "@/types";

export async function getOrderById(id: string): Promise<OrderWithDetails | null> {
  // Use findMany instead of findUnique to avoid Prisma DataLoader transactions
  const results = await prisma.order.findMany({
    where: { id },
    include: {
      event: true,
      items: {
        include: { ticketType: true },
      },
      payments: true,
      tickets: true,
    },
    take: 1,
  }) as OrderWithDetails[];
  return results[0] ?? null;
}

export async function getOrdersByUser(userId: string): Promise<OrderWithDetails[]> {
  return prisma.order.findMany({
    where: { userId },
    include: {
      event: true,
      items: {
        include: { ticketType: true },
      },
      payments: true,
      tickets: true,
    },
    orderBy: { createdAt: "desc" },
  }) as Promise<OrderWithDetails[]>;
}
