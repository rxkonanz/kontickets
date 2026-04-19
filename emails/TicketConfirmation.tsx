import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Hr,
  Link,
  Row,
  Column,
} from "@react-email/components";

interface TicketRow {
  code: string;
  ticketTypeName: string;
  qrDataUrl: string;
}

export interface TicketConfirmationProps {
  firstName: string | null;
  eventTitle: string;
  eventDate: string; // already formatted in Spanish
  venueName: string | null;
  venueCity: string | null;
  tickets: TicketRow[];
  orderCode: string;
  totalFormatted: string;
  accountUrl: string;
}

export default function TicketConfirmation({
  firstName,
  eventTitle,
  eventDate,
  venueName,
  venueCity,
  tickets,
  orderCode,
  totalFormatted,
  accountUrl,
}: TicketConfirmationProps) {
  const preview = `Tus entradas para ${eventTitle} están listas`;
  const greeting = firstName ? `Hola, ${firstName}` : "¡Hola!";

  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Brand header */}
          <Section style={brandHeader}>
            <Text style={brand}>Kontickets</Text>
          </Section>

          {/* Hero */}
          <Section style={hero}>
            <Heading style={h1}>¡Compra confirmada!</Heading>
            <Text style={heroSub}>
              {greeting}. Gracias por tu compra — abajo encontrarás tu{tickets.length === 1 ? " entrada" : "s entradas"}.
            </Text>
          </Section>

          {/* Event summary */}
          <Section style={card}>
            <Text style={label}>Evento</Text>
            <Heading style={h2}>{eventTitle}</Heading>
            <Text style={meta}>{eventDate}</Text>
            {(venueName || venueCity) && (
              <Text style={meta}>
                {[venueName, venueCity].filter(Boolean).join(" · ")}
              </Text>
            )}
          </Section>

          {/* Tickets */}
          {tickets.map((t, i) => (
            <Section key={t.code} style={ticketCard}>
              <Row>
                <Column style={{ verticalAlign: "middle" }}>
                  <Text style={ticketLabel}>
                    Entrada {i + 1} de {tickets.length}
                  </Text>
                  <Text style={ticketType}>{t.ticketTypeName}</Text>
                  <Text style={ticketCode}>#{t.code}</Text>
                </Column>
                <Column align="right" style={{ verticalAlign: "middle" }}>
                  <Img
                    src={t.qrDataUrl}
                    width="140"
                    height="140"
                    alt={`QR ${t.code}`}
                    style={qrImg}
                  />
                </Column>
              </Row>
            </Section>
          ))}

          {/* Instructions */}
          <Section style={infoBox}>
            <Text style={infoTitle}>¿Cómo usar tus entradas?</Text>
            <Text style={infoText}>
              Presenta el código QR de cada entrada en la entrada del evento. Puedes mostrarlo desde este correo o desde tu cuenta.
            </Text>
          </Section>

          {/* Order totals */}
          <Section style={totalsSection}>
            <Row>
              <Column>
                <Text style={totalsLabel}>Pedido</Text>
                <Text style={orderCodeText}>#{orderCode}</Text>
              </Column>
              <Column align="right">
                <Text style={totalsLabel}>Total</Text>
                <Text style={totalAmount}>{totalFormatted}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Ver todas tus entradas en{" "}
              <Link href={accountUrl} style={link}>
                tu cuenta
              </Link>
              .
            </Text>
            <Text style={footerFinePrint}>
              Si no realizaste esta compra, responde a este correo y te ayudaremos de inmediato.
            </Text>
            <Text style={footerFinePrint}>
              Kontickets · Entradas para eventos en Ecuador
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ────────────────────────────────────────────────────────────
// Styles — inline for max email client compatibility
// ────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: "#f4f4f7",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  margin: 0,
  padding: "24px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  margin: "0 auto",
  maxWidth: 560,
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
};

const brandHeader: React.CSSProperties = {
  backgroundColor: "#0d0d5c",
  padding: "20px 24px",
  textAlign: "center",
};

const brand: React.CSSProperties = {
  color: "#ffffff",
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: "-0.02em",
  margin: 0,
};

const hero: React.CSSProperties = {
  padding: "32px 28px 8px",
  textAlign: "center",
};

const h1: React.CSSProperties = {
  color: "#0d0d5c",
  fontSize: 26,
  fontWeight: 700,
  margin: "0 0 10px",
};

const heroSub: React.CSSProperties = {
  color: "#475467",
  fontSize: 15,
  lineHeight: "22px",
  margin: 0,
};

const card: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  borderRadius: 8,
  margin: "24px 28px 0",
  padding: "20px 24px",
};

const label: React.CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.08em",
  margin: "0 0 6px",
  textTransform: "uppercase",
};

const h2: React.CSSProperties = {
  color: "#0d0d5c",
  fontSize: 20,
  fontWeight: 700,
  margin: "0 0 8px",
  lineHeight: "26px",
};

const meta: React.CSSProperties = {
  color: "#475467",
  fontSize: 14,
  margin: "0 0 4px",
};

const ticketCard: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  margin: "16px 28px 0",
  padding: "16px 20px",
};

const ticketLabel: React.CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.08em",
  margin: "0 0 4px",
  textTransform: "uppercase",
};

const ticketType: React.CSSProperties = {
  color: "#0f172a",
  fontSize: 15,
  fontWeight: 600,
  margin: "0 0 6px",
};

const ticketCode: React.CSSProperties = {
  color: "#64748b",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 12,
  margin: 0,
};

const qrImg: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  display: "block",
};

const infoBox: React.CSSProperties = {
  backgroundColor: "#f0f9ff",
  border: "1px solid #bae6fd",
  borderRadius: 8,
  margin: "20px 28px 0",
  padding: "14px 18px",
};

const infoTitle: React.CSSProperties = {
  color: "#0c4a6e",
  fontSize: 13,
  fontWeight: 600,
  margin: "0 0 4px",
};

const infoText: React.CSSProperties = {
  color: "#0c4a6e",
  fontSize: 13,
  lineHeight: "18px",
  margin: 0,
};

const totalsSection: React.CSSProperties = {
  padding: "20px 28px 0",
};

const totalsLabel: React.CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.08em",
  margin: "0 0 4px",
  textTransform: "uppercase",
};

const orderCodeText: React.CSSProperties = {
  color: "#0f172a",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 14,
  margin: 0,
};

const totalAmount: React.CSSProperties = {
  color: "#0d0d5c",
  fontSize: 18,
  fontWeight: 700,
  margin: 0,
};

const hr: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid #e2e8f0",
  margin: "24px 28px 0",
};

const footer: React.CSSProperties = {
  padding: "16px 28px 28px",
  textAlign: "center",
};

const footerText: React.CSSProperties = {
  color: "#475467",
  fontSize: 13,
  margin: "0 0 12px",
};

const footerFinePrint: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 11,
  lineHeight: "16px",
  margin: "0 0 4px",
};

const link: React.CSSProperties = {
  color: "#3b82f6",
  textDecoration: "underline",
};
