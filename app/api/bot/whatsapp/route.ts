import { NextRequest } from "next/server";
import {
  verifyWhatsAppSignature,
  sendWhatsAppText,
  parseIncomingMessage,
} from "@/lib/whatsapp";
import { generateBotReply } from "@/server/bot/conversation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expected = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && expected && token === expected) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verifyWhatsAppSignature(rawBody, signature)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const incoming = parseIncomingMessage(body);
  if (!incoming) {
    return new Response("OK", { status: 200 });
  }

  try {
    const reply = await generateBotReply(incoming.text);
    await sendWhatsAppText(incoming.from, reply);
  } catch (err) {
    console.error("[bot] failed to handle message", err);
    try {
      await sendWhatsAppText(
        incoming.from,
        "Tuve un problema técnico. Por favor intenta de nuevo en un momento.",
      );
    } catch (sendErr) {
      console.error("[bot] failed to send fallback message", sendErr);
    }
  }

  return new Response("OK", { status: 200 });
}
