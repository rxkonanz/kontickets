import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t bg-[#0d0d5c] text-white">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <Image
                src="/logo.png"
                alt="Kontickets"
                width={32}
                height={32}
                className="rounded-md"
              />
              <span className="font-bold text-lg">Kontickets</span>
            </Link>
            <p className="text-sm text-blue-200">
              La plataforma de entradas para eventos en Ecuador.
            </p>
          </div>

          {/* Explorar */}
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-blue-300">
              Explorar
            </h3>
            <ul className="space-y-2 text-sm text-blue-200">
              <li>
                <Link href="/events" className="hover:text-white transition-colors">
                  Todos los eventos
                </Link>
              </li>
              <li>
                <Link href="/events?category=CONCERT" className="hover:text-white transition-colors">
                  Conciertos
                </Link>
              </li>
              <li>
                <Link href="/events?category=CONFERENCE" className="hover:text-white transition-colors">
                  Conferencias
                </Link>
              </li>
              <li>
                <Link href="/events?category=FESTIVAL" className="hover:text-white transition-colors">
                  Festivales
                </Link>
              </li>
            </ul>
          </div>

          {/* Organizadores */}
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-blue-300">
              Organizadores
            </h3>
            <ul className="space-y-2 text-sm text-blue-200">
              <li>
                <Link href="/organizer/dashboard" className="hover:text-white transition-colors">
                  Mi dashboard
                </Link>
              </li>
              <li>
                <Link href="/organizer/events/new" className="hover:text-white transition-colors">
                  Crear evento
                </Link>
              </li>
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-blue-300">
              Ayuda
            </h3>
            <ul className="space-y-2 text-sm text-blue-200">
              <li>
                <Link href="/account/tickets" className="hover:text-white transition-colors">
                  Mis entradas
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="hover:text-white transition-colors">
                  Mis pedidos
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-blue-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-blue-300">
            © {new Date().getFullYear()} Kontickets. Todos los derechos reservados.
          </p>
          <p className="text-xs text-blue-300">Ecuador 🇪🇨</p>
        </div>
      </div>
    </footer>
  );
}
