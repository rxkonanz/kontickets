import { NextRequest, NextResponse } from "next/server";
import { getEventBySlug } from "@/server/queries/events";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const event = await getEventBySlug(slug);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json({ data: event });
  } catch (error) {
    console.error(`GET /api/events/${slug} error:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
