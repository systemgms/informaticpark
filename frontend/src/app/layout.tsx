import type { Metadata } from 'next';
import { Inter as FontSans, JetBrains_Mono as FontMono, Open_Sans as FontGov } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';
import { AuthProvider } from '@/components/auth-provider';
import { AuthGuard } from '@/components/auth-guard';
import { BrandProvider } from '@/components/brand-provider';
import { ToastProvider } from '@/components/ui/toast';
import { Navbar } from '@/components/navbar';
import { MainContainer } from '@/components/main-container';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontMono = FontMono({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-mono',
});

const fontGov = FontGov({
  subsets: ['latin'],
  variable: '--font-gov',
});

export const metadata: Metadata = {
  title: 'Parque Informático',
  description: 'Aplicativo para la localización de equipos informáticos',
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
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable,
          fontMono.variable,
          fontGov.variable,
        )}
      >
        <BrandProvider>
          <AuthProvider>
            <AuthGuard>
              <ToastProvider>
                <Navbar />
                <MainContainer>{children}</MainContainer>
              </ToastProvider>
            </AuthGuard>
          </AuthProvider>
        </BrandProvider>
      </body>
    </html>
  );
}
