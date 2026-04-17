import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { Users, Ticket, Edit, ExternalLink } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrganizerEventPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { organizer: true },
  });
  if (!user?.organizer) redirect("/organizer/dashboard");

  const event = await prisma.event.findFirst({
    where: { id, organizerId: user.organizer.id },
    include: {
      sessions: { orderBy: { startAt: "asc" } },
      ticketTypes: {
        include: { _count: { select: { orderItems: true } } },
        orderBy: { sortOrder: "asc" },
      },
      _count: { select: { orders: true } },
    },
  });

  if (!event) notFound();

  const confirmedOrders = await prisma.order.count({
    where: { eventId: id, status: "CONFIRMED" },
  });

  const revenue = await prisma.order.aggregate({
    where: { eventId: id, status: "CONFIRMED" },
    _sum: { total: true },
  });

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              className={
                event.status === "PUBLISHED"
                  ? "bg-emerald-100 text-emerald-700"
                  : event.status === "DRAFT"
                  ? "bg-slate-100 text-slate-700"
                  : "bg-red-100 text-red-700"
              }
            >
              {event.status === "PUBLISHED" ? "Publicado" : event.status === "DRAFT" ? "Borrador" : event.status}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/events/${event.slug}`} target="_blank">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Ver página
            </Link>
          </Button>
          <Button size="sm" className="gradient-brand-cta text-white border-0 hover:opacity-90" asChild>
            <Link href={`/organizer/events/${event.id}/edit`}>
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[#0d0d5c]">{confirmedOrders}</p>
            <p className="text-xs text-muted-foreground mt-1">Pedidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[#0d0d5c]">
              {formatPrice(revenue._sum.total ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Ingresos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[#0d0d5c]">
              {event.ticketTypes.reduce((acc, t) => acc + t.sold, 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Entradas vendidas</p>
          </CardContent>
        </Card>
      </div>

      {/* Ticket types */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Tipos de entrada</CardTitle>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/organizer/events/${event.id}/tickets`}>Gestionar</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {event.ticketTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay tipos de entrada.{" "}
              <Link href={`/organizer/events/${event.id}/tickets`} className="text-[#3b82f6] hover:underline">
                Añadir entradas
              </Link>
            </p>
          ) : (
            <div className="divide-y">
              {event.ticketTypes.map((tt) => (
                <div key={tt.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{tt.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {tt.sold}/{tt.capacity} vendidas
                    </p>
                  </div>
                  <p className="font-semibold">{formatPrice(tt.price)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 flex gap-3">
        <Button variant="outline" asChild>
          <Link href={`/organizer/events/${event.id}/attendees`}>
            <Users className="w-4 h-4 mr-2" />
            Ver asistentes
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/organizer/events/${event.id}/check-in`}>
            <Ticket className="w-4 h-4 mr-2" />
            Check-in
          </Link>
        </Button>
      </div>
    </div>
  );
}
