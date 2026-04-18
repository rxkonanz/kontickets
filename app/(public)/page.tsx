export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EventCard } from "@/components/shared/EventCard";
import { getEvents } from "@/server/queries/events";
import { EVENT_CATEGORIES, ECUADOR_CITIES } from "@/lib/constants";
import { ArrowRight, MapPin, Zap } from "lucide-react";

export default async function HomePage() {
  const events = await getEvents({ status: "PUBLISHED", limit: 8 });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#01013b] text-white py-20 lg:py-32">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-1/4 w-72 h-72 rounded-full bg-[#06b6d4] blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-[#e040fb] blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="flex justify-center mb-2">
            <Image
              src="/logo.png"
              alt="Kontickets"
              width={280}
              height={280}
              className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 object-contain"
              priority
            />
          </div>

          <Badge className="mb-6 bg-white/10 text-white border-white/20 hover:bg-white/20">
            <Zap className="w-3 h-3 mr-1.5" />
            Entradas digitales instantáneas
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Vive los mejores{" "}
            <span className="text-gradient-cta">eventos</span>
            <br />
            de Ecuador
          </h1>

          <p className="text-xl text-blue-200 max-w-2xl mx-auto mb-10">
            Conciertos, conferencias, festivales y más. Compra tus entradas en segundos.
          </p>

          <div className="flex justify-center">
            <Button
              size="lg"
              className="gradient-brand-cta text-white border-0 hover:opacity-90 text-base px-8"
              asChild
            >
              <Link href="/events">
                Explorar eventos
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-slate-50 border-b">
        <div className="container mx-auto px-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 rounded-full"
              asChild
            >
              <Link href="/events">Todos</Link>
            </Button>
            {EVENT_CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                variant="outline"
                size="sm"
                className="shrink-0 rounded-full"
                asChild
              >
                <Link href={`/events?category=${cat.value}`}>{cat.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured events */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Eventos destacados</h2>
              <p className="text-muted-foreground mt-1">Los eventos más populares del momento</p>
            </div>
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link href="/events">
                Ver todos <ArrowRight className="ml-1.5 w-4 h-4" />
              </Link>
            </Button>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg mb-2">Próximamente nuevos eventos</p>
              <p className="text-sm">¡Vuelve pronto!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline" asChild>
              <Link href="/events">Ver todos los eventos</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold">Eventos por ciudad</h2>
            <p className="text-muted-foreground mt-2">Encuentra eventos cerca de ti</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {ECUADOR_CITIES.slice(0, 10).map((city) => (
              <Link
                key={city}
                href={`/events?city=${city}`}
                className="flex items-center gap-2 p-4 rounded-xl bg-white border hover:border-[#3b82f6] hover:shadow-md transition-all group"
              >
                <MapPin className="w-4 h-4 text-[#3b82f6] shrink-0" />
                <span className="text-sm font-medium group-hover:text-[#3b82f6] transition-colors">
                  {city}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
