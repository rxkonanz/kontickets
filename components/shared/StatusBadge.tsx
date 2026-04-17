import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  TICKET_STATUS_LABELS,
} from "@/lib/constants";

type StatusType = "order" | "payment" | "ticket";

interface StatusBadgeProps {
  status: string;
  type: StatusType;
  className?: string;
}

function getVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "CONFIRMED":
    case "PAID":
    case "ISSUED":
      return "default";
    case "PENDING_PAYMENT":
    case "PENDING":
    case "REQUIRES_ACTION":
    case "AUTHORIZED":
      return "secondary";
    case "CANCELLED":
    case "FAILED":
    case "EXPIRED":
      return "destructive";
    default:
      return "outline";
  }
}

function getLabel(status: string, type: StatusType): string {
  switch (type) {
    case "order":
      return ORDER_STATUS_LABELS[status] ?? status;
    case "payment":
      return PAYMENT_STATUS_LABELS[status] ?? status;
    case "ticket":
      return TICKET_STATUS_LABELS[status] ?? status;
  }
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  return (
    <Badge
      variant={getVariant(status)}
      className={cn(
        status === "CONFIRMED" || status === "PAID" || status === "ISSUED"
          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
          : "",
        className
      )}
    >
      {getLabel(status, type)}
    </Badge>
  );
}
