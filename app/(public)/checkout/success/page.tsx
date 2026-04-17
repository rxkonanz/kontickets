import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const params = await searchParams;
  const orderId = params.order_id;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-3">¡Pago exitoso!</h1>
        <p className="text-muted-foreground mb-8">
          Tus entradas han sido enviadas a tu correo. También puedes verlas en tu
          cuenta.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            className="gradient-brand-cta text-white border-0 hover:opacity-90"
            asChild
          >
            <Link href="/account/tickets">Ver mis entradas</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/events">Explorar más eventos</Link>
          </Button>
        </div>

        {orderId && (
          <p className="mt-6 text-xs text-muted-foreground">
            Referencia del pedido: <code className="bg-slate-100 px-1 rounded">{orderId}</code>
          </p>
        )}
      </div>
    </div>
  );
}
