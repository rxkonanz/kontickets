import { prisma } from "@/lib/prisma";
import type { OrderWithDetails } from "@/types";

export async function getOrderById(id: string): Promise<OrderWithDetails | null> {
  return prisma.order.findUnique({
    where: { id },
    include: {
      event: true,
      items: {
        include: { ticketType: true },
      },
      payments: true,
      tickets: true,
    },
  }) as Promise<OrderWithDetails | null>;
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
