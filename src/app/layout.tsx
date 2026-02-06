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
  title: "Fidu Viagens | Partner Portal",
  description: "Exclusive portal for Fidu Viagens partners",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <html lang="en">
        <body className="flex min-h-screen items-center justify-center p-4 text-center font-sans">
          <div className="max-w-md p-8 border rounded-xl bg-white shadow-sm">
            <h1 className="text-xl font-bold text-red-600 mb-4">Configuração Incompleta</h1>
            <p className="text-gray-600 mb-6">
              A chave `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` não foi encontrada.
              Por favor, adicione-a nas configurações da Vercel e faça um novo deploy.
            </p>
            <div className="text-xs text-gray-400 font-mono bg-gray-50 p-2 rounded">
              Ambiente: {process.env.NODE_ENV}
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html >
    </ClerkProvider>
  );
}
