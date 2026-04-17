export type {
  User,
  Organizer,
  Venue,
  Event,
  EventSession,
  TicketType,
  Order,
  OrderItem,
  Payment,
  Ticket,
  Attendee,
  CheckIn,
  Refund,
  PromoCode,
  Fee,
} from "@/lib/generated/prisma";

export {
  Role,
  OrganizerStatus,
  EventStatus,
  EventCategory,
  OrderStatus,
  PaymentStatus,
  TicketStatus,
  RefundStatus,
  FeeType,
  PromoType,
} from "@/lib/generated/prisma";

// Extended types with relations
export type EventWithDetails = import("@/lib/generated/prisma").Event & {
  organizer: import("@/lib/generated/prisma").Organizer;
  venue: import("@/lib/generated/prisma").Venue | null;
  sessions: import("@/lib/generated/prisma").EventSession[];
  ticketTypes: import("@/lib/generated/prisma").TicketType[];
};

export type OrderWithDetails = import("@/lib/generated/prisma").Order & {
  items: (import("@/lib/generated/prisma").OrderItem & {
    ticketType: import("@/lib/generated/prisma").TicketType;
  })[];
  payments: import("@/lib/generated/prisma").Payment[];
  tickets: import("@/lib/generated/prisma").Ticket[];
  event: import("@/lib/generated/prisma").Event;
};

export type TicketWithDetails = import("@/lib/generated/prisma").Ticket & {
  order: import("@/lib/generated/prisma").Order & {
    event: import("@/lib/generated/prisma").Event;
  };
  attendee: import("@/lib/generated/prisma").Attendee | null;
};

// API response shape helpers
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Checkout types
export interface CartItem {
  ticketTypeId: string;
  quantity: number;
}

export interface CheckoutIntent {
  orderId: string;
  clientSecret: string;
  expiresAt: string;
}
