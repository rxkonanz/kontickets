import { createHmac, timingSafeEqual } from "crypto";

const WA_GRAPH_URL = "https://graph.facebook.com/v21.0";
const WA_TEXT_LIMIT = 4096;

export function verifyWhatsAppSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader) return false;
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    console.error("[whatsapp] WHATSAPP_APP_SECRET not configured");
    return false;
  }
  const expected =
    "sha256=" +
    createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const received = Buffer.from(signatureHeader);
  const expectedBuf = Buffer.from(expected);
  if (received.length !== expectedBuf.length) return false;
  return timingSafeEqual(received, expectedBuf);
}

export async function sendWhatsAppText(
  to: string,
  body: string,
): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    throw new Error("WhatsApp env vars not configured");
  }

  const res = await fetch(`${WA_GRAPH_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: body.slice(0, WA_TEXT_LIMIT), preview_url: true },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp send failed (${res.status}): ${err}`);
  }
}

export type IncomingWhatsAppMessage = {
  from: string;
  text: string;
  messageId: string;
};

type WhatsAppWebhookBody = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from?: string;
          id?: string;
          type?: string;
          text?: { body?: string };
        }>;
      };
    }>;
  }>;
};

export function parseIncomingMessage(
  body: unknown,
): IncomingWhatsAppMessage | null {
  const typed = body as WhatsAppWebhookBody;
  const msg = typed?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!msg || msg.type !== "text" || !msg.text?.body || !msg.from || !msg.id) {
    return null;
  }
  return {
    from: msg.from,
    text: msg.text.body,
    messageId: msg.id,
  };
}
