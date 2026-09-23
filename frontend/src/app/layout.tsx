import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { AuthGuard } from "@/components/auth-guard";
import { BrandProvider } from "@/components/brand-provider";
import { ToastProvider } from "@/components/ui/toast";
import Navbar from "@/components/navbar";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Parque Informático",
  description: "Aplicativo para la localización de equipos informáticos",
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
        <BrandProvider>
          <AuthProvider>
            <AuthGuard>
              <ToastProvider>
                <Navbar />
                <main className="container mx-auto py-8 px-4">
                  {/* Children rendered directly - error handling at higher level */}
                  {children}
                </main>
              </ToastProvider>
            </AuthGuard>
          </AuthProvider>
        </BrandProvider>
      </body>
    </html>
  );
}