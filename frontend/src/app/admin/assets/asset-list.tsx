'use client';

import Link from 'next/link';
import { Asset, AssetCondition, ASSET_CONDITION_LABELS } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ListEmptyState } from '@/components/list-empty-state';
import { ListErrorState } from '@/components/list-error-state';
import { Package, Pencil, Trash2 } from 'lucide-react';
import { EMPTY_FIELD } from '@/lib/display';

const CONDITION_BADGE_CLASSES: Record<AssetCondition, string> = {
  [AssetCondition.BUENO]: 'border-transparent bg-green-100 text-green-800 hover:bg-green-100',
  [AssetCondition.REGULAR]: 'border-transparent bg-orange-100 text-orange-800 hover:bg-orange-100',
  [AssetCondition.MALO]: 'border-transparent bg-red-100 text-red-800 hover:bg-red-100',
  [AssetCondition.EN_MANTENIMIENTO]: 'border-transparent bg-amber-100 text-amber-800 hover:bg-amber-100',
};

function ConditionBadge({ condition }: { condition: AssetCondition }) {
  return <Badge className={CONDITION_BADGE_CLASSES[condition]}>{ASSET_CONDITION_LABELS[condition]}</Badge>;
}

interface AssetListProps {
  assets: Asset[];
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
  hasSearch: boolean;
  onDeleteClick: (id: number) => void;
}

function formatValue(value?: number | null): string {
  return value != null ? `$${value.toFixed(2)}` : EMPTY_FIELD;
}

interface AssetActionsProps {
  asset: Asset;
  isAdmin: boolean;
  onDeleteClick: (id: number) => void;
}

function AssetActions({ asset, isAdmin, onDeleteClick }: AssetActionsProps) {
  if (!isAdmin) {
    return (
      <Button asChild variant="ghost" size="sm" className="h-11 cursor-pointer text-xs">
        <Link href={`/admin/assets/${asset.id}/historial`}>Traspasos</Link>
      </Button>
    );
  }
  return (
    <div className="flex items-center justify-end gap-1">
      <Button asChild variant="ghost" size="icon" className="h-11 w-11 cursor-pointer" aria-label="Editar activo">
        <Link href={`/admin/assets/${asset.id}`}>
          <Pencil className="h-3.5 w-3.5" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-11 w-11 cursor-pointer hover:bg-destructive/10 hover:text-destructive"
        onClick={() => onDeleteClick(asset.id)}
        aria-label="Eliminar activo"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function AssetList({ assets, isLoading, error, isAdmin, hasSearch, onDeleteClick }: AssetListProps) {
  const emptyMessage = hasSearch ? 'Sin resultados para tu búsqueda' : 'No hay activos registrados';
  const emptyAction = hasSearch ? undefined : { label: 'Agregar activo', href: '/admin/assets/new' };

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
              <ListEmptyState icon={Package} message={emptyMessage} action={emptyAction} />
            </CardContent>
          </Card>
        ) : (
          assets.map((asset) => (
            <Card key={asset.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{asset.assetName}</p>
                    <p className="font-mono text-xs text-muted-foreground">{asset.code || EMPTY_FIELD}</p>
                  </div>
                  <p className="font-mono text-sm">{formatValue(asset.currentValue)}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {[asset.brand, asset.model].filter(Boolean).join(' ') || EMPTY_FIELD}
                </p>
                <p className="text-sm text-muted-foreground">{asset.location || EMPTY_FIELD}</p>
                <ConditionBadge condition={asset.condition} />
                <div className="flex justify-end pt-1">
                  <AssetActions asset={asset} isAdmin={isAdmin} onDeleteClick={onDeleteClick} />
                </div>
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
                <TableHead>Nombre del activo</TableHead>
                <TableHead>Marca / Modelo</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Condición</TableHead>
                <TableHead>Valor actual</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
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
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-8 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <ListErrorState message={error} />
                  </TableCell>
                </TableRow>
              ) : assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <ListEmptyState icon={Package} message={emptyMessage} action={emptyAction} />
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => (
                  <TableRow key={asset.id} className="transition-colors hover:bg-muted/40">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {asset.code || EMPTY_FIELD}
                    </TableCell>
                    <TableCell className="font-medium">{asset.assetName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {[asset.brand, asset.model].filter(Boolean).join(' ') || EMPTY_FIELD}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{asset.location || EMPTY_FIELD}</TableCell>
                    <TableCell>
                      <ConditionBadge condition={asset.condition} />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{formatValue(asset.currentValue)}</TableCell>
                    <TableCell className="text-right">
                      <AssetActions asset={asset} isAdmin={isAdmin} onDeleteClick={onDeleteClick} />
                    </TableCell>
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
