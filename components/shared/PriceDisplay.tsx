import { formatPrice } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface PriceDisplayProps {
  subtotal: number;
  fees: number;
  tax?: number;
  total: number;
  currency?: string;
}

export function PriceDisplay({
  subtotal,
  fees,
  tax = 0,
  total,
  currency = "USD",
}: PriceDisplayProps) {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Subtotal</span>
        <span>{formatPrice(subtotal, currency)}</span>
      </div>
      {fees > 0 && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cargo por servicio</span>
          <span>{formatPrice(fees, currency)}</span>
        </div>
      )}
      {tax > 0 && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">IVA</span>
          <span>{formatPrice(tax, currency)}</span>
        </div>
      )}
      <Separator />
      <div className="flex justify-between font-semibold text-base">
        <span>Total</span>
        <span>{formatPrice(total, currency)}</span>
      </div>
    </div>
  );
}
