import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { Calendar, Ticket, DollarSign, Users, PlusCircle } from "lucide-react";

export default async function OrganizerDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { organizer: true },
  });

  if (!user?.organizer) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h2 className="text-xl font-semibold mb-3">Configura tu perfil de organizador</h2>
        <p className="text-muted-foreground mb-6">
          Para crear y gestionar eventos necesitas un perfil de organizador.
        </p>
        <Button className="gradient-brand-cta text-white border-0">
          Crear perfil de organizador
        </Button>
      </div>
    );
  }

  const organizer = user.organizer;

  // Stats
  const [totalEvents, totalOrders, totalRevenue, totalAttendees] = await Promise.all([
    prisma.event.count({ where: { organizerId: organizer.id } }),
    prisma.order.count({
      where: { event: { organizerId: organizer.id }, status: "CONFIRMED" },
    }),
    prisma.order.aggregate({
      where: { event: { organizerId: organizer.id }, status: "CONFIRMED" },
      _sum: { total: true },
    }),
    prisma.ticket.count({
      where: { order: { event: { organizerId: organizer.id } }, status: "ISSUED" },
    }),
  ]);

  const stats = [
    {
      label: "Eventos",
      value: totalEvents,
      icon: Calendar,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Pedidos confirmados",
      value: totalOrders,
      icon: Ticket,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Ingresos",
      value: formatPrice(totalRevenue._sum.total ?? 0),
      icon: DollarSign,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Asistentes",
      value: totalAttendees,
      icon: Users,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  const recentEvents = await prisma.event.findMany({
    where: { organizerId: organizer.id },
    include: {
      sessions: { take: 1, orderBy: { startAt: "asc" } },
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">{organizer.name}</p>
        </div>
        <Button
          className="gradient-brand-cta text-white border-0 hover:opacity-90"
          asChild
        >
          <Link href="/organizer/events/new">
            <PlusCircle className="w-4 h-4 mr-2" />
            Nuevo evento
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
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

      {/* Recent events */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Eventos recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aún no tienes eventos.{" "}
              <Link href="/organizer/events/new" className="text-[#3b82f6] hover:underline">
                Crear tu primer evento
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{event.status.toLowerCase()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">{event._count.orders} pedidos</span>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/organizer/events/${event.id}`}>Ver</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
