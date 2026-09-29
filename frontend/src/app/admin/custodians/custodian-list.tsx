'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Custodian } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ListEmptyState } from '@/components/list-empty-state';
import { ListErrorState } from '@/components/list-error-state';
import { Building2, Pencil, Trash2 } from 'lucide-react';

interface CustodianListProps {
  custodians: Custodian[];
  isLoading: boolean;
  error: string | null;
  hasSearch: boolean;
  onDeleteClick: (id: number) => void;
}

interface CustodianActionsProps {
  custodian: Custodian;
  onDeleteClick: (id: number) => void;
}

function CustodianActions({ custodian, onDeleteClick }: CustodianActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button asChild variant="ghost" size="icon" className="h-11 w-11 cursor-pointer" aria-label="Editar custodio">
        <Link href={`/admin/custodians/${custodian.id}`}>
          <Pencil className="h-3.5 w-3.5" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-11 w-11 cursor-pointer hover:bg-destructive/10 hover:text-destructive"
        onClick={() => onDeleteClick(custodian.id)}
        aria-label="Eliminar custodio"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function CustodianList({ custodians, isLoading, error, hasSearch, onDeleteClick }: CustodianListProps) {
  const router = useRouter();
  const emptyMessage = hasSearch ? 'Sin resultados para tu búsqueda' : 'No hay custodios registrados';
  const emptyAction = hasSearch ? undefined : { label: 'Agregar custodio', href: '/admin/custodians/new' };

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
              <ListEmptyState icon={Building2} message={emptyMessage} action={emptyAction} />
            </CardContent>
          </Card>
        ) : (
          custodians.map((custodian) => (
            <Card
              key={custodian.id}
              className="cursor-pointer"
              onClick={() => router.push(`/admin/custodians/${custodian.id}/assets`)}
            >
              <CardContent className="space-y-2 p-4">
                <p className="font-medium">{custodian.fullName}</p>
                <p className="font-mono text-xs text-muted-foreground">{custodian.identifier}</p>
                <p className="text-sm text-muted-foreground">{custodian.unit || '—'}</p>
                <div className="flex justify-end pt-1" onClick={(e) => e.stopPropagation()}>
                  <CustodianActions custodian={custodian} onDeleteClick={onDeleteClick} />
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
                <TableHead>Nombre completo</TableHead>
                <TableHead>Identificador</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
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
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-8 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <ListErrorState message={error} />
                  </TableCell>
                </TableRow>
              ) : custodians.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <ListEmptyState icon={Building2} message={emptyMessage} action={emptyAction} />
                  </TableCell>
                </TableRow>
              ) : (
                custodians.map((custodian) => (
                  <TableRow
                    key={custodian.id}
                    className="cursor-pointer transition-colors hover:bg-muted/40"
                    onClick={() => router.push(`/admin/custodians/${custodian.id}/assets`)}
                  >
                    <TableCell className="font-medium">{custodian.fullName}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{custodian.identifier}</TableCell>
                    <TableCell className="text-muted-foreground">{custodian.unit || '—'}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <CustodianActions custodian={custodian} onDeleteClick={onDeleteClick} />
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
