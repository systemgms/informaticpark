'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Custodian, Asset } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/back-button';
import { ListEmptyState } from '@/components/list-empty-state';
import { Laptop, Pencil } from 'lucide-react';
import { EMPTY_FIELD } from '@/lib/display';

const EMPTY_MESSAGE = 'Este custodio no tiene equipos asignados.';

function AssetsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-11 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-2 p-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="hidden md:block">
        <CardContent className="space-y-3 pt-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function AssetCard({ asset }: { asset: Asset }) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <Link
          href={`/admin/assets/${asset.id}`}
          className="flex min-h-11 items-center break-words font-medium hover:underline"
        >
          {asset.assetName}
        </Link>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Código</dt>
          <dd className="min-w-0 break-words font-mono">{asset.code ?? EMPTY_FIELD}</dd>
          <dt className="text-muted-foreground">Marca y modelo</dt>
          <dd className="min-w-0 break-words">{[asset.brand, asset.model].filter(Boolean).join(' ') || EMPTY_FIELD}</dd>
          <dt className="text-muted-foreground">Serie</dt>
          <dd className="min-w-0 break-words">{asset.serialNumber ?? EMPTY_FIELD}</dd>
          <dt className="text-muted-foreground">Ubicación</dt>
          <dd className="min-w-0 break-words">{asset.location ?? EMPTY_FIELD}</dd>
        </dl>
      </CardContent>
    </Card>
  );
}

export default function CustodianAssetsPage() {
  const params = useParams();
  const id = parseInt(params.id as string);

  const [custodian, setCustodian] = useState<Custodian | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.custodians.getById(id);
        setCustodian(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al cargar el custodio.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading) return <AssetsPageSkeleton />;
  if (error) return <p className="py-8 text-center text-destructive">{error}</p>;
  if (!custodian) return null;

  const assets: Asset[] = custodian.assets ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <BackButton href="/admin/custodians" variant="ghost" />
        {/* basis-48 lets the actions wrap below the title instead of squeezing it */}
        <div className="min-w-0 flex-1 basis-48">
          <h1 className="break-words text-2xl font-bold md:text-3xl">{custodian.fullName}</h1>
          <p className="break-words text-sm text-muted-foreground">{custodian.identifier}</p>
          {custodian.unit && <p className="break-words text-sm text-muted-foreground">{custodian.unit}</p>}
        </div>
        <Button asChild variant="outline" size="sm" className="sm:ml-auto">
          <Link href={`/admin/custodians/${id}`}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar custodio
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Equipos asignados <span className="text-base font-normal text-muted-foreground">({assets.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile: card list */}
          <div className="space-y-3 md:hidden">
            {assets.length === 0 ? (
              <ListEmptyState icon={Laptop} message={EMPTY_MESSAGE} />
            ) : (
              assets.map((asset) => <AssetCard key={asset.id} asset={asset} />)
            )}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre del equipo</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>N° Serie</TableHead>
                  <TableHead>Ubicación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      {EMPTY_MESSAGE}
                    </TableCell>
                  </TableRow>
                ) : (
                  assets.map((asset) => (
                    <TableRow key={asset.id} className="hover:bg-muted/50">
                      <TableCell>{asset.code ?? EMPTY_FIELD}</TableCell>
                      <TableCell className="font-medium">
                        <Link href={`/admin/assets/${asset.id}`} className="hover:underline">
                          {asset.assetName}
                        </Link>
                      </TableCell>
                      <TableCell>{asset.brand ?? EMPTY_FIELD}</TableCell>
                      <TableCell>{asset.model ?? EMPTY_FIELD}</TableCell>
                      <TableCell>{asset.serialNumber ?? EMPTY_FIELD}</TableCell>
                      <TableCell>{asset.location ?? EMPTY_FIELD}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
