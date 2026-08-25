"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Custodian, Location } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, History, Save } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const LocationPicker = dynamic(
  () => import("@/components/location-picker").then((m) => m.LocationPicker),
  { ssr: false, loading: () => <div className="h-[320px] rounded-md border border-input flex items-center justify-center text-muted-foreground text-sm">Cargando mapa...</div> }
);

const MORONA_SANTIAGO: Record<string, string[]> = {
  "Morona": [
    "Macas", "Alshi", "General Proaño", "Huambi", "Proaño",
    "Río Blanco", "San Isidro", "Sevilla Don Bosco", "Sinaí", "Zuñac",
  ],
  "Gualaquiza": [
    "Gualaquiza", "Amazonas", "Bomboiza", "Chiguinda",
    "El Ideal", "El Rosario", "Nueva Tarqui",
  ],
  "Huamboya": ["Huamboya", "Chiguaza"],
  "Limón Indanza": [
    "General Leonidas Plaza Gutiérrez", "Indanza", "San Antonio",
    "San Miguel de Conchay", "Santa Susana de Chiviaza", "Yunganza",
  ],
  "Logroño": ["Logroño", "Nambija", "Shimpis"],
  "Pablo Sexto": ["Pablo Sexto"],
  "Palora": ["Palora", "Arapicos", "Cumandá", "Guiaza", "Sangay"],
  "San Juan Bosco": [
    "San Juan Bosco", "El Rosario", "Pan de Azúcar",
    "San Jacinto de Wakambeis", "Santiago de Pananza",
  ],
  "Santiago": [
    "Santiago de Méndez", "Copal", "Chupianza",
    "Patuca", "San Luis del Acho", "Tayuza",
  ],
  "Sucúa": ["Sucúa", "Asunción", "Huambi", "Santa Marianita de Jesús"],
  "Taisha": ["Taisha", "Huasaga", "Macuma", "Pumpuentsa", "Tuutinentza"],
  "Tiwintza": ["San José de Morona", "Santiago"],
};

interface AssetFormProps {
  assetId?: number;
}

export function AssetForm({ assetId }: AssetFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!assetId;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [custodians, setCustodians] = useState<Custodian[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [formData, setFormData] = useState({
    code: "",
    previousCode: "",
    assetName: "",
    brand: "",
    model: "",
    serialNumber: "",
    location: "",
    physicalLocation: "",
    accountCode: "",
    initialValue: 0,
    currentValue: 0,
    note: "",
    custodianId: "",
    canton: "",
    parroquia: "",
  });
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const loadAsset = useCallback(async () => {
    try {
      const asset = await api.assets.getById(assetId!);
      setFormData({
        code: asset.code || "",
        previousCode: asset.previousCode || "",
        assetName: asset.assetName,
        brand: asset.brand || "",
        model: asset.model || "",
        serialNumber: asset.serialNumber || "",
        location: asset.location || "",
        physicalLocation: asset.physicalLocation || "",
        accountCode: asset.accountCode || "",
        initialValue: asset.initialValue || 0,
        currentValue: asset.currentValue || 0,
        note: asset.note || "",
        custodianId: asset.custodianId?.toString() || "",
        canton: asset.geoLocation?.canton || "",
        parroquia: asset.geoLocation?.parroquia || "",
      });
      if (asset.geoLocation?.lat != null && asset.geoLocation?.lng != null) {
        setCoordinates({ lat: asset.geoLocation.lat, lng: asset.geoLocation.lng });
      }
    } catch (error) {
      console.error("Error loading asset:", error);
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    loadCustodians();
    loadLocations();
    if (isEdit) {
      loadAsset();
    }
  }, [assetId, isEdit, loadAsset]);

  async function loadCustodians() {
    try {
      const data = await api.custodians.getAll();
      setCustodians(data.data);
    } catch (error) {
      console.error("Error loading custodians:", error);
    }
  }

  async function loadLocations() {
    try {
      const data = await api.locations.getAll();
      setLocations(data.data);
    } catch (error) {
      console.error("Error loading locations:", error);
    }
  }

  async function resolveLocationId(): Promise<number | null> {
    const { canton, parroquia } = formData;
    if (!canton && !parroquia && !coordinates) return null;

    const existing = locations.find(
      (l) => l.canton === canton && l.parroquia === parroquia
    );
    if (existing) return existing.id;

    try {
      const created = await api.locations.create({
        canton,
        parroquia,
        lat: coordinates?.lat ?? undefined,
        lng: coordinates?.lng ?? undefined,
      });
      setLocations((prev) => [...prev, created]);
      return created.id;
    } catch {
      // Si el API de ubicaciones no está disponible, guardar sin ubicación geográfica
      return null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Basic validation
    if (!formData.assetName.trim()) {
      toast("El nombre del activo es requerido", "error");
      return;
    }
    if (formData.initialValue && formData.initialValue < 0) {
      toast("El valor inicial no puede ser negativo", "error");
      return;
    }
    if (formData.currentValue && formData.currentValue < 0) {
      toast("El valor actual no puede ser negativo", "error");
      return;
    }
    
    setSaving(true);
    try {
      const locationId = await resolveLocationId();
      const nullStr = (v: string) => v.trim() || null;
      const data = {
        code: nullStr(formData.code),
        previousCode: nullStr(formData.previousCode),
        assetName: formData.assetName,
        brand: nullStr(formData.brand),
        model: nullStr(formData.model),
        serialNumber: nullStr(formData.serialNumber),
        location: nullStr(formData.location),
        physicalLocation: nullStr(formData.physicalLocation),
        accountCode: nullStr(formData.accountCode),
        note: nullStr(formData.note),
        custodianId: formData.custodianId ? parseInt(formData.custodianId) : null,
        locationId,
        initialValue: formData.initialValue || null,
        currentValue: formData.currentValue || null,
      };
      if (isEdit) {
        await api.assets.update(assetId!, data);
      } else {
        await api.assets.create(data);
      }
      router.push("/admin/assets");
      router.refresh();
    } catch (error: any) {
      toast(error?.message || "Error al guardar activo", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Cargando...</div>;

  const parroquias = formData.canton ? (MORONA_SANTIAGO[formData.canton] ?? []) : [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/assets">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">
          {isEdit ? "Editar Activo" : "Nuevo Activo"}
        </h1>
        {isEdit && (
          <Link href={`/admin/assets/${assetId}/historial`} className="ml-auto">
            <Button variant="outline">
              <History className="w-4 h-4 mr-2" />
              Historial de Traspasos
            </Button>
          </Link>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Ubicación Geográfica */}
        <Card>
          <CardHeader>
            <CardTitle>Ubicación Geográfica — Morona Santiago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
                <Label>Coordenadas de Ubicación</Label>
                <LocationPicker value={coordinates} onChange={setCoordinates} />
                {coordinates && (
                  <input type="hidden" name="coordinates" value={`${coordinates.lat},${coordinates.lng}`} />
                )}
              </div>
            <div className="grid md:grid-cols-2 gap-4">
              
              <div className="grid gap-2">
                <Label htmlFor="canton">Cantón</Label>
                <Select value={formData.canton} onValueChange={(value) =>
                  setFormData({ ...formData, canton: value, parroquia: "" })
                }>
                  <SelectTrigger id="canton"><SelectValue placeholder="Seleccionar cantón" /></SelectTrigger>
                  <SelectContent>
                  {Object.keys(MORONA_SANTIAGO).map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="parroquia">Parroquia</Label>
                <Select value={formData.parroquia} onValueChange={(value) =>
                  setFormData({ ...formData, parroquia: value })
                } disabled={!formData.canton}>
                  <SelectTrigger id="parroquia"><SelectValue placeholder={formData.canton ? "Seleccionar parroquia" : "Seleccione un cantón primero"} /></SelectTrigger>
                  <SelectContent>
                  {parroquias.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información del Activo */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Activo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="assetName">Nombre del Activo</Label>
                  <Input
                    id="assetName"
                    value={formData.assetName}
                    onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="code">Código de Activo</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="brand">Marca</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="model">Modelo</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="serialNumber">Número de Serie</Label>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="custodianId">Custodio Responsable</Label>
                  <Select value={formData.custodianId} onValueChange={(value) => setFormData({ ...formData, custodianId: value })}>
                    <SelectTrigger id="custodianId"><SelectValue placeholder="Seleccionar Custodio" /></SelectTrigger>
                    <SelectContent>
                    {custodians.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.fullName} ({c.identifier})
                      </SelectItem>
                    ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="initialValue">Valor Inicial</Label>
                  <Input
                    id="initialValue"
                    type="number"
                    step="0.01"
                    value={formData.initialValue}
                    onChange={(e) => setFormData({ ...formData, initialValue: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currentValue">Valor Actual</Label>
                  <Input
                    id="currentValue"
                    type="number"
                    step="0.01"
                    value={formData.currentValue}
                    onChange={(e) => setFormData({ ...formData, currentValue: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="note">Notas / Observaciones</Label>
                <Textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Guardando..." : "Guardar Activo"}
        </Button>

      </form>
    </div>
  );
}
