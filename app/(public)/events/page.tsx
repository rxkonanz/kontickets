import { Suspense } from "react";
import { EventCard } from "@/components/shared/EventCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getEvents } from "@/server/queries/events";
import { EVENT_CATEGORIES, ECUADOR_CITIES } from "@/lib/constants";
import { EmptyState } from "@/components/shared/EmptyState";
import { Search } from "lucide-react";
import Link from "next/link";
import type { EventCategory } from "@/types";

interface SearchParams {
  category?: string;
  city?: string;
  q?: string;
  page?: string;
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const events = await getEvents({
    status: "PUBLISHED",
    category: params.category as EventCategory | undefined,
    city: params.city,
    q: params.q,
  });

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="bg-gradient-to-r from-[#0d0d5c] to-[#1a1a8f] text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-3">Eventos en Ecuador</h1>
          <p className="text-blue-200">
            {events.length} evento{events.length !== 1 ? "s" : ""} disponible
            {events.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="lg:w-64 shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Search */}
              <div>
                <h3 className="font-semibold mb-3 text-sm">Buscar</h3>
                <form>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      name="q"
                      placeholder="Nombre del evento..."
                      defaultValue={params.q}
                      className="pl-9"
                    />
                  </div>
                </form>
              </div>

              {/* Categories */}
              <div>
                <h3 className="font-semibold mb-3 text-sm">Categoría</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={!params.category ? "default" : "outline"}
                    size="sm"
                    className="rounded-full text-xs h-7"
                    asChild
                  >
                    <Link href="/events">Todos</Link>
                  </Button>
                  {EVENT_CATEGORIES.map((cat) => (
                    <Button
                      key={cat.value}
                      variant={params.category === cat.value ? "default" : "outline"}
                      size="sm"
                      className="rounded-full text-xs h-7"
                      asChild
                    >
                      <Link href={`/events?category=${cat.value}${params.city ? `&city=${params.city}` : ""}`}>
                        {cat.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Cities */}
              <div>
                <h3 className="font-semibold mb-3 text-sm">Ciudad</h3>
                <div className="flex flex-col gap-1">
                  {ECUADOR_CITIES.map((city) => (
                    <Button
                      key={city}
                      variant={params.city === city ? "default" : "ghost"}
                      size="sm"
                      className="justify-start rounded-lg text-sm h-8"
                      asChild
                    >
                      <Link href={`/events?city=${city}${params.category ? `&category=${params.category}` : ""}`}>
                        {city}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Events grid */}
          <div className="flex-1">
            {/* Active filters */}
            {(params.category || params.city || params.q) && (
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                <span className="text-sm text-muted-foreground">Filtros activos:</span>
                {params.category && (
                  <Badge variant="secondary">
                    {EVENT_CATEGORIES.find((c) => c.value === params.category)?.label}
                  </Badge>
                )}
                {params.city && <Badge variant="secondary">{params.city}</Badge>}
                {params.q && <Badge variant="secondary">"{params.q}"</Badge>}
                <Button variant="ghost" size="sm" className="h-6 text-xs" asChild>
                  <Link href="/events">Limpiar filtros</Link>
                </Button>
              </div>
            )}

            {events.length === 0 ? (
              <EmptyState
                icon="🎟️"
                title="No encontramos eventos"
                description="Intenta cambiar los filtros o vuelve más tarde."
                action={
                  <Button asChild variant="outline">
                    <Link href="/events">Ver todos los eventos</Link>
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
