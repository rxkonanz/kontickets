import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type { CartItem } from "@/types";
import { PLATFORM_FEE_PERCENT } from "@/lib/constants";

interface CreatePaymentIntentParams {
  orderId: string;
  amount: number; // in cents
  currency?: string;
  metadata?: Record<string, string>;
}

export async function createPaymentIntent(params: CreatePaymentIntentParams) {
  const { orderId, amount, currency = "usd", metadata = {} } = params;

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    metadata: {
      orderId,
      ...metadata,
    },
    automatic_payment_methods: { enabled: true },
  });

  // Record in DB
  await prisma.payment.create({
    data: {
      orderId,
      status: "INITIATED",
      provider: "stripe",
      providerPaymentId: paymentIntent.id,
      amount,
      currency: currency.toUpperCase(),
    },
  });

  return paymentIntent;
}

export function calculateFees(subtotal: number): { fees: number; total: number } {
  const fees = Math.round(subtotal * (PLATFORM_FEE_PERCENT / 100));
  return { fees, total: subtotal + fees };
}
