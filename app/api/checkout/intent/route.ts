import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createOrderIntent } from "@/server/actions/checkout";
import type { CartItem } from "@/types";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { eventId, items } = body as { eventId: string; items: CartItem[] };

    if (!eventId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const result = await createOrderIntent(eventId, items);
    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
