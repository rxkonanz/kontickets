"use client";

import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe-client";
import { createOrderIntent } from "@/server/actions/checkout";
import { formatPrice } from "@/lib/utils";
import { PLATFORM_FEE_PERCENT } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Loader2, ArrowLeft, MapPin } from "lucide-react";
import Image from "next/image";
import type { CartItem } from "@/types";

interface TicketTypeProp {
  id: string;
  name: string;
  description: string | null;
  price: number;
  available: number;
  maxPerOrder: number;
}

interface EventProp {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  venue: string | null;
}

// ──────────────────────────────────────────────
// Inner: mounted inside <Elements> provider
// ──────────────────────────────────────────────
function PaymentForm({
  orderId,
  returnUrl,
}: {
  orderId: string;
  returnUrl: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${returnUrl}?order_id=${orderId}` },
    });

    if (stripeError) {
      setError(stripeError.message ?? "Error al procesar el pago");
      setPaying(false);
    }
    // On success Stripe redirects — no need to handle here
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{ layout: "tabs" }}
      />
      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={!stripe || !elements || paying}
        className="w-full gradient-brand-cta text-white border-0 hover:opacity-90 h-12 text-base font-semibold"
      >
        {paying ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Procesando pago…
          </>
        ) : (
          "Confirmar y pagar"
        )}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        Pago seguro procesado por Stripe. No almacenamos datos de tu tarjeta.
      </p>
    </form>
  );
}

// ──────────────────────────────────────────────
// Order summary card (reused in both steps)
// ──────────────────────────────────────────────
function OrderSummary({
  items,
  ticketTypes,
  fees,
  total,
}: {
  items: CartItem[];
  ticketTypes: TicketTypeProp[];
  fees: number;
  total: number;
}) {
  return (
    <Card className="bg-slate-50 border-slate-200">
      <CardContent className="p-4 space-y-2">
        <p className="text-sm font-semibold text-slate-700 mb-3">
          Resumen del pedido
        </p>
        {items.map((item) => {
          const tt = ticketTypes.find((t) => t.id === item.ticketTypeId)!;
          return (
            <div
              key={item.ticketTypeId}
              className="flex justify-between text-sm"
            >
              <span className="text-slate-600">
                {tt.name}{" "}
                <span className="text-slate-400">× {item.quantity}</span>
              </span>
              <span className="font-medium">
                {formatPrice(tt.price * item.quantity)}
              </span>
            </div>
          );
        })}
        <Separator className="my-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Cargo por servicio ({PLATFORM_FEE_PERCENT}%)</span>
          <span>{formatPrice(fees)}</span>
        </div>
        <div className="flex justify-between text-base font-bold pt-1">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────
// Main export
// ──────────────────────────────────────────────
export function CheckoutForm({
  event,
  ticketTypes,
}: {
  event: EventProp;
  ticketTypes: TicketTypeProp[];
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(ticketTypes.map((t) => [t.id, 0]))
  );
  const [checkoutState, setCheckoutState] = useState<{
    orderId: string;
    clientSecret: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived values
  const items: CartItem[] = ticketTypes
    .filter((t) => (quantities[t.id] ?? 0) > 0)
    .map((t) => ({ ticketTypeId: t.id, quantity: quantities[t.id] }));

  const subtotal = ticketTypes.reduce(
    (acc, t) => acc + t.price * (quantities[t.id] ?? 0),
    0
  );
  const fees = Math.round(subtotal * (PLATFORM_FEE_PERCENT / 100));
  const total = subtotal + fees;
  const totalTickets = items.reduce((acc, i) => acc + i.quantity, 0);

  function adjust(id: string, delta: number) {
    const tt = ticketTypes.find((t) => t.id === id)!;
    const current = quantities[id] ?? 0;
    const max = Math.min(tt.maxPerOrder, tt.available);
    const next = Math.max(0, Math.min(current + delta, max));
    setQuantities((prev) => ({ ...prev, [id]: next }));
  }

  async function handleProceed() {
    if (items.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await createOrderIntent(event.id, items);
      setCheckoutState(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  }

  const successUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/checkout/success`
      : `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/checkout/success`;

  // ── Step 2: Payment ──────────────────────────
  if (checkoutState) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setCheckoutState(null)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Modificar entradas
        </button>

        <OrderSummary
          items={items}
          ticketTypes={ticketTypes}
          fees={fees}
          total={total}
        />

        <div>
          <p className="text-sm font-semibold mb-3">Datos de pago</p>
          <Elements
            stripe={getStripe()}
            options={{
              clientSecret: checkoutState.clientSecret,
              locale: "es",
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#3b82f6",
                  borderRadius: "8px",
                },
              },
            }}
          >
            <PaymentForm
              orderId={checkoutState.orderId}
              returnUrl={successUrl}
            />
          </Elements>
        </div>
      </div>
    );
  }

  // ── Step 1: Ticket selection ─────────────────
  return (
    <div className="space-y-6">
      {/* Event header */}
      {event.coverImageUrl && (
        <div className="relative w-full h-44 rounded-xl overflow-hidden shadow-sm">
          <Image
            src={event.coverImageUrl}
            alt={event.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {event.venue && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white text-xs">
              <MapPin className="w-3.5 h-3.5 opacity-80" />
              <span className="opacity-90">{event.venue}</span>
            </div>
          )}
        </div>
      )}

      {/* Ticket type cards */}
      <div className="space-y-3">
        {ticketTypes.map((tt) => {
          const qty = quantities[tt.id] ?? 0;
          const maxQty = Math.min(tt.maxPerOrder, tt.available);
          return (
            <Card key={tt.id} className={qty > 0 ? "border-blue-300 shadow-sm" : ""}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-snug">{tt.name}</p>
                  {tt.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {tt.description}
                    </p>
                  )}
                  <p className="text-sm font-bold mt-1.5 text-blue-600">
                    {tt.price === 0 ? "Gratis" : formatPrice(tt.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tt.available} disponibles · máx. {tt.maxPerOrder} por orden
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => adjust(tt.id, -1)}
                    disabled={qty === 0}
                    aria-label="Quitar"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <span className="w-6 text-center text-sm font-semibold tabular-nums">
                    {qty}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => adjust(tt.id, 1)}
                    disabled={qty >= maxQty}
                    aria-label="Agregar"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      {totalTickets > 0 && (
        <OrderSummary
          items={items}
          ticketTypes={ticketTypes}
          fees={fees}
          total={total}
        />
      )}

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">
          {error}
        </p>
      )}

      <Button
        className="w-full gradient-brand-cta text-white border-0 hover:opacity-90 h-12 text-base font-semibold disabled:opacity-50"
        disabled={totalTickets === 0 || loading}
        onClick={handleProceed}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Preparando tu orden…
          </>
        ) : totalTickets > 0 ? (
          `Continuar al pago — ${formatPrice(total)}`
        ) : (
          "Selecciona entradas para continuar"
        )}
      </Button>
    </div>
  );
}
