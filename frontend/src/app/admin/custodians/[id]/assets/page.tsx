'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Custodian, Asset } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';

export default function CustodianAssetsPage() {
  const params = useParams();
  const router = useRouter();
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

  if (isLoading) return <p className="text-center py-8">Cargando...</p>;
  if (error) return <p className="text-center py-8 text-destructive">{error}</p>;
  if (!custodian) return null;

  const assets: Asset[] = custodian.assets ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{custodian.fullName}</h1>
          <p className="text-muted-foreground text-sm">
            {custodian.identifier}
            {custodian.unit ? ` · ${custodian.unit}` : ''}
          </p>
        </div>
        <Link href={`/admin/custodians/${id}`} className="ml-auto">
          <Button variant="outline" size="sm">
            <Pencil className="w-4 h-4 mr-2" />
            Editar custodio
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Equipos asignados <span className="text-muted-foreground font-normal text-base">({assets.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Este custodio no tiene equipos asignados.
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => (
                  <TableRow
                    key={asset.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/admin/assets/${asset.id}`)}
                  >
                    <TableCell>{asset.code ?? '—'}</TableCell>
                    <TableCell className="font-medium">{asset.assetName}</TableCell>
                    <TableCell>{asset.brand ?? '—'}</TableCell>
                    <TableCell>{asset.model ?? '—'}</TableCell>
                    <TableCell>{asset.serialNumber ?? '—'}</TableCell>
                    <TableCell>{asset.location ?? '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
