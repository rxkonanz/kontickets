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
  let userId: string | null = null;
  try {
    const authResult = await auth();
    userId = authResult.userId;
  } catch (err) {
    console.error("[CheckoutPage] auth() failed:", err);
    redirect("/sign-in");
  }
  if (!userId) redirect("/sign-in");

  const { eventId } = await searchParams;
  if (!eventId) redirect("/events");

  // Use findMany instead of findUnique — Prisma 7 with PrismaNeonHttp routes
  // findUnique through an internal DataLoader (singleLoader) that wraps queries
  // in a transaction, which is not supported in HTTP mode.
  let event;
  try {
    const events = await prisma.event.findMany({ where: { id: eventId }, take: 1 });
    event = events[0] ?? null;
  } catch (err) {
    console.error("[CheckoutPage] event lookup failed:", err);
    redirect("/events");
  }

  if (!event || event.status !== "PUBLISHED") redirect("/events");

  let venue = null;
  let ticketTypes: Awaited<ReturnType<typeof prisma.ticketType.findMany>> = [];
  try {
    [venue, ticketTypes] = await Promise.all([
      event.venueId
        ? prisma.venue.findMany({ where: { id: event.venueId }, take: 1 }).then((r) => r[0] ?? null)
        : null,
      prisma.ticketType.findMany({
        where: { eventId: event.id },
        orderBy: { sortOrder: "asc" },
      }),
    ]);
  } catch (err) {
    console.error("[CheckoutPage] venue/ticketTypes lookup failed:", err);
    redirect("/events");
  }

  const visibleTicketTypes = ticketTypes.filter((t) => t.isVisible);

  const availableTicketTypes = visibleTicketTypes.filter(
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
          venue: venue ? `${venue.name}, ${venue.city}` : null,
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
