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

  let event;
  try {
    // findUnique on id only — no transaction needed in HTTP mode.
    // Filtering by non-unique fields (status) triggers internal transactions
    // which PrismaNeonHttp does not support, so we check status in code.
    event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        venue: true,
        ticketTypes: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  } catch (err) {
    console.error("[CheckoutPage] prisma.event.findUnique failed:", err);
    redirect("/events");
  }

  if (!event || event.status !== "PUBLISHED") redirect("/events");

  // Filter visible ticket types in JS — avoids relation where clause
  // which also triggers internal transactions in HTTP mode
  event = { ...event, ticketTypes: event.ticketTypes.filter((t) => t.isVisible) };

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
