import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://parceiros.fiduviagens.com"),
  title: "Fidu Viagens Partner: Operador Local",
  description: "Portal exclusivo para parceiros e operadores locais da Fidu Viagens.",
  openGraph: {
    title: "Fidu Viagens Partner: Operador Local",
    description: "Acesse o portal exclusivo para parceiros.",
    url: "https://parceiros.fiduviagens.com",
    siteName: "Fidu Viagens",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Fidu Viagens Partner Portal",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fidu Viagens Partner: Operador Local",
    description: "Portal exclusivo para parceiros e operadores locais.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="pt-BR">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
