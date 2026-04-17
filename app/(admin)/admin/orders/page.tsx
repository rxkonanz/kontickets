import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatPrice, formatRelative } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      user: { select: { email: true, firstName: true, lastName: true } },
      event: { select: { title: true } },
      payments: { select: { status: true, providerPaymentId: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-muted-foreground mt-1">{orders.length} pedidos recientes</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-12 h-12" />}
          title="Sin pedidos"
          description="No hay pedidos en la plataforma aún."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left pb-3 pr-4 font-medium text-muted-foreground">Pedido</th>
                <th className="text-left pb-3 pr-4 font-medium text-muted-foreground">Usuario</th>
                <th className="text-left pb-3 pr-4 font-medium text-muted-foreground">Evento</th>
                <th className="text-left pb-3 pr-4 font-medium text-muted-foreground">Total</th>
                <th className="text-left pb-3 pr-4 font-medium text-muted-foreground">Estado</th>
                <th className="text-left pb-3 font-medium text-muted-foreground">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="py-3 pr-4">
                    <p className="font-mono text-xs">#{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">{formatRelative(order.createdAt)}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="text-xs">{order.user.email}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="text-xs max-w-[160px] truncate">{order.event.title}</p>
                  </td>
                  <td className="py-3 pr-4 font-semibold">
                    {formatPrice(order.total, order.currency)}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={order.status} type="order" />
                  </td>
                  <td className="py-3">
                    {order.status === "CONFIRMED" && (
                      <Button size="sm" variant="outline" className="text-xs h-7">
                        Reembolsar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
