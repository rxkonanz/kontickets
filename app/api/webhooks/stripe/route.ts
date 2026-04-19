import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { issueTickets } from "@/server/services/ticket-issuance";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const headerPayload = await headers();
  const signature = headerPayload.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.orderId;
      if (orderId) {
        await issueTickets(orderId);
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.orderId;
      if (orderId) {
        // providerPaymentId is @unique — singular update is safe
        await prisma.payment.update({
          where: { providerPaymentId: pi.id },
          data: {
            status: "FAILED",
            failureCode: pi.last_payment_error?.code ?? null,
            failureMessage: pi.last_payment_error?.message ?? null,
          },
        });
        // Compound where (id + status) — raw SQL since updateMany wraps in a tx
        await prisma.$executeRaw`
          UPDATE "orders"
          SET    "status" = 'CANCELLED', "cancelledAt" = NOW()
          WHERE  "id" = ${orderId}
            AND  "status" = 'PENDING_PAYMENT'
        `;
      }
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      if (charge.payment_intent) {
        await prisma.payment.update({
          where: { providerPaymentId: charge.payment_intent as string },
          data: { status: "REFUNDED" },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
