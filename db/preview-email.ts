// Renders the ticket confirmation email to an HTML file without sending.
// Run: npx tsx --env-file=.env.local db/preview-email.ts
// Then open: emails/_preview.html

import { render } from "@react-email/components";
import TicketConfirmation from "../emails/TicketConfirmation";
import { qrToDataUrl } from "../lib/qr";
import { writeFileSync } from "fs";

async function main() {
  const qr = await qrToDataUrl("KT-PREVIEW-ABC123");

  const html = await render(
    TicketConfirmation({
      firstName: "Roberto",
      eventTitle: "Buebele — Prueba!",
      eventDate: "viernes, 24 de abril de 2026, 20:00",
      venueName: "Teatro Nacional Sucre",
      venueCity: "Quito",
      tickets: [
        { code: "KT-PREVIEW-ABC123", ticketTypeName: "Entrada General", qrDataUrl: qr },
        { code: "KT-PREVIEW-DEF456", ticketTypeName: "Entrada General", qrDataUrl: qr },
      ],
      orderCode: "A3F9X2K1",
      totalFormatted: "$1.98",
      accountUrl: "https://www.kontickets.com/account/tickets",
    })
  );

  const out = "emails/_preview.html";
  writeFileSync(out, html);
  console.log(`Rendered ${html.length} chars → ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
