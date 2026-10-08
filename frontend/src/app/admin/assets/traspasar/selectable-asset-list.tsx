'use client';

import { TechnicalValue } from '@/components/technical-value';
import { Asset } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ListEmptyState } from '@/components/list-empty-state';
import { ListErrorState } from '@/components/list-error-state';
import { CheckSquare, Package, Square } from 'lucide-react';
import { EMPTY_FIELD } from '@/lib/display';

interface SelectableAssetListProps {
  assets: Asset[];
  isLoading: boolean;
  error: string | null;
  hasSearch: boolean;
  selectedIds: Set<number>;
  onToggleSelect: (asset: Asset) => void;
}

function SelectionIndicator({ isSelected }: { isSelected: boolean }) {
  return isSelected ? (
    <CheckSquare className="h-4 w-4 shrink-0 text-primary" />
  ) : (
    <Square className="h-4 w-4 shrink-0 text-muted-foreground" />
  );
}

export function SelectableAssetList({
  assets,
  isLoading,
  error,
  hasSearch,
  selectedIds,
  onToggleSelect,
}: SelectableAssetListProps) {
  const emptyMessage = hasSearch ? 'Sin resultados para tu búsqueda' : 'No hay activos disponibles';

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
          assets.map((asset) => {
            const isSelected = selectedIds.has(asset.id);
            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => onToggleSelect(asset)}
                className={`w-full min-h-11 rounded-lg border p-4 text-left transition-colors ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{asset.assetName}</p>
                    <p className="text-xs text-muted-foreground">
                      <TechnicalValue value={asset.code} />
                    </p>
                  </div>
                  <SelectionIndicator isSelected={isSelected} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {[asset.brand, asset.model].filter(Boolean).join(' ') || EMPTY_FIELD}
                </p>
                <p className="text-sm text-muted-foreground">{asset.location || EMPTY_FIELD}</p>
                <p className="text-sm text-muted-foreground">{asset.custodian?.fullName || 'Sin custodio'}</p>
              </button>
            );
          })
        )}
      </div>

      {/* Desktop: table */}
      <Card className="hidden md:block">
        <CardContent className="overflow-hidden rounded-lg p-0 pt-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-10" />
                <TableHead>Código</TableHead>
                <TableHead>Nombre del activo</TableHead>
                <TableHead>Marca / Modelo</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Custodio actual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
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
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <ListErrorState message={error} />
                  </TableCell>
                </TableRow>
              ) : assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <ListEmptyState icon={Package} message={emptyMessage} />
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => {
                  const isSelected = selectedIds.has(asset.id);
                  return (
                    <TableRow
                      key={asset.id}
                      className={`cursor-pointer transition-colors hover:bg-muted/40 ${isSelected ? 'bg-primary/5' : ''}`}
                      onClick={() => onToggleSelect(asset)}
                    >
                      <TableCell>
                        <SelectionIndicator isSelected={isSelected} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <TechnicalValue value={asset.code} />
                      </TableCell>
                      <TableCell className="font-medium">{asset.assetName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {[asset.brand, asset.model].filter(Boolean).join(' ') || EMPTY_FIELD}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{asset.location || EMPTY_FIELD}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {asset.custodian?.fullName || EMPTY_FIELD}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
