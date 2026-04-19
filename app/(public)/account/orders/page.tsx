export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { getOrdersByUser } from "@/server/queries/orders";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { formatRelative } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";

export default async function AccountOrdersPage() {
  const { userId } = await clerkAuth();
  if (!userId) redirect("/sign-in");

  // findUnique wraps in a transaction (unsupported in Prisma HTTP mode)
  const users = await prisma.user.findMany({
    where: { clerkId: userId },
    select: { id: true },
    take: 1,
  });
  const user = users[0];
  if (!user) redirect("/sign-in");

  const orders = await getOrdersByUser(user.id);

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Mis pedidos</h1>
          <p className="text-muted-foreground mt-1">
            {orders.length} pedido{orders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/account/tickets">Ver entradas</Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-12 h-12" />}
          title="Aún no tienes pedidos"
          description="Cuando realices una compra aparecerá aquí."
          action={
            <Button asChild className="gradient-brand-cta text-white border-0 hover:opacity-90">
              <Link href="/events">Explorar eventos</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{order.event.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatRelative(order.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={order.status} type="order" />
                </div>

                <div className="text-sm text-muted-foreground mb-4">
                  {order.items.map((item) => (
                    <p key={item.id}>
                      {item.quantity}× {item.ticketType.name}
                    </p>
                  ))}
                </div>

                <PriceDisplay
                  subtotal={order.subtotal}
                  fees={order.fees}
                  tax={order.tax}
                  total={order.total}
                  currency={order.currency}
                />

                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <p className="text-xs text-muted-foreground font-mono">
                    #{order.id.slice(-8).toUpperCase()}
                  </p>
                  {order.status === "CONFIRMED" && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/account/tickets">Ver entradas</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
