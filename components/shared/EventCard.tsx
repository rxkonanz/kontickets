import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatPrice } from "@/lib/utils";
import { EVENT_CATEGORIES } from "@/lib/constants";
import type { EventWithDetails } from "@/types";

interface EventCardProps {
  event: EventWithDetails;
}

export function EventCard({ event }: EventCardProps) {
  const firstSession = event.sessions[0];
  const lowestPrice = event.ticketTypes.length
    ? Math.min(...event.ticketTypes.map((t) => t.price))
    : null;
  const categoryLabel =
    EVENT_CATEGORIES.find((c) => c.value === event.category)?.label ?? event.category;

  return (
    <Link href={`/events/${event.slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full">
        {/* Cover image */}
        <div className="relative aspect-[16/9] bg-gradient-to-br from-[#0d0d5c] to-[#1a1a8f] overflow-hidden">
          {event.coverImageUrl ? (
            <Image
              src={event.coverImageUrl}
              alt={event.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl">🎟️</span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge className="bg-white/90 text-[#0d0d5c] text-xs font-semibold">
              {categoryLabel}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-base leading-tight line-clamp-2 mb-2 group-hover:text-[#3b82f6] transition-colors">
            {event.title}
          </h3>

          {firstSession && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>{formatDate(firstSession.startAt)}</span>
            </div>
          )}

          {event.venue && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {event.venue.name}, {event.venue.city}
              </span>
            </div>
          )}

          {lowestPrice !== null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Desde</span>
              <span className="font-bold text-[#0d0d5c]">
                {lowestPrice === 0 ? "Gratis" : formatPrice(lowestPrice)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
