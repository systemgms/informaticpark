"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Asset, Custodian, Location } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Package, Search, CheckSquare, Square, Send, AlertCircle } from "lucide-react";

export default function TraspasarPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const isAdmin = user?.role === "ADMIN";

  const [assets, setAssets] = useState<Asset[]>([]);
  const [custodians, setCustodians] = useState<Custodian[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    toCustodianId: "",
    toLocationId: "",
    note: "",
  });

  useEffect(() => {
    Promise.all([
      api.assets.getAll(),
      api.custodians.getAll(),
      api.locations.getAll(),
    ])
      .then(([a, c, l]) => {
        setAssets(a.data);
        setCustodians(c.data);
        setLocations(l.data);
      })
      .catch((err) => setError(err.message || "Error al cargar datos"))
      .finally(() => setLoading(false));
  }, []);

  const visibleAssets =
    isAdmin
      ? assets
      : assets.filter((a) => a.custodianId === user?.custodianId);

  const filteredAssets = visibleAssets.filter(
    (a) =>
      a.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredAssets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAssets.map((a) => a.id)));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.size === 0) {
      toast("Selecciona al menos un activo para traspasar.", "error");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("assetIds", JSON.stringify([...selectedIds]));
      if (form.toCustodianId) fd.append("toCustodianId", form.toCustodianId);
      if (form.toLocationId) fd.append("toLocationId", form.toLocationId);
      if (form.note) fd.append("note", form.note);
      await api.movements.createBulk(fd);
      toast(`Traspaso masivo registrado: ${selectedIds.size} activo(s).`, "success");
      router.push("/admin/assets");
    } catch (err: any) {
      toast(err?.message || "Error al registrar traspaso masivo", "error");
    } finally {
      setSaving(false);
    }
  }

  const allSelected = filteredAssets.length > 0 && selectedIds.size === filteredAssets.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/assets">
          <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Traspaso Masivo</h1>
          <p className="text-muted-foreground text-sm mt-1">Selecciona uno o más activos para traspasar simultáneamente.</p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4 flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seleccionar Activos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                {filteredAssets.length} {filteredAssets.length === 1 ? "activo" : "activos"}
              </span>
            )}
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-10">
                    <button onClick={toggleSelectAll} className="cursor-pointer">
                      {allSelected ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : someSelected ? (
                        <div className="w-4 h-4 border-2 border-primary rounded flex items-center justify-center">
                          <div className="w-2 h-0.5 bg-primary rounded" />
                        </div>
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre del Activo</TableHead>
                  <TableHead>Marca / Modelo</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Custodio Actual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="w-4 h-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Package className="w-8 h-8" />
                        <p className="text-sm font-medium">
                          {searchTerm ? "Sin resultados para tu búsqueda" : "No hay activos disponibles"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssets.map((a) => {
                    const isSelected = selectedIds.has(a.id);
                    return (
                      <TableRow
                        key={a.id}
                        className={`hover:bg-muted/40 transition-colors cursor-pointer ${isSelected ? "bg-primary/5" : ""}`}
                        onClick={() => toggleSelect(a.id)}
                      >
                        <TableCell>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{a.code || "—"}</TableCell>
                        <TableCell className="font-medium">{a.assetName}</TableCell>
                        <TableCell className="text-muted-foreground">{[a.brand, a.model].filter(Boolean).join(" ") || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{a.location || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{a.custodian?.fullName || "—"}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedIds.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Datos del Traspaso ({selectedIds.size} activo{selectedIds.size > 1 ? "s" : ""})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Custodio receptor</Label>
                  <Select value={form.toCustodianId} onValueChange={(value) => setForm({ ...form, toCustodianId: value })}>
                    <SelectTrigger><SelectValue placeholder="Sin cambio de custodio" /></SelectTrigger>
                    <SelectContent>
                    {custodians.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.fullName} ({c.identifier})</SelectItem>
                    ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Ubicación destino</Label>
                  <Select value={form.toLocationId} onValueChange={(value) => setForm({ ...form, toLocationId: value })}>
                    <SelectTrigger><SelectValue placeholder="Sin cambio de ubicación" /></SelectTrigger>
                    <SelectContent>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={String(l.id)}>{[l.canton, l.parroquia].filter(Boolean).join(" / ")}</SelectItem>
                    ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Observaciones</Label>
                <Textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Motivo del traspaso, notas generales, etc."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving} className="cursor-pointer">
                  <Send className="w-4 h-4 mr-2" />
                  {saving ? "Registrando..." : `Traspasar ${selectedIds.size} activo(s)`}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedIds(new Set())}
                  className="cursor-pointer"
                >
                  Limpiar selección
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
