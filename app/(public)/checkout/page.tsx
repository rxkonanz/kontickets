export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { eventId } = await searchParams;
  if (!eventId) redirect("/events");

  const event = await prisma.event.findUnique({
    where: { id: eventId, status: "PUBLISHED" },
    include: {
      venue: true,
      ticketTypes: {
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!event) redirect("/events");

  const availableTicketTypes = event.ticketTypes.filter(
    (t) => t.capacity > t.sold + t.reserved
  );

  if (availableTicketTypes.length === 0) redirect(`/events/${event.slug}`);

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">Checkout</h1>
      <p className="text-muted-foreground mb-8">{event.title}</p>
      <CheckoutForm
        event={{
          id: event.id,
          title: event.title,
          slug: event.slug,
          coverImageUrl: event.coverImageUrl ?? null,
          venue: event.venue ? `${event.venue.name}, ${event.venue.city}` : null,
        }}
        ticketTypes={availableTicketTypes.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description ?? null,
          price: t.price,
          available: t.capacity - t.sold - t.reserved,
          maxPerOrder: t.maxPerOrder,
        }))}
      />
    </div>
  );
}
