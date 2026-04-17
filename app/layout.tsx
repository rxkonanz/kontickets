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

export const metadata: Metadata = {
  title: {
    default: "Kontickets — Entradas para eventos en Ecuador",
    template: "%s | Kontickets",
  },
  description:
    "Compra entradas para conciertos, conferencias, festivales y más eventos en Ecuador.",
  keywords: ["entradas", "tickets", "eventos", "Ecuador", "conciertos"],
  openGraph: {
    type: "website",
    locale: "es_EC",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Kontickets",
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
