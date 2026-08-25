"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Asset, AssetMovement, Custodian, Location, MovementStatus } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ArrowLeft, ArrowRight, FileText, Plus, CheckCircle, XCircle, Clock, Users, Download, ChevronLeft, ChevronRight } from "lucide-react";

const STATUS_CONFIG: Record<MovementStatus, { label: string; icon: React.ElementType; class: string }> = {
  PENDIENTE:  { label: "Pendiente",  icon: Clock,        class: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  COMPLETADO: { label: "Completado", icon: CheckCircle,  class: "text-green-700 bg-green-50 border-green-200" },
  RECHAZADO:  { label: "Rechazado",  icon: XCircle,      class: "text-red-700 bg-red-50 border-red-200" },
};

const ITEMS_PER_PAGE = 10;

function StatusBadge({ status }: { status: MovementStatus }) {
  const { label, icon: Icon, class: cls } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border ${cls}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export default function HistorialPage() {
  const { id } = useParams<{ id: string }>();
  const assetId = parseInt(id);
  const { user } = useAuth();
  const { toast } = useToast();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [movements, setMovements] = useState<AssetMovement[]>([]);
  const [custodians, setCustodians] = useState<Custodian[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<{ movementId: number; groupId?: string | null } | null>(null);

  const [form, setForm] = useState({ toCustodianId: "", toLocationId: "", note: "" });
  const [confirmForm, setConfirmForm] = useState({ note: "", acta: null as File | null });

  const [statusFilter, setStatusFilter] = useState<MovementStatus | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    Promise.all([
      api.assets.getById(assetId),
      api.movements.getByAsset(assetId),
      api.custodians.getAll(),
      api.locations.getAll(),
    ])
      .then(([a, m, c, l]) => { setAsset(a); setMovements(m); setCustodians(c.data); setLocations(l.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [assetId]);

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      if (statusFilter && m.status !== statusFilter) return false;
      if (dateFrom) {
        const mDate = new Date(m.createdAt);
        if (mDate < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        const mDate = new Date(m.createdAt);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (mDate > toDate) return false;
      }
      return true;
    });
  }, [movements, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredMovements.length / ITEMS_PER_PAGE);
  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, dateFrom, dateTo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      if (form.toCustodianId) fd.append("toCustodianId", form.toCustodianId);
      if (form.toLocationId) fd.append("toLocationId", form.toLocationId);
      if (form.note) fd.append("note", form.note);
      const newMovement = await api.movements.create(assetId, fd);
      setMovements((prev) => [newMovement, ...prev]);
      setForm({ toCustodianId: "", toLocationId: "", note: "" });
      setShowForm(false);
      toast("Traspaso registrado exitosamente", "success");
    } catch (error: any) {
      toast(error?.message || "Error al registrar traspaso", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm(movementId: number, groupId?: string | null) {
    setSaving(true);
    try {
      const fd = new FormData();
      if (confirmForm.note) fd.append("note", confirmForm.note);
      if (confirmForm.acta) fd.append("acta", confirmForm.acta);
      
      if (groupId) {
        await api.movements.confirmBulk(groupId, fd);
        const updated = await api.movements.getByAsset(assetId);
        setMovements(updated);
      } else {
        const updated = await api.movements.confirm(assetId, movementId, fd);
        setMovements((prev) => prev.map((m) => (m.id === movementId ? updated : m)));
      }
      
      const updatedAsset = await api.assets.getById(assetId);
      setAsset(updatedAsset);
      setConfirmingId(null);
      setConfirmForm({ note: "", acta: null });
      toast("Recepción confirmada exitosamente", "success");
    } catch (error: any) {
      toast(error?.message || "Error al confirmar recepción", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleReject(movementId: number, groupId?: string | null) {
    setSaving(true);
    try {
      if (groupId) {
        await api.movements.rejectBulk(groupId);
        const updated = await api.movements.getByAsset(assetId);
        setMovements(updated);
      } else {
        const updated = await api.movements.reject(assetId, movementId);
        setMovements((prev) => prev.map((m) => (m.id === movementId ? updated : m)));
      }
      toast("Traspaso rechazado", "info");
    } catch (error: any) {
      toast(error?.message || "Error al rechazar traspaso", "error");
    } finally {
      setSaving(false);
    }
  }

  function exportToCSV() {
    const headers = ["Fecha", "Estado", "Custodio Origen", "Custodio Destino", "Ubicación Origen", "Ubicación Destino", "Observaciones", "Registrado por", "Confirmado por"];
    const rows = filteredMovements.map((m) => [
      new Date(m.createdAt).toLocaleDateString("es-EC"),
      STATUS_CONFIG[m.status].label,
      m.fromCustodian?.fullName || "",
      m.toCustodian?.fullName || "",
      [m.fromLocation?.canton, m.fromLocation?.parroquia].filter(Boolean).join(" / ") || "",
      [m.toLocation?.canton, m.toLocation?.parroquia].filter(Boolean).join(" / ") || "",
      m.note || "",
      m.registeredBy?.name || "",
      m.confirmedBy?.name || "",
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `historial_${asset?.assetName || assetId}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast("CSV exportado exitosamente", "success");
  }

  const canInitiate = isAdmin || (!!user?.custodianId && asset?.custodianId === user?.custodianId);

  if (loading) return <div className="p-6">Cargando...</div>;
  if (!asset) return <div className="p-6">Activo no encontrado</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/admin/assets/${assetId}`}>
          <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Historial de Traspasos</h1>
          <p className="text-muted-foreground">
            {asset.assetName}{asset.code ? ` — ${asset.code}` : ""}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          {filteredMovements.length > 0 && (
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          )}
          {canInitiate && (
            <Button onClick={() => setShowForm((v) => !v)}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Traspaso
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Iniciar Traspaso</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Custodio receptor</Label>
                  <Select value={form.toCustodianId} onValueChange={(value) => setForm({ ...form, toCustodianId: value })}>
                    <SelectTrigger><SelectValue placeholder="Sin cambio de custodio" /></SelectTrigger>
                    <SelectContent>
                      {custodians.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.fullName} ({c.identifier})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Ubicación destino</Label>
                  <Select value={form.toLocationId} onValueChange={(value) => setForm({ ...form, toLocationId: value })}>
                    <SelectTrigger><SelectValue placeholder="Sin cambio de ubicación" /></SelectTrigger>
                    <SelectContent>
                      {locations.map((l) => <SelectItem key={l.id} value={String(l.id)}>{[l.canton, l.parroquia].filter(Boolean).join(" / ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Observaciones</Label>
                <Textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Motivo del traspaso, estado del bien, etc."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Registrar Traspaso"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Movimientos ({filteredMovements.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="grid gap-2">
              <Label className="text-xs">Estado</Label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as MovementStatus | "")}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                    <SelectItem value="COMPLETADO">Completado</SelectItem>
                    <SelectItem value="RECHAZADO">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Desde</Label>
              <Input
                type="date"
                className="w-40"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Hasta</Label>
              <Input
                type="date"
                className="w-40"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            {(statusFilter || dateFrom || dateTo) && (
              <div className="grid gap-2">
                <Label className="text-xs invisible">Limpiar</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setStatusFilter(""); setDateFrom(""); setDateTo(""); }}
                >
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>

          {filteredMovements.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              {movements.length === 0 ? "No hay traspasos registrados." : "No hay traspasos con los filtros seleccionados."}
            </p>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedMovements.map((m) => {
                  const isPending = m.status === "PENDIENTE";
                  const canAct = isPending && (isAdmin || user?.custodianId === m.toCustodianId);
                  const isConfirming = confirmingId === m.id;

                  return (
                    <div key={m.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {new Date(m.createdAt).toLocaleDateString("es-EC", { year: "numeric", month: "short", day: "numeric" })}
                            </span>
                            <StatusBadge status={m.status} />
                            {m.groupId && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border text-blue-700 bg-blue-50 border-blue-200">
                                <Users className="w-3 h-3" />
                                Grupo
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">Custodio:</span>
                            <CustodianChange from={m.fromCustodian?.fullName} to={m.toCustodian?.fullName} />
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">Ubicación:</span>
                            <LocationChange
                              from={[m.fromLocation?.canton, m.fromLocation?.parroquia].filter(Boolean).join(" / ")}
                              to={[m.toLocation?.canton, m.toLocation?.parroquia].filter(Boolean).join(" / ")}
                            />
                          </div>
                          {m.note && <p className="text-muted-foreground">{m.note}</p>}
                        </div>
                        <div className="flex flex-col gap-1 items-end text-xs text-muted-foreground shrink-0">
                          {m.actaUrl && (
                            <a href={m.actaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                              <FileText className="w-3.5 h-3.5" /> Ver acta
                            </a>
                          )}
                          <span>Iniciado por: {m.registeredBy?.name ?? "—"}</span>
                          {m.confirmedBy && <span>Confirmado por: {m.confirmedBy.name}</span>}
                        </div>
                      </div>

                      {canAct && !isConfirming && (
                        <div className="flex gap-2 pt-1 border-t">
                          <Button size="sm" onClick={() => setConfirmingId(m.id)}>
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> 
                            {m.groupId ? "Confirmar grupo" : "Confirmar recepción"}
                          </Button>
                           <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => setRejecting({ movementId: m.id, groupId: m.groupId })} disabled={saving}>
                            <XCircle className="w-3.5 h-3.5 mr-1.5" /> 
                            {m.groupId ? "Rechazar grupo" : "Rechazar"}
                          </Button>
                        </div>
                      )}

                      {isConfirming && (
                        <div className="border-t pt-3 space-y-3">
                          <p className="text-sm font-medium">
                            {m.groupId ? "Confirmar recepción del grupo" : "Confirmar recepción del bien"}
                          </p>
                          <div className="grid gap-2">
                            <Label className="text-xs">Acta firmada por ambas partes (PDF, JPG o PNG, máx. 10 MB)</Label>
                            <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setConfirmForm({ ...confirmForm, acta: e.target.files?.[0] ?? null })} />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-xs">Observaciones de la recepción</Label>
                            <Input placeholder="Estado del bien al recibirlo, etc." value={confirmForm.note} onChange={(e) => setConfirmForm({ ...confirmForm, note: e.target.value })} />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleConfirm(m.id, m.groupId)} disabled={saving}>
                              {saving ? "Guardando..." : "Confirmar"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setConfirmingId(null)}>Cancelar</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <ConfirmDialog
        open={rejecting !== null}
        onOpenChange={(open) => { if (!open) setRejecting(null); }}
        title="¿Rechazar este traspaso? El bien permanecerá con el custodio actual."
        description=""
        onConfirm={() => {
          if (rejecting) void handleReject(rejecting.movementId, rejecting.groupId);
          setRejecting(null);
        }}
      />
    </div>
  );
}

function CustodianChange({ from, to }: { from?: string; to?: string }) {
  if (!from && !to) return <>—</>;
  if (!to) return <span className="text-muted-foreground">{from}</span>;
  return (
    <span className="flex items-center gap-1 flex-wrap">
      <span className="text-muted-foreground line-through text-xs">{from ?? "ninguno"}</span>
      <ArrowRight className="w-3 h-3 shrink-0" />
      <span className="font-medium">{to}</span>
    </span>
  );
}

function LocationChange({ from, to }: { from?: string; to?: string }) {
  if (!from && !to) return <>—</>;
  if (!to) return <span className="text-muted-foreground">{from}</span>;
  return (
    <span className="flex items-center gap-1 flex-wrap">
      <span className="text-muted-foreground line-through text-xs">{from || "ninguna"}</span>
      <ArrowRight className="w-3 h-3 shrink-0" />
      <span className="font-medium">{to}</span>
    </span>
  );
}
