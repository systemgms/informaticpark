'use client';

import Link from 'next/link';
import { Location } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ListEmptyState } from '@/components/list-empty-state';
import { ListErrorState } from '@/components/list-error-state';
import { MapPin, Pencil, Trash2 } from 'lucide-react';
import { EMPTY_FIELD } from '@/lib/display';

interface LocationListProps {
  locations: Location[];
  isLoading: boolean;
  error: string | null;
  hasSearch: boolean;
  onDeleteClick: (id: number) => void;
}

function formatCoordinates(location: Location): string {
  return location.lat != null && location.lng != null
    ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
    : EMPTY_FIELD;
}

interface LocationActionsProps {
  location: Location;
  onDeleteClick: (id: number) => void;
}

function LocationActions({ location, onDeleteClick }: LocationActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button asChild variant="ghost" size="icon" className="h-11 w-11 cursor-pointer" aria-label="Editar ubicación">
        <Link href={`/admin/locations/${location.id}`}>
          <Pencil className="h-3.5 w-3.5" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-11 w-11 cursor-pointer hover:bg-destructive/10 hover:text-destructive"
        onClick={() => onDeleteClick(location.id)}
        aria-label="Eliminar ubicación"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function LocationList({ locations, isLoading, error, hasSearch, onDeleteClick }: LocationListProps) {
  const emptyMessage = hasSearch ? 'Sin resultados para tu búsqueda' : 'No hay ubicaciones registradas';
  const emptyAction = hasSearch ? undefined : { label: 'Agregar ubicación', href: '/admin/locations/new' };

  return (
    <>
      {/* Mobile: card list */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-2 p-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))
        ) : error ? (
          <Card>
            <CardContent className="p-0">
              <ListErrorState message={error} />
            </CardContent>
          </Card>
        ) : locations.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <ListEmptyState icon={MapPin} message={emptyMessage} action={emptyAction} />
            </CardContent>
          </Card>
        ) : (
          locations.map((location) => (
            <Card key={location.id}>
              <CardContent className="space-y-2 p-4">
                <p className="font-medium">{location.canton || EMPTY_FIELD}</p>
                <p className="text-sm text-muted-foreground">{location.parroquia || EMPTY_FIELD}</p>
                <p className="font-mono text-xs text-muted-foreground">{formatCoordinates(location)}</p>
                <div className="flex justify-end pt-1">
                  <LocationActions location={location} onDeleteClick={onDeleteClick} />
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
                <TableHead>Cantón</TableHead>
                <TableHead>Parroquia</TableHead>
                <TableHead>Coordenadas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-36" />
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
              ) : locations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <ListEmptyState icon={MapPin} message={emptyMessage} action={emptyAction} />
                  </TableCell>
                </TableRow>
              ) : (
                locations.map((location) => (
                  <TableRow key={location.id} className="transition-colors hover:bg-muted/40">
                    <TableCell className="font-medium">{location.canton || EMPTY_FIELD}</TableCell>
                    <TableCell className="text-muted-foreground">{location.parroquia || EMPTY_FIELD}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatCoordinates(location)}
                    </TableCell>
                    <TableCell className="text-right">
                      <LocationActions location={location} onDeleteClick={onDeleteClick} />
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
