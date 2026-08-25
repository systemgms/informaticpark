"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Asset } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
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
import { Package, Pencil, Trash2, Plus, Search, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function AssetsAdminPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<number | null>(null);

  useEffect(() => { loadAssets(); }, []);

  async function loadAssets() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.assets.getAll();
      setAssets(response.data || []);
    } catch (err: any) {
      setError(err.message || "Error al cargar activos.");
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteClick(id: number) {
    setAssetToDelete(id);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (assetToDelete === null) return;
    try {
      await api.assets.delete(assetToDelete);
      loadAssets();
    } catch {
      // Error handled silently - user will see the list refresh
    }
  }

  const visibleAssets =
    user?.role === "ADMIN"
      ? assets
      : assets.filter((a) => a.custodianId === user?.custodianId);

  const filteredAssets = visibleAssets.filter(a =>
    a.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activos</h1>
          <p className="text-muted-foreground text-sm mt-1">Control de inventario y equipos.</p>
        </div>
        {user?.role === "ADMIN" && (
          <Link href="/admin/assets/new">
            <Button className="cursor-pointer shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Activo
            </Button>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {!loading && (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {filteredAssets.length} {filteredAssets.length === 1 ? "resultado" : "resultados"}
          </span>
        )}
      </div>

      <Card>
        <CardContent className="pt-6 p-0 overflow-hidden rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Código</TableHead>
                <TableHead>Nombre del Activo</TableHead>
                <TableHead>Marca / Modelo</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Valor Actual</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12">
                    <div className="flex flex-col items-center gap-2 text-destructive">
                      <AlertCircle className="w-8 h-8" />
                      <p className="text-sm font-medium">Error al cargar datos</p>
                      <p className="text-xs text-muted-foreground">{error}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Package className="w-8 h-8" />
                      <p className="text-sm font-medium">
                        {searchTerm ? "Sin resultados para tu búsqueda" : "No hay activos registrados"}
                      </p>
                      {!searchTerm && (
                        <Link href="/admin/assets/new">
                          <Button size="sm" variant="outline" className="mt-1 cursor-pointer">
                            <Plus className="w-3 h-3 mr-1" /> Agregar activo
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssets.map((a) => (
                  <TableRow key={a.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground">{a.code || "—"}</TableCell>
                    <TableCell className="font-medium">{a.assetName}</TableCell>
                    <TableCell className="text-muted-foreground">{[a.brand, a.model].filter(Boolean).join(" ") || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{a.location || "—"}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {a.currentValue != null ? `$${a.currentValue.toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {user?.role === "ADMIN" ? (
                          <>
                            <Link href={`/admin/assets/${a.id}`}>
                              <Button variant="ghost" size="icon" className="cursor-pointer h-8 w-8" aria-label="Editar activo">
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="cursor-pointer h-8 w-8 hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteClick(a.id)}
                              aria-label="Eliminar activo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        ) : (
                          <Link href={`/admin/assets/${a.id}/historial`}>
                            <Button variant="ghost" size="sm" className="cursor-pointer h-8 text-xs">
                              Traspasos
                            </Button>
                          </Link>
                        )}
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
        title="Eliminar activo"
        description="¿Estás seguro de que deseas eliminar este activo? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
