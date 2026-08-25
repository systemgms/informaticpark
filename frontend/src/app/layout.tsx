import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { AuthGuard } from "@/components/auth-guard";
import { ToastProvider } from "@/components/ui/toast";
import Navbar from "@/components/navbar";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Parque Informatico GPMS",
  description: "Aplicativo para la localizacion de equipos infomaticos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <AuthProvider>
          <AuthGuard>
            <ToastProvider>
              <Navbar />
              <main className="container mx-auto py-8 px-4">{children}</main>
            </ToastProvider>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}


