import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { getEvents, getEventBySlug } from "@/server/queries/events";
import { EventCategory, EventStatus } from "@/types";

const CategoryEnum = z.enum([
  "CONCERT",
  "CONFERENCE",
  "SPORT",
  "FESTIVAL",
  "THEATER",
  "COMEDY",
  "WORKSHOP",
  "NETWORKING",
  "EXHIBITION",
  "OTHER",
]);

export const searchEventsTool = betaZodTool({
  name: "search_events",
  description:
    "Busca eventos publicados en Kontickets. Úsalo cuando el usuario pregunte qué eventos hay, o cuando filtre por ciudad, categoría o palabra clave (nombre del artista o evento). Devuelve una lista resumida con título, ciudad, fecha de la primera función, precios por tipo de entrada y el enlace directo al evento.",
  inputSchema: z.object({
    city: z
      .string()
      .optional()
      .describe('Ciudad del evento. Ej: "Quito", "Guayaquil", "Cuenca".'),
    category: CategoryEnum.optional().describe(
      "Categoría del evento. CONCERT, COMEDY, CONFERENCE, etc.",
    ),
    query: z
      .string()
      .optional()
      .describe(
        "Palabra clave libre: nombre del artista, del evento, o de la descripción.",
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(20)
      .default(5)
      .describe("Máximo de resultados. Default 5."),
  }),
  run: async (input) => {
    const events = await getEvents({
      status: EventStatus.PUBLISHED,
      city: input.city,
      category: input.category as EventCategory | undefined,
      q: input.query,
      limit: input.limit ?? 5,
    });

    if (events.length === 0) {
      return JSON.stringify({
        results: [],
        message: "No se encontraron eventos con esos criterios.",
      });
    }

    return JSON.stringify({
      count: events.length,
      results: events.map((e) => ({
        title: e.title,
        slug: e.slug,
        category: e.category,
        city: e.venue?.city ?? null,
        venue: e.venue?.name ?? null,
        firstSessionAt: e.sessions?.[0]?.startAt ?? null,
        ticketPricesUsd: (e.ticketTypes ?? []).map((t) => ({
          name: t.name,
          priceUsd: (t.price / 100).toFixed(2),
        })),
        url: `https://www.kontickets.com/events/${e.slug}`,
      })),
    });
  },
});

export const getEventTool = betaZodTool({
  name: "get_event",
  description:
    "Obtiene el detalle completo de un evento específico por su slug: descripción, venue, todas las sesiones, y por cada tipo de entrada la disponibilidad actual (entradas que aún se pueden comprar). Úsalo cuando el usuario pregunte por los detalles de un evento, los precios, la disponibilidad por tipo de entrada, o cuánto queda.",
  inputSchema: z.object({
    slug: z
      .string()
      .describe(
        'El slug único del evento, ej: "juan-fernando-velasco-gira-para-siempre-quito".',
      ),
  }),
  run: async (input) => {
    const event = await getEventBySlug(input.slug);
    if (!event) {
      return JSON.stringify({ found: false });
    }
    return JSON.stringify({
      found: true,
      title: event.title,
      slug: event.slug,
      description: event.description,
      category: event.category,
      city: event.venue?.city ?? null,
      venue: event.venue?.name ?? null,
      address: event.venue?.address ?? null,
      sessions: (event.sessions ?? []).map((s) => ({
        startAt: s.startAt,
        timezone: s.timezone,
      })),
      ticketTypes: (event.ticketTypes ?? [])
        .filter((t) => t.isVisible)
        .map((t) => ({
          name: t.name,
          description: t.description,
          priceUsd: (t.price / 100).toFixed(2),
          available: Math.max(0, t.capacity - t.reserved - t.sold),
          capacity: t.capacity,
        })),
      url: `https://www.kontickets.com/events/${event.slug}`,
    });
  },
});

export const BOT_TOOLS = [searchEventsTool, getEventTool];
