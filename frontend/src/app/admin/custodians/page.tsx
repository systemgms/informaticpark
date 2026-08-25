"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Custodian } from "@/lib/types";
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
import { Building2, Pencil, Trash2, Plus, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function CustodiansAdminPage() {
  const router = useRouter();
  const [custodians, setCustodians] = useState<Custodian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [custodianToDelete, setCustodianToDelete] = useState<number | null>(null);

  useEffect(() => { loadCustodians(); }, []);

  async function loadCustodians() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.custodians.getAll();
      setCustodians(response.data || []);
    } catch (err: any) {
      setError(err.message || "Error al cargar custodios.");
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteClick(id: number) {
    setCustodianToDelete(id);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (custodianToDelete === null) return;
    try {
      await api.custodians.delete(custodianToDelete);
      loadCustodians();
    } catch {
      // Error handled silently
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custodios</h1>
          <p className="text-muted-foreground text-sm mt-1">Responsables de los activos asignados.</p>
        </div>
        <Link href="/admin/custodians/new">
          <Button className="cursor-pointer shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Custodio
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6 p-0 overflow-hidden rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Identificador</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
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
              ) : custodians.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Building2 className="w-8 h-8" />
                      <p className="text-sm font-medium">No hay custodios registrados</p>
                      <Link href="/admin/custodians/new">
                        <Button size="sm" variant="outline" className="mt-1 cursor-pointer">
                          <Plus className="w-3 h-3 mr-1" /> Agregar custodio
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                custodians.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => router.push(`/admin/custodians/${c.id}/assets`)}
                  >
                    <TableCell className="font-medium">{c.fullName}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{c.identifier}</TableCell>
                    <TableCell className="text-muted-foreground">{c.unit || "—"}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/custodians/${c.id}`}>
                          <Button variant="ghost" size="icon" className="cursor-pointer h-8 w-8" aria-label="Editar custodio">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer h-8 w-8 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteClick(c.id)}
                          aria-label="Eliminar custodio"
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
        title="Eliminar custodio"
        description="¿Estás seguro de que deseas eliminar este custodio? Los activos y traspasos vinculados podrían verse afectados."
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
