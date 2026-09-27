'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useBrand } from '@/components/brand-provider';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutDashboard, LogIn, Package, Search, Users } from 'lucide-react';

interface InventoryCounts {
  assets: number | null;
  custodians: number | null;
}

const INSTITUTION_NAME = 'Gobernación Provincial de Morona Santiago';

export default function LandingPage() {
  const { user } = useAuth();
  const { brand } = useBrand();
  const [counts, setCounts] = useState<InventoryCounts>({ assets: null, custodians: null });

  useEffect(() => {
    let isCancelled = false;
    Promise.all([api.public.assets.getAll({ limit: 1 }), api.public.custodians.getAll({ limit: 1 })])
      .then(([assetsResponse, custodiansResponse]) => {
        if (isCancelled) return;
        setCounts({ assets: assetsResponse.meta.total, custodians: custodiansResponse.meta.total });
      })
      .catch(() => {
        // Los conteos son informativos: la página funciona igual sin ellos.
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  const appName = brand?.appName || 'Parque Informático';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            {brand?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- logo URL is admin-uploaded/dynamic; next/image optimization needs extra loader config on the Cloudflare Workers deploy target
              <img src={brand.logoUrl} alt="Logotipo de la aplicación" className="h-6 w-auto object-contain" />
            ) : (
              <LayoutDashboard className="h-5 w-5 text-primary" />
            )}
          </div>
          <span className="font-semibold">{appName}</span>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-2xl space-y-4 px-4 py-10 text-center sm:py-16">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{appName}</h1>
          <p className="text-lg font-medium text-muted-foreground">{INSTITUTION_NAME}</p>
          <p className="text-muted-foreground">
            Sistema de inventario de activos informáticos de la institución, abierto a consulta pública.
          </p>

          <div className="flex flex-col items-stretch justify-center gap-3 pt-2 sm:flex-row sm:items-center">
            <Button asChild size="lg">
              <Link href="/public/assets">
                <Search className="mr-2 h-4 w-4" />
                Consultar inventario
              </Link>
            </Button>
            {user ? (
              <Button asChild size="lg" variant="outline">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Ir al panel
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" variant="outline">
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Iniciar sesión
                </Link>
              </Button>
            )}
          </div>
        </section>

        <section className="mx-auto grid max-w-xl grid-cols-1 gap-4 px-4 pb-12 sm:grid-cols-2 sm:pb-16">
          <Link href="/public/assets" className="group">
            <Card className="h-full transition-all hover:border-primary/30 hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Activos</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {counts.assets !== null ? `${counts.assets} registrados` : 'Ver el listado completo'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/public/custodians" className="group">
            <Card className="h-full transition-all hover:border-primary/30 hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 rounded-xl bg-violet-50 p-2.5 text-violet-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Custodios</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {counts.custodians !== null ? `${counts.custodians} registrados` : 'Ver el listado completo'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </section>
      </main>

      <footer className="border-t px-4 py-6 text-center text-sm text-muted-foreground">{INSTITUTION_NAME}</footer>
    </div>
  );
}
