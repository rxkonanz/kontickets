import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate, formatRelative } from "@/lib/utils";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { Calendar, ExternalLink } from "lucide-react";
import Link from "next/link";

const STATUS_STYLES: Record<string, string> = {
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

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({
    include: {
      organizer: { select: { name: true } },
      sessions: { take: 1, orderBy: { startAt: "asc" } },
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Moderación de eventos</h1>
        <p className="text-muted-foreground mt-1">{events.length} eventos</p>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-12 h-12" />}
          title="Sin eventos"
          description="No hay eventos en la plataforma aún."
        />
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const category = EVENT_CATEGORIES.find((c) => c.value === event.category);
            return (
              <Card key={event.id}>
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold truncate">{event.title}</h3>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[event.status]}`}>
                        {STATUS_LABELS[event.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span>{event.organizer.name}</span>
                      <span>{category?.label}</span>
                      {event.sessions[0] && (
                        <span>{formatDate(event.sessions[0].startAt)}</span>
                      )}
                      <span>{event._count.orders} pedidos</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/events/${event.slug}`} target="_blank">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
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
