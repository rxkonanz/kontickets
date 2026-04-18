"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, Ticket, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import Image from "next/image";

const navLinks = [
  { href: "/events", label: "Eventos" },
  { href: "/events?category=CONCERT", label: "Conciertos" },
  { href: "/events?category=CONFERENCE", label: "Conferencias" },
];

function SignedInContent() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />;
  }

  const name = user?.firstName?.trim();
  const imageUrl = user?.imageUrl;

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="hidden md:flex">
        <Link href="/account/tickets">
          <Ticket className="w-4 h-4 mr-1.5" />
          Mis tickets
        </Link>
      </Button>
      <Link
        href="/account"
        className="flex items-center gap-2.5 group"
        aria-label="Mi cuenta"
      >
        {name && (
          <span className="hidden sm:inline-block text-sm font-medium text-[#0d0d5c] group-hover:text-[#3b82f6] transition-colors">
            Hola, {name}
          </span>
        )}
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name ?? "Mi cuenta"}
            width={36}
            height={36}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-[#3b82f6]/20 group-hover:ring-[#3b82f6]/60 transition-all"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-[#0d0d5c] flex items-center justify-center ring-2 ring-[#3b82f6]/20 group-hover:ring-[#3b82f6]/60 transition-all">
            <UserIcon className="w-4 h-4 text-white" />
          </div>
        )}
      </Link>
    </>
  );
}

function SignedOutContent() {
  return (
    <>
      <SignInButton mode="modal" forceRedirectUrl="/onboarding">
        <Button variant="ghost" size="sm" className="hidden sm:flex">
          Iniciar sesión
        </Button>
      </SignInButton>
      <SignUpButton mode="modal" forceRedirectUrl="/onboarding">
        <Button
          size="sm"
          className="gradient-brand-cta text-white border-0 hover:opacity-90"
        >
          Registrarse
        </Button>
      </SignUpButton>
    </>
  );
}

function AuthSection() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) {
    // Render a placeholder to keep layout stable during hydration
    return <div className="w-9 h-9" />;
  }
  return isSignedIn ? <SignedInContent /> : <SignedOutContent />;
}

export function PublicNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { isSignedIn } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="font-bold text-xl text-[#0d0d5c]">Kontickets</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-[#3b82f6]",
                pathname === link.href
                  ? "text-[#3b82f6]"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth section */}
        <div className="flex items-center gap-3">
          <AuthSection />

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-4 mt-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="text-base font-medium py-2 hover:text-[#3b82f6] transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                {isSignedIn && (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setOpen(false)}
                      className="text-base font-medium py-2 hover:text-[#3b82f6] transition-colors"
                    >
                      Mi cuenta
                    </Link>
                    <Link
                      href="/account/tickets"
                      onClick={() => setOpen(false)}
                      className="text-base font-medium py-2 hover:text-[#3b82f6] transition-colors"
                    >
                      Mis tickets
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
