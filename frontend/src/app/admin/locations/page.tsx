"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Location } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Pencil, Trash2, Plus, AlertCircle } from "lucide-react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function LocationsAdminPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<number | null>(null);

  useEffect(() => { loadLocations(); }, []);

  async function loadLocations() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.locations.getAll();
      setLocations(response.data || []);
    } catch (err: any) {
      setError(err.message || "Error al cargar ubicaciones.");
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteClick(id: number) {
    setLocationToDelete(id);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (locationToDelete === null) return;
    try {
      await api.locations.delete(locationToDelete);
      loadLocations();
    } catch {
      // Error handled silently
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ubicaciones</h1>
          <p className="text-muted-foreground text-sm mt-1">Cantones y parroquias del parque informático.</p>
        </div>
        <Link href="/admin/locations/new">
          <Button className="cursor-pointer shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Ubicación
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6 p-0 overflow-hidden rounded-lg">
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
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12">
                    <div className="flex flex-col items-center gap-2 text-destructive">
                      <AlertCircle className="w-8 h-8" />
                      <p className="text-sm font-medium">Error al cargar datos</p>
                      <p className="text-xs text-muted-foreground">{error}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : locations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <MapPin className="w-8 h-8" />
                      <p className="text-sm font-medium">No hay ubicaciones registradas</p>
                      <Link href="/admin/locations/new">
                        <Button size="sm" variant="outline" className="mt-1 cursor-pointer">
                          <Plus className="w-3 h-3 mr-1" /> Agregar ubicación
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                locations.map((l) => (
                  <TableRow key={l.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{l.canton || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{l.parroquia || "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {l.lat != null && l.lng != null
                        ? `${l.lat.toFixed(4)}, ${l.lng.toFixed(4)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/locations/${l.id}`}>
                          <Button variant="ghost" size="icon" className="cursor-pointer h-8 w-8" aria-label="Editar ubicación">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer h-8 w-8 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteClick(l.id)}
                          aria-label="Eliminar ubicación"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Eliminar ubicación"
        description="¿Estás seguro de que deseas eliminar esta ubicación? Los activos y custodios vinculados quedarán sin ubicación."
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
