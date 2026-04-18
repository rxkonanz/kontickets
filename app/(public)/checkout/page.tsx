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

  // Use separate queries instead of findUnique+include — Prisma 7 HTTP mode
  // (PrismaNeonHttp) triggers internal transactions for findUnique with includes,
  // but simple findUnique/findMany without includes works fine.
  let event;
  try {
    event = await prisma.event.findUnique({ where: { id: eventId } });
  } catch (err) {
    console.error("[CheckoutPage] event lookup failed:", err);
    redirect("/events");
  }

  if (!event || event.status !== "PUBLISHED") redirect("/events");

  let venue = null;
  let ticketTypes: Awaited<ReturnType<typeof prisma.ticketType.findMany>> = [];
  try {
    [venue, ticketTypes] = await Promise.all([
      event.venueId ? prisma.venue.findUnique({ where: { id: event.venueId } }) : null,
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
