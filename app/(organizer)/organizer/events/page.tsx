import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { PlusCircle, Calendar, Edit } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
  ENDED: "bg-gray-100 text-gray-700",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  CANCELLED: "Cancelado",
  ENDED: "Finalizado",
};

export default async function OrganizerEventsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { organizer: true },
  });

  if (!user?.organizer) redirect("/organizer/dashboard");

  const events = await prisma.event.findMany({
    where: { organizerId: user.organizer.id },
    include: {
      sessions: { take: 1, orderBy: { startAt: "asc" } },
      _count: { select: { orders: true, ticketTypes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Mis eventos</h1>
          <p className="text-muted-foreground mt-1">{events.length} evento{events.length !== 1 ? "s" : ""}</p>
        </div>
        <Button className="gradient-brand-cta text-white border-0 hover:opacity-90" asChild>
          <Link href="/organizer/events/new">
            <PlusCircle className="w-4 h-4 mr-2" />
            Nuevo evento
          </Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-12 h-12" />}
          title="Aún no tienes eventos"
          description="Crea tu primer evento y empieza a vender entradas."
          action={
            <Button asChild className="gradient-brand-cta text-white border-0 hover:opacity-90">
              <Link href="/organizer/events/new">Crear evento</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const category = EVENT_CATEGORIES.find((c) => c.value === event.category);
            return (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{event.title}</h3>
                      <span
                        className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[event.status]}`}
                      >
                        {STATUS_LABELS[event.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {event.sessions[0] && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(event.sessions[0].startAt)}
                        </span>
                      )}
                      <span>{category?.label ?? event.category}</span>
                      <span>{event._count.orders} pedidos</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/organizer/events/${event.id}`}>
                        <Edit className="w-3.5 h-3.5 mr-1.5" />
                        Editar
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/organizer/events/${event.id}/attendees`}>Asistentes</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
