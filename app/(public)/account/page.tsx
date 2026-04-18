export const dynamic = "force-dynamic";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UpdateNameForm } from "@/components/account/UpdateNameForm";
import { SignOutRow } from "@/components/account/SignOutRow";
import { prisma } from "@/lib/prisma";
import { ShoppingBag, Ticket, User, AlertTriangle, MapPin } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const email = user.emailAddresses[0]?.emailAddress ?? "";
  const hasName = !!(user.firstName?.trim() && user.lastName?.trim());
  const displayName = hasName
    ? `${user.firstName} ${user.lastName}`
    : email;

  // Stats + city — graceful fallback if DB not yet configured or webhook hasn't fired
  let orderCount = 0;
  let ticketCount = 0;
  let city: string | null = null;
  try {
    // Use findMany to avoid Prisma DataLoader transactions (unsupported in HTTP mode)
    const dbUsers = await prisma.user.findMany({
      where: { clerkId: userId },
      select: {
        city: true,
        _count: { select: { orders: true, tickets: true } },
      },
      take: 1,
    });
    const dbUser = dbUsers[0] ?? null;
    if (dbUser) {
      orderCount = dbUser._count.orders;
      ticketCount = dbUser._count.tickets;
      city = dbUser.city;
    }
  } catch {
    // DB not configured — ignore
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">

      {/* Profile header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            {user.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={displayName}
                width={80}
                height={80}
                className="rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#01013b] flex items-center justify-center shrink-0">
                <User className="w-9 h-9 text-white" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-bold truncate">{displayName}</h1>
              <p className="text-muted-foreground text-sm truncate">{email}</p>
              {city && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3" />
                  {city}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                Miembro desde {formatDate(new Date(user.createdAt))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Name prompt — only shown when name is missing */}
      {!hasName && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-amber-900">
                  Completa tu perfil
                </h2>
                <p className="text-sm text-amber-700 mt-0.5">
                  Agrega tu nombre y apellido para personalizar tu experiencia.
                </p>
              </div>
            </div>
            <UpdateNameForm
              defaultFirstName={user.firstName ?? ""}
              defaultLastName={user.lastName ?? ""}
            />
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-4xl font-bold text-[#0d0d5c]">{orderCount}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Pedido{orderCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-4xl font-bold text-[#0d0d5c]">{ticketCount}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Entrada{ticketCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button
          variant="outline"
          size="lg"
          className="h-16 flex-col gap-1.5"
          asChild
        >
          <Link href="/account/orders">
            <ShoppingBag className="w-5 h-5" />
            <span className="text-sm font-medium">Mis pedidos</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-16 flex-col gap-1.5 border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6]/5"
          asChild
        >
          <Link href="/account/tickets">
            <Ticket className="w-5 h-5" />
            <span className="text-sm font-medium">Mis entradas</span>
          </Link>
        </Button>
      </div>

      {/* Sign out */}
      <SignOutRow />
    </div>
  );
}
