'use client';

import { PublicCustodian } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ListEmptyState } from '@/components/list-empty-state';
import { ListErrorState } from '@/components/list-error-state';
import { Users } from 'lucide-react';
import { EMPTY_FIELD } from '@/lib/display';

interface PublicCustodianListProps {
  custodians: PublicCustodian[];
  isLoading: boolean;
  error: string | null;
  hasSearch: boolean;
}

export function PublicCustodianList({ custodians, isLoading, error, hasSearch }: PublicCustodianListProps) {
  const emptyMessage = hasSearch ? 'Sin resultados para tu búsqueda' : 'No hay custodios registrados';

  return (
    <>
      {/* Mobile: card list */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-2 p-4">
                <Skeleton className="h-4 w-40" />
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
        ) : custodians.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <ListEmptyState icon={Users} message={emptyMessage} />
            </CardContent>
          </Card>
        ) : (
          custodians.map((custodian) => (
            <Card key={custodian.id}>
              <CardContent className="space-y-2 p-4">
                <p className="font-medium">{custodian.fullName}</p>
                <p className="text-sm text-muted-foreground">{custodian.unit || EMPTY_FIELD}</p>
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
                <TableHead>Nombre</TableHead>
                <TableHead>Unidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={2}>
                    <ListErrorState message={error} />
                  </TableCell>
                </TableRow>
              ) : custodians.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2}>
                    <ListEmptyState icon={Users} message={emptyMessage} />
                  </TableCell>
                </TableRow>
              ) : (
                custodians.map((custodian) => (
                  <TableRow key={custodian.id} className="transition-colors hover:bg-muted/40">
                    <TableCell className="font-medium">{custodian.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{custodian.unit || EMPTY_FIELD}</TableCell>
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
