import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { Users, Calendar, ShoppingBag, DollarSign } from "lucide-react";

export default async function AdminDashboardPage() {
  const [totalUsers, totalEvents, totalOrders, totalRevenue] = await Promise.all([
    prisma.user.count(),
    prisma.event.count(),
    prisma.order.count({ where: { status: "CONFIRMED" } }),
    prisma.order.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { total: true },
    }),
  ]);

  const pendingOrganizers = await prisma.organizer.count({
    where: { status: "PENDING" },
  });

  const stats = [
    {
      label: "Usuarios totales",
      value: totalUsers,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Eventos",
      value: totalEvents,
      icon: Calendar,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Pedidos confirmados",
      value: totalOrders,
      icon: ShoppingBag,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Ingresos totales",
      value: formatPrice(totalRevenue._sum.total ?? 0),
      icon: DollarSign,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard de Administración</h1>
        <p className="text-muted-foreground mt-1">Vista general de la plataforma</p>
      </div>

      {pendingOrganizers > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          ⚠️ Hay <strong>{pendingOrganizers}</strong> organizador{pendingOrganizers > 1 ? "es" : ""} pendiente{pendingOrganizers > 1 ? "s" : ""} de aprobación.{" "}
          <a href="/admin/organizers" className="underline font-medium">Revisar ahora</a>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
