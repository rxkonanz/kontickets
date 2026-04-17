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
import { Ticket, Calendar } from "lucide-react";

export default async function AccountTicketsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

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

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Mis entradas</h1>
          <p className="text-muted-foreground mt-1">
            {tickets.length} entrada{tickets.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/account/orders">Ver pedidos</Link>
        </Button>
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          icon={<Ticket className="w-12 h-12" />}
          title="Aún no tienes entradas"
          description="Cuando compres entradas aparecerán aquí."
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
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold line-clamp-2">
                        {ticket.order.event.title}
                      </h3>
                      <StatusBadge status={ticket.status} type="ticket" />
                    </div>

                    {ticket.order.event.sessions[0] && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(ticket.order.event.sessions[0].startAt)}</span>
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
