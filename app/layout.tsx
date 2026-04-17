import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProviderWrapper } from "@/components/clerk-provider-wrapper";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kontickets.com";

export const metadata: Metadata = {
  title: {
    default: "Kontickets — Entradas para eventos en Ecuador",
    template: "%s | Kontickets",
  },
  description:
    "Compra entradas para conciertos, partidos, festivales y más eventos en Ecuador. Entradas digitales instantáneas, seguras y fáciles.",
  keywords: ["entradas", "tickets", "eventos", "Ecuador", "conciertos", "fútbol", "festivales"],
  metadataBase: new URL(appUrl),
  openGraph: {
    type: "website",
    locale: "es_EC",
    url: appUrl,
    siteName: "Kontickets",
    title: "Kontickets — Entradas para eventos en Ecuador",
    description:
      "Compra entradas para conciertos, partidos, festivales y más eventos en Ecuador. Entradas digitales instantáneas, seguras y fáciles.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Kontickets — Entradas para eventos en Ecuador",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kontickets — Entradas para eventos en Ecuador",
    description:
      "Compra entradas para conciertos, partidos, festivales y más eventos en Ecuador.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProviderWrapper>
      <html lang="es" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        >
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProviderWrapper>
  );
}
