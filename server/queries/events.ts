import { prisma } from "@/lib/prisma";
import type { EventCategory, EventStatus } from "@/types";
import type { EventWithDetails } from "@/types";
import { MOCK_EVENTS } from "@/lib/mock-events";

interface GetEventsOptions {
  status?: EventStatus;
  category?: EventCategory;
  city?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

function isDbConfigured() {
  const url = process.env.DATABASE_URL ?? "";
  return url.startsWith("postgresql://") && !url.includes("placeholder");
}

export async function getEvents(options: GetEventsOptions = {}): Promise<EventWithDetails[]> {
  if (!isDbConfigured()) return filterMockEvents(options);

  const { status, category, city, q, limit = 50, offset = 0 } = options;

  try {
    return await prisma.event.findMany({
      where: {
        ...(status && { status }),
        ...(category && { category }),
        ...(city && { venue: { city } }),
        ...(q && {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        organizer: true,
        venue: true,
        sessions: { orderBy: { startAt: "asc" } },
        ticketTypes: {
          where: { isVisible: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }) as EventWithDetails[];
  } catch {
    // DB not configured yet — fall back to mock data for UI preview
    return filterMockEvents(options);
  }
}

function filterMockEvents(options: GetEventsOptions): EventWithDetails[] {
  const { status, category, city, q, limit = 50, offset = 0 } = options;
  let results = MOCK_EVENTS.filter((e) => {
    if (status && e.status !== status) return false;
    if (category && e.category !== category) return false;
    if (city && e.venue?.city !== city) return false;
    if (q) {
      const lower = q.toLowerCase();
      if (!e.title.toLowerCase().includes(lower) && !e.description?.toLowerCase().includes(lower))
        return false;
    }
    return true;
  });
  return results.slice(offset, offset + limit);
}

export async function getEventBySlug(slug: string): Promise<EventWithDetails | null> {
  if (!isDbConfigured()) return MOCK_EVENTS.find((e) => e.slug === slug) ?? null;

  try {
    // Use findMany instead of findUnique — Prisma 7 with PrismaNeonHttp routes
    // findUnique through a DataLoader that wraps queries in transactions (unsupported).
    const results = await prisma.event.findMany({
      where: { slug },
      include: {
        organizer: true,
        venue: true,
        sessions: { orderBy: { startAt: "asc" } },
        ticketTypes: { orderBy: { sortOrder: "asc" } },
      },
      take: 1,
    }) as EventWithDetails[];
    return results[0] ?? MOCK_EVENTS.find((e) => e.slug === slug) ?? null;
  } catch {
    return MOCK_EVENTS.find((e) => e.slug === slug) ?? null;
  }
}
