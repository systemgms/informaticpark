'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useBrand } from '@/components/brand-provider';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { GovHeader } from '@/components/gov-header';
import { GovStripe } from '@/components/gov-stripe';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutDashboard, LogIn, Package, Search, Users } from 'lucide-react';

interface InventoryCounts {
  assets: number | null;
  custodians: number | null;
}

const INSTITUTION_NAME = 'Gobernación Provincial de Morona Santiago';

function formatRecordCount(count: number): string {
  return `${count} ${count === 1 ? 'registrado' : 'registrados'}`;
}

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
        // Counts are informational; the page works without them.
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  const appName = brand?.appName || 'Parque Informático';

  return (
    <div className="gov-theme flex min-h-screen flex-col bg-background">
      <GovHeader />

      <div className="flex-1">
        <section className="mx-auto max-w-2xl space-y-4 px-4 py-10 text-center sm:py-16">
          {brand?.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- logo URL is admin-uploaded/dynamic; next/image optimization needs extra loader config on the Cloudflare Workers deploy target
            <img src={brand.logoUrl} alt="Logotipo de la aplicación" className="mx-auto h-12 w-auto object-contain" />
          )}
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{appName}</h1>
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
            <Card className="h-full transition-all hover:border-primary/30 hover:shadow-float">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 rounded-xl bg-[#272965]/10 p-2.5 text-[#272965]">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Activos</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {counts.assets !== null ? formatRecordCount(counts.assets) : 'Ver el listado completo'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/public/custodians" className="group">
            <Card className="h-full transition-all hover:border-primary/30 hover:shadow-float">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 rounded-xl bg-[#27516D]/10 p-2.5 text-[#27516D]">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Custodios</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {counts.custodians !== null ? formatRecordCount(counts.custodians) : 'Ver el listado completo'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </section>
      </div>

      <footer>
        <GovStripe />
        <div className="flex flex-col items-center gap-3 border-t px-4 py-6 text-center text-sm text-muted-foreground">
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG asset; next/image optimization is unnecessary */}
          <img
            src="/brand/gobierno-ecuador-navy.svg"
            alt="Gobierno del Ecuador"
            width={105}
            height={36}
            className="h-9 w-auto"
          />
          <p>{INSTITUTION_NAME}</p>
        </div>
      </footer>
    </div>
  );
}
