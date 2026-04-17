"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, Ticket } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Lazily use Clerk only when configured
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const clerkEnabled = clerkKey.startsWith("pk_") && !clerkKey.includes("placeholder");

// Conditionally import Clerk components
let ClerkUserButton: React.ComponentType<Record<string, unknown>> | null = null;
let ClerkSignInButton: React.ComponentType<{ children: React.ReactNode; mode?: string }> | null = null;
let ClerkSignUpButton: React.ComponentType<{ children: React.ReactNode; mode?: string }> | null = null;
let useClerkAuth: (() => { isSignedIn: boolean | undefined }) | null = null;

if (clerkEnabled) {
  const clerk = require("@clerk/nextjs");
  ClerkUserButton = clerk.UserButton;
  ClerkSignInButton = clerk.SignInButton;
  ClerkSignUpButton = clerk.SignUpButton;
  useClerkAuth = clerk.useAuth;
}

const navLinks = [
  { href: "/events", label: "Eventos" },
  { href: "/events?category=CONCERT", label: "Conciertos" },
  { href: "/events?category=CONFERENCE", label: "Conferencias" },
];

export function PublicNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const authState = clerkEnabled && useClerkAuth ? useClerkAuth() : { isSignedIn: false };
  const isSignedIn = authState.isSignedIn;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="font-bold text-xl text-[#0d0d5c]">
            Kontickets
          </span>
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
          {isSignedIn ? (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <Link href="/account/tickets">
                  <Ticket className="w-4 h-4 mr-1.5" />
                  Mis tickets
                </Link>
              </Button>
              {ClerkUserButton && <ClerkUserButton />}
            </>
          ) : (
            <>
              {clerkEnabled && ClerkSignInButton ? (
                <ClerkSignInButton mode="modal">
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    Iniciar sesión
                  </Button>
                </ClerkSignInButton>
              ) : (
                <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
                  <Link href="/sign-in">Iniciar sesión</Link>
                </Button>
              )}
              {clerkEnabled && ClerkSignUpButton ? (
                <ClerkSignUpButton mode="modal">
                  <Button
                    size="sm"
                    className="gradient-brand-cta text-white border-0 hover:opacity-90"
                  >
                    Registrarse
                  </Button>
                </ClerkSignUpButton>
              ) : (
                <Button
                  size="sm"
                  className="gradient-brand-cta text-white border-0 hover:opacity-90"
                  asChild
                >
                  <Link href="/sign-up">Registrarse</Link>
                </Button>
              )}
            </>
          )}

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
                  <Link
                    href="/account/tickets"
                    onClick={() => setOpen(false)}
                    className="text-base font-medium py-2 hover:text-[#3b82f6] transition-colors"
                  >
                    Mis tickets
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
