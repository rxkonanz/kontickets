"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
} from "lucide-react";

const navItems = [
  { href: "/organizer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/organizer/events", label: "Eventos", icon: Calendar },
  { href: "/organizer/events/new", label: "Crear evento", icon: PlusCircle },
];

export function OrganizerNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-[#0d0d5c] text-white">
      <div className="flex h-16 items-center gap-2 px-5 border-b border-blue-800">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Kontickets" width={28} height={28} className="rounded" />
          <span className="font-bold text-sm">Kontickets</span>
        </Link>
      </div>

      <div className="px-3 py-2 text-xs uppercase tracking-wider text-blue-400 font-semibold mt-4 mb-1 px-4">
        Organizador
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-white/15 text-white"
                  : "text-blue-200 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-blue-800 flex items-center gap-3">
        <UserButton />
        <span className="text-xs text-blue-300 truncate">Mi cuenta</span>
      </div>
    </aside>
  );
}
