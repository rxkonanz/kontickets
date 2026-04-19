import { render } from "@react-email/components";
import { prisma } from "@/lib/prisma";
import { resend, resendEnabled, FROM_ADDRESS } from "@/lib/resend";
import { qrToDataUrl } from "@/lib/qr";
import TicketConfirmation from "@/emails/TicketConfirmation";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.kontickets.com";

const dateFmt = new Intl.DateTimeFormat("es-EC", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "America/Guayaquil",
});

const moneyFmt = (cents: number, currency: string) =>
  new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: currency || "USD",
  }).format(cents / 100);

/**
 * Send the ticket confirmation email for a given order.
 *
 * Safe to call after ticket issuance. Swallows (but logs) all errors —
 * email failure must NOT rollback ticket creation; the user can still
 * access their tickets in-app.
 */
export async function sendTicketConfirmationEmail(
  orderId: string
): Promise<void> {
  try {
    if (!resendEnabled || !resend) {
      console.log(
        `[email] RESEND_API_KEY not configured — skipping ticket email for order ${orderId}`
      );
      return;
    }

    // Load the full order graph. Separate queries to stay clear of HTTP-mode
    // transaction pitfalls on deep/nested includes.
    const orders = await prisma.order.findMany({
      where: { id: orderId },
      include: {
        event: { include: { venue: true, sessions: { take: 1, orderBy: { startAt: "asc" } } } },
        user: true,
      },
      take: 1,
    });
    const order = orders[0];
    if (!order || !order.user?.email) {
      console.warn(`[email] order ${orderId} not found or missing user email`);
      return;
    }

    const tickets = await prisma.ticket.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: "asc" },
    });
    if (tickets.length === 0) {
      console.warn(`[email] order ${orderId} has no tickets to send`);
      return;
    }

    // Ticket has no direct relation to TicketType in schema — look up names separately
    const ticketTypeIds = Array.from(new Set(tickets.map((t) => t.ticketTypeId)));
    const ticketTypes = await prisma.ticketType.findMany({
      where: { id: { in: ticketTypeIds } },
      select: { id: true, name: true },
    });
    const ttNameById = new Map(ticketTypes.map((tt) => [tt.id, tt.name]));

    const session = order.event.sessions[0];
    const ticketRows = await Promise.all(
      tickets.map(async (t) => ({
        code: t.code,
        ticketTypeName: ttNameById.get(t.ticketTypeId) ?? "Entrada",
        qrDataUrl: await qrToDataUrl(t.code),
      }))
    );

    const html = await render(
      TicketConfirmation({
        firstName: order.user.firstName,
        eventTitle: order.event.title,
        eventDate: session ? dateFmt.format(session.startAt) : "Fecha por confirmar",
        venueName: order.event.venue?.name ?? null,
        venueCity: order.event.venue?.city ?? null,
        tickets: ticketRows,
        orderCode: order.idempotencyKey.slice(0, 8).toUpperCase(),
        totalFormatted: moneyFmt(order.total, order.currency),
        accountUrl: `${APP_URL}/account/tickets`,
      })
    );

    const subject = `Tus entradas — ${order.event.title}`;

    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: order.user.email,
      subject,
      html,
    });

    if (error) {
      console.error(`[email] Resend error for order ${orderId}:`, error);
      return;
    }

    console.log(
      `[email] ticket confirmation sent to ${order.user.email} for order ${orderId}`
    );
  } catch (e) {
    console.error(`[email] unexpected error sending ticket email for ${orderId}:`, e);
  }
}
