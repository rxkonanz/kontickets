export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TicketQRCode } from "@/components/shared/TicketQRCode";
import { EmptyState } from "@/components/shared/EmptyState";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Ticket as TicketIcon, Calendar, MapPin } from "lucide-react";

export default async function AccountTicketsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // findUnique wraps in a transaction (unsupported in Prisma HTTP mode)
  const users = await prisma.user.findMany({
    where: { clerkId: userId },
    select: { id: true },
    take: 1,
  });
  const user = users[0];
  if (!user) redirect("/sign-in");

  const tickets = await prisma.ticket.findMany({
    where: { userId: user.id },
    include: {
      order: {
        include: {
          event: {
            include: {
              sessions: { take: 1, orderBy: { startAt: "asc" } },
              venue: true,
            },
          },
        },
      },
      attendee: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Ticket has no direct relation to TicketType in schema — look up names separately
  const ticketTypeIds = Array.from(new Set(tickets.map((t) => t.ticketTypeId)));
  const ticketTypes =
    ticketTypeIds.length > 0
      ? await prisma.ticketType.findMany({
          where: { id: { in: ticketTypeIds } },
          select: { id: true, name: true },
        })
      : [];
  const ticketTypeNameById = new Map(ticketTypes.map((tt) => [tt.id, tt.name]));

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Mis tickets</h1>
        <p className="text-muted-foreground mt-1">
          {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
        </p>
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          icon={<TicketIcon className="w-12 h-12" />}
          title="Aún no tienes tickets"
          description="Cuando compres tickets aparecerán aquí."
          action={
            <Button asChild className="gradient-brand-cta text-white border-0 hover:opacity-90">
              <Link href="/events">Explorar eventos</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Event info */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="font-semibold text-lg leading-snug line-clamp-2">
                        {ticket.order.event.title}
                      </h3>
                      <StatusBadge status={ticket.status} type="ticket" />
                    </div>

                    <div className="inline-block px-2 py-0.5 rounded-full bg-[#3b82f6]/10 text-[#0d0d5c] text-xs font-medium mb-3">
                      {ticketTypeNameById.get(ticket.ticketTypeId) ?? "Entrada"}
                    </div>

                    {ticket.order.event.sessions[0] && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{formatDate(ticket.order.event.sessions[0].startAt)}</span>
                      </div>
                    )}

                    {ticket.order.event.venue && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {ticket.order.event.venue.name}
                          {ticket.order.event.venue.city
                            ? ` · ${ticket.order.event.venue.city}`
                            : ""}
                        </span>
                      </div>
                    )}

                    {ticket.attendee && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {ticket.attendee.firstName} {ticket.attendee.lastName}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground mt-3 font-mono">
                      #{ticket.code}
                    </p>
                  </div>

                  {/* QR code */}
                  {ticket.status === "ISSUED" && (
                    <div className="border-t sm:border-t-0 sm:border-l p-4 flex items-center justify-center bg-slate-50">
                      <TicketQRCode code={ticket.code} size={120} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
