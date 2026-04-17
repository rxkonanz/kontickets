import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default async function CheckoutPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/checkout");
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Payment form placeholder */}
        <div className="lg:col-span-3 space-y-6">
          <div className="p-6 rounded-xl border">
            <h2 className="font-semibold mb-4">Información de pago</h2>
            <p className="text-sm text-muted-foreground">
              Integración con Stripe Elements — conecta tus claves en{" "}
              <code className="bg-slate-100 px-1 rounded">.env.local</code> para
              habilitar el pago.
            </p>
          </div>
        </div>

        {/* Order summary placeholder */}
        <div className="lg:col-span-2">
          <div className="p-6 rounded-xl border bg-slate-50">
            <h2 className="font-semibold mb-4">Resumen del pedido</h2>
            <p className="text-sm text-muted-foreground">
              Los detalles del pedido aparecerán aquí.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
