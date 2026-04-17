import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { prisma } from "@/lib/prisma";
import { formatRelative } from "@/lib/utils";
import { Users, ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AttendeesPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { organizer: true },
  });
  if (!user?.organizer) redirect("/organizer/dashboard");

  const event = await prisma.event.findFirst({
    where: { id, organizerId: user.organizer.id },
  });
  if (!event) notFound();

  const tickets = await prisma.ticket.findMany({
    where: { order: { eventId: id, status: "CONFIRMED" } },
    include: {
      attendee: true,
      checkIn: true,
      order: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="sm" asChild className="-ml-1">
          <Link href={`/organizer/events/${id}`}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Asistentes</h1>
          <p className="text-muted-foreground text-sm">
            {event.title} · {tickets.length} entradas
          </p>
        </div>
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="Sin asistentes aún"
          description="Los asistentes aparecerán cuando compren entradas."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left pb-3 pr-4 font-medium text-muted-foreground">Nombre</th>
                <th className="text-left pb-3 pr-4 font-medium text-muted-foreground">Entrada</th>
                <th className="text-left pb-3 pr-4 font-medium text-muted-foreground">Estado</th>
                <th className="text-left pb-3 font-medium text-muted-foreground">Check-in</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50">
                  <td className="py-3 pr-4">
                    {ticket.attendee ? (
                      <div>
                        <p className="font-medium">
                          {ticket.attendee.firstName} {ticket.attendee.lastName}
                        </p>
                        {ticket.attendee.email && (
                          <p className="text-xs text-muted-foreground">{ticket.attendee.email}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                    #{ticket.code.slice(-8)}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={ticket.status} type="ticket" />
                  </td>
                  <td className="py-3">
                    {ticket.checkIn ? (
                      <span className="text-emerald-600 font-medium text-xs">
                        ✓ {formatRelative(ticket.checkIn.scannedAt)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Pendiente</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
