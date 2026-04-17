import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { PlusCircle, ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TicketTypesPage({ params }: Props) {
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
    include: {
      ticketTypes: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!event) notFound();

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="sm" asChild className="-ml-1">
          <Link href={`/organizer/events/${id}`}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Tipos de entrada</h1>
          <p className="text-muted-foreground text-sm">{event.title}</p>
        </div>
      </div>

      {/* Existing ticket types */}
      {event.ticketTypes.length > 0 && (
        <div className="space-y-3 mb-8">
          {event.ticketTypes.map((tt) => (
            <Card key={tt.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{tt.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {tt.sold}/{tt.capacity} vendidas ·{" "}
                    {tt.reserved} reservadas
                  </p>
                </div>
                <p className="font-bold text-[#0d0d5c]">{formatPrice(tt.price)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add ticket type form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            Añadir tipo de entrada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <input type="hidden" name="eventId" value={id} />
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nombre *</Label>
                <Input name="name" placeholder="Ej: General, VIP, Estudiante" className="mt-1.5" required />
              </div>
              <div>
                <Label>Precio (USD) *</Label>
                <Input name="price" type="number" min="0" step="0.01" placeholder="0.00" className="mt-1.5" required />
              </div>
              <div>
                <Label>Capacidad *</Label>
                <Input name="capacity" type="number" min="1" placeholder="100" className="mt-1.5" required />
              </div>
              <div>
                <Label>Máx. por pedido</Label>
                <Input name="maxPerOrder" type="number" min="1" max="20" defaultValue="10" className="mt-1.5" />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full gradient-brand-cta text-white border-0 hover:opacity-90"
            >
              Guardar tipo de entrada
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
