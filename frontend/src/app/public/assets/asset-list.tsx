'use client';

import { TechnicalValue } from '@/components/technical-value';
import { PublicAsset } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ListEmptyState } from '@/components/list-empty-state';
import { ListErrorState } from '@/components/list-error-state';
import { Package } from 'lucide-react';
import { EMPTY_FIELD } from '@/lib/display';

interface PublicAssetListProps {
  assets: PublicAsset[];
  isLoading: boolean;
  error: string | null;
  hasSearch: boolean;
}

function formatLocation(asset: PublicAsset): string {
  const parts = [asset.geoLocation?.canton, asset.geoLocation?.parroquia].filter(Boolean);
  if (parts.length > 0) return parts.join(' / ');
  return asset.location || EMPTY_FIELD;
}

export function PublicAssetList({ assets, isLoading, error, hasSearch }: PublicAssetListProps) {
  const emptyMessage = hasSearch ? 'Sin resultados para tu búsqueda' : 'No hay activos registrados';

  return (
    <>
      {/* Mobile: card list */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-2 p-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))
        ) : error ? (
          <Card>
            <CardContent className="p-0">
              <ListErrorState message={error} />
            </CardContent>
          </Card>
        ) : assets.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <ListEmptyState icon={Package} message={emptyMessage} />
            </CardContent>
          </Card>
        ) : (
          assets.map((asset) => (
            <Card key={asset.id}>
              <CardContent className="space-y-2 p-4">
                <div>
                  <p className="font-medium">{asset.assetName}</p>
                  <p className="text-xs text-muted-foreground">
                    <TechnicalValue value={asset.code} />
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {[asset.brand, asset.model].filter(Boolean).join(' ') || EMPTY_FIELD}
                </p>
                <p className="text-sm text-muted-foreground">{formatLocation(asset)}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop: table */}
      <Card className="hidden md:block">
        <CardContent className="overflow-hidden rounded-lg p-0 pt-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Marca / Modelo</TableHead>
                <TableHead>Ubicación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <ListErrorState message={error} />
                  </TableCell>
                </TableRow>
              ) : assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <ListEmptyState icon={Package} message={emptyMessage} />
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => (
                  <TableRow key={asset.id} className="transition-colors hover:bg-muted/40">
                    <TableCell className="text-xs text-muted-foreground">
                      <TechnicalValue value={asset.code} />
                    </TableCell>
                    <TableCell className="font-medium">{asset.assetName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {[asset.brand, asset.model].filter(Boolean).join(' ') || EMPTY_FIELD}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatLocation(asset)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
