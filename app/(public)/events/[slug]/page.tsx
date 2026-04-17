import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getEventBySlug } from "@/server/queries/events";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatDatetime, formatPrice } from "@/lib/utils";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { Calendar, Clock, MapPin, Users, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Evento no encontrado" };
  return {
    title: event.title,
    description: event.description ?? undefined,
    openGraph: {
      images: event.coverImageUrl ? [event.coverImageUrl] : [],
    },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) notFound();

  const firstSession = event.sessions[0];
  const categoryLabel =
    EVENT_CATEGORIES.find((c) => c.value === event.category)?.label ?? event.category;
  const availableTicketTypes = event.ticketTypes.filter(
    (t) => t.isVisible && t.capacity > t.sold + t.reserved
  );

  return (
    <div>
      {/* Hero image */}
      <div className="relative w-full h-64 lg:h-96 bg-gradient-to-br from-[#0d0d5c] to-[#1a1a8f]">
        {event.coverImageUrl ? (
          <Image
            src={event.coverImageUrl}
            alt={event.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30">
            🎟️
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-6 left-6">
          <Badge className="bg-white/90 text-[#0d0d5c] mb-2">{categoryLabel}</Badge>
        </div>
      </div>

      {/* Back button */}
      <div className="container mx-auto px-4 pt-6">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-1">
          <Link href="/events">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Volver a eventos
          </Link>
        </Button>
      </div>

      <div className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Event info */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">{event.title}</h1>

            <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
              {firstSession && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#3b82f6]" />
                  <span>{formatDate(firstSession.startAt)}</span>
                </div>
              )}
              {firstSession?.startAt && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#3b82f6]" />
                  <span>{formatDatetime(firstSession.startAt)}</span>
                </div>
              )}
              {event.venue && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#3b82f6]" />
                  <span>
                    {event.venue.name}, {event.venue.city}
                  </span>
                </div>
              )}
              {event.organizer && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#3b82f6]" />
                  <span>Organizado por {event.organizer.name}</span>
                </div>
              )}
            </div>

            {event.description && (
              <div className="prose prose-slate max-w-none">
                <h2 className="text-lg font-semibold mb-3">Acerca del evento</h2>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </p>
              </div>
            )}

            {event.sessions.length > 1 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold mb-3">Fechas del evento</h2>
                <div className="space-y-2">
                  {event.sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border"
                    >
                      <Calendar className="w-4 h-4 text-[#3b82f6] shrink-0" />
                      <div>
                        {session.name && (
                          <p className="font-medium text-sm">{session.name}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {formatDatetime(session.startAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Ticket purchase */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="shadow-lg border-2">
                <CardContent className="p-6">
                  <h2 className="font-bold text-lg mb-4">Entradas</h2>

                  {availableTicketTypes.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <p className="font-medium">Entradas agotadas</p>
                      <p className="text-sm mt-1">No hay disponibilidad</p>
                    </div>
                  ) : (
                    <div className="space-y-3 mb-6">
                      {event.ticketTypes
                        .filter((t) => t.isVisible)
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((ticketType) => {
                          const available =
                            ticketType.capacity - ticketType.sold - ticketType.reserved;
                          const soldOut = available <= 0;

                          return (
                            <div
                              key={ticketType.id}
                              className={`p-4 rounded-xl border-2 ${
                                soldOut
                                  ? "opacity-60 border-dashed"
                                  : "border-[#06b6d4]/30 bg-cyan-50/50"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <p className="font-semibold text-sm">{ticketType.name}</p>
                                  {ticketType.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {ticketType.description}
                                    </p>
                                  )}
                                </div>
                                <p className="font-bold text-[#0d0d5c]">
                                  {ticketType.price === 0
                                    ? "Gratis"
                                    : formatPrice(ticketType.price)}
                                </p>
                              </div>
                              {soldOut ? (
                                <Badge variant="secondary" className="text-xs">
                                  Agotado
                                </Badge>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  {available} disponibles
                                </p>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}

                  <Separator className="my-4" />

                  <Button
                    size="lg"
                    className="w-full gradient-brand-cta text-white border-0 hover:opacity-90"
                    disabled={availableTicketTypes.length === 0}
                    asChild={availableTicketTypes.length > 0}
                  >
                    {availableTicketTypes.length > 0 ? (
                      <Link
                        href={`/checkout?eventId=${event.id}`}
                      >
                        Comprar entradas
                      </Link>
                    ) : (
                      <span>Sin disponibilidad</span>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground mt-3">
                    Pago seguro. Entradas digitales al instante.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
