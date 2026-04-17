import { NextRequest, NextResponse } from "next/server";
import { getEvents } from "@/server/queries/events";
import type { EventCategory } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const category = searchParams.get("category") as EventCategory | null;
  const city = searchParams.get("city") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  try {
    const events = await getEvents({
      status: "PUBLISHED",
      category: category ?? undefined,
      city,
      q,
      limit,
    });

    return NextResponse.json({ data: events });
  } catch (error) {
    console.error("GET /api/events error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
