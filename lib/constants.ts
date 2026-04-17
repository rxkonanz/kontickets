export const PLATFORM_FEE_PERCENT = 5; // 5% service fee

export const CHECKOUT_EXPIRY_MINUTES = 15;

export const ECUADOR_CITIES = [
  "Quito",
  "Guayaquil",
  "Cuenca",
  "Ambato",
  "Loja",
  "Riobamba",
  "Ibarra",
  "Manta",
  "Portoviejo",
  "Machala",
] as const;

export type EcuadorCity = (typeof ECUADOR_CITIES)[number];

export const EVENT_CATEGORIES = [
  { value: "CONCERT", label: "Concierto" },
  { value: "CONFERENCE", label: "Conferencia" },
  { value: "SPORT", label: "Deporte" },
  { value: "FESTIVAL", label: "Festival" },
  { value: "THEATER", label: "Teatro" },
  { value: "COMEDY", label: "Comedia" },
  { value: "WORKSHOP", label: "Taller" },
  { value: "NETWORKING", label: "Networking" },
  { value: "EXHIBITION", label: "Exposición" },
  { value: "OTHER", label: "Otro" },
] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  PENDING_PAYMENT: "Pago pendiente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  EXPIRED: "Expirado",
  REFUNDED: "Reembolsado",
  PARTIALLY_REFUNDED: "Reembolso parcial",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  INITIATED: "Iniciado",
  PENDING: "Pendiente",
  REQUIRES_ACTION: "Acción requerida",
  AUTHORIZED: "Autorizado",
  PAID: "Pagado",
  FAILED: "Fallido",
  REFUNDED: "Reembolsado",
  PARTIALLY_REFUNDED: "Reembolso parcial",
  CANCELLED: "Cancelado",
};

export const TICKET_STATUS_LABELS: Record<string, string> = {
  ISSUED: "Emitido",
  USED: "Usado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};
