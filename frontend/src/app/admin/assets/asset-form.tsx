'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useCustodianOptions } from '@/hooks/use-custodian-options';
import { useLocationOptions } from '@/hooks/use-location-options';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, History, Save } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AssetCondition, ASSET_CONDITION_LABELS } from '@/lib/types';
import { normalizeText } from '@/lib/normalize-text';

const LocationPicker = dynamic(() => import('@/components/location-picker').then((m) => m.LocationPicker), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] rounded-md border border-input flex items-center justify-center text-muted-foreground text-sm">
      Cargando mapa...
    </div>
  ),
});

/**
 * Canonical canton -> parroquias catalog for Morona Santiago.
 * Source: es.wikipedia.org canton pages, fetched 2026-10-07.
 *
 * Keep in sync with backend/src/locations/morona-santiago.catalog.ts.
 */
const MORONA_SANTIAGO: Record<string, string[]> = {
  Morona: [
    'Macas',
    'Alshi',
    'Cuchaentza',
    'General Proaño',
    'Río Blanco',
    'San Isidro',
    'Sevilla Don Bosco',
    'Sinaí',
    'Zuñac',
  ],
  Gualaquiza: [
    'Gualaquiza',
    'Mercedes Molina',
    'Amazonas',
    'Bermejos',
    'Bomboiza',
    'Chigüinda',
    'El Ideal',
    'El Rosario',
    'Nueva Tarqui',
    'San Miguel de Cuyes',
  ],
  Huamboya: ['Huamboya', 'Chiguaza'],
  'Limón Indanza': [
    'General Leonidas Plaza Gutiérrez',
    'Indanza',
    'San Antonio',
    'San Miguel de Conchay',
    'Santa Susana de Chiviaza',
    'Yunganza',
  ],
  Logroño: ['Logroño', 'Nambija', 'Shimpis'],
  'Pablo Sexto': ['Pablo Sexto'],
  Palora: ['Palora', '16 de Agosto', 'Arapicos', 'Cumandá', 'Sangay'],
  'San Juan Bosco': [
    'San Juan Bosco',
    'Pan de Azúcar',
    'San Carlos de Limón',
    'San Jacinto de Wakambeis',
    'Santiago de Pananza',
  ],
  Santiago: ['Méndez', 'Copal', 'Chupianza', 'Patuca', 'San Francisco de Chinimbimi', 'San Luis del Acho', 'Tayuza'],
  Sucúa: ['Sucúa', 'Asunción', 'Huambi', 'Santa Marianita de Jesús'],
  Taisha: ['Taisha', 'Huasaga', 'Macuma', 'Pumpuentsa', 'Tuutinentza'],
  Tiwintza: ['San José de Morona', 'Santiago'],
};

/** Maps stored names to catalog spellings; values outside the catalog are kept as stored. */
function toCatalogNames(canton: string, parroquia: string): { canton: string; parroquia: string } {
  const cantonKey = Object.keys(MORONA_SANTIAGO).find((key) => normalizeText(key) === normalizeText(canton));
  if (!cantonKey) return { canton, parroquia };
  const parroquiaKey = MORONA_SANTIAGO[cantonKey].find((name) => normalizeText(name) === normalizeText(parroquia));
  return { canton: cantonKey, parroquia: parroquiaKey ?? parroquia };
}

interface AssetFormProps {
  assetId?: number;
}

interface AssetFormData {
  code: string;
  previousCode: string;
  assetName: string;
  brand: string;
  model: string;
  serialNumber: string;
  location: string;
  physicalLocation: string;
  accountCode: string;
  initialValue: number;
  currentValue: number;
  note: string;
  custodianId: string;
  canton: string;
  parroquia: string;
  condition: AssetCondition;
}

interface Coordinates {
  lat: number;
  lng: number;
}

export function AssetForm({ assetId }: AssetFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!assetId;
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const { custodians } = useCustodianOptions();
  const { locations, addLocation } = useLocationOptions();
  const [formData, setFormData] = useState<AssetFormData>({
    code: '',
    previousCode: '',
    assetName: '',
    brand: '',
    model: '',
    serialNumber: '',
    location: '',
    physicalLocation: '',
    accountCode: '',
    initialValue: 0,
    currentValue: 0,
    note: '',
    custodianId: '',
    canton: '',
    parroquia: '',
    condition: AssetCondition.BUENO,
  });
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

  const loadAsset = useCallback(async () => {
    try {
      const asset = await api.assets.getById(assetId!);
      const geoNames = toCatalogNames(asset.geoLocation?.canton || '', asset.geoLocation?.parroquia || '');
      setFormData({
        code: asset.code || '',
        previousCode: asset.previousCode || '',
        assetName: asset.assetName,
        brand: asset.brand || '',
        model: asset.model || '',
        serialNumber: asset.serialNumber || '',
        location: asset.location || '',
        physicalLocation: asset.physicalLocation || '',
        accountCode: asset.accountCode || '',
        initialValue: asset.initialValue || 0,
        currentValue: asset.currentValue || 0,
        note: asset.note || '',
        custodianId: asset.custodianId?.toString() || '',
        canton: geoNames.canton,
        parroquia: geoNames.parroquia,
        condition: asset.condition ?? AssetCondition.BUENO,
      });
      if (asset.geoLocation?.lat != null && asset.geoLocation?.lng != null) {
        setCoordinates({ lat: asset.geoLocation.lat, lng: asset.geoLocation.lng });
      }
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : 'Error al cargar el activo', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [assetId, toast]);

  useEffect(() => {
    if (isEdit) {
      loadAsset();
    }
  }, [assetId, isEdit, loadAsset]);

  async function resolveLocationId(): Promise<number | null> {
    const { canton, parroquia } = formData;
    if (!canton && !parroquia && !coordinates) return null;

    const existing = locations.find(
      (l) =>
        normalizeText(l.canton) === normalizeText(canton) && normalizeText(l.parroquia) === normalizeText(parroquia),
    );
    if (existing) return existing.id;

    try {
      const created = await api.locations.create({
        canton,
        parroquia,
        lat: coordinates?.lat ?? undefined,
        lng: coordinates?.lng ?? undefined,
      });
      addLocation(created);
      return created.id;
    } catch {
      // If the locations API is unavailable, save the asset without a geographic location
      return null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Basic validation
    if (!formData.assetName.trim()) {
      toast('El nombre del activo es requerido', 'error');
      return;
    }
    if (formData.initialValue && formData.initialValue < 0) {
      toast('El valor inicial no puede ser negativo', 'error');
      return;
    }
    if (formData.currentValue && formData.currentValue < 0) {
      toast('El valor actual no puede ser negativo', 'error');
      return;
    }

    setIsSaving(true);
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
        condition: formData.condition,
      };
      if (isEdit) {
        await api.assets.update(assetId!, data);
      } else {
        await api.assets.create(data);
      }
      router.push('/admin/assets');
      router.refresh();
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : 'Error al guardar activo', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <div>Cargando...</div>;

  const parishes = formData.canton ? (MORONA_SANTIAGO[formData.canton] ?? []) : [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/admin/assets">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{isEdit ? 'Editar activo' : 'Nuevo activo'}</h1>
        {isEdit && (
          <Button asChild variant="outline" className="ml-auto">
            <Link href={`/admin/assets/${assetId}/historial`}>
              <History className="w-4 h-4 mr-2" />
              Historial de traspasos
            </Link>
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Geographic location */}
        <Card>
          <CardHeader>
            <CardTitle>Ubicación en Morona Santiago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Label>Coordenadas de ubicación</Label>
              <LocationPicker value={coordinates} onChange={setCoordinates} />
              {coordinates && (
                <input type="hidden" name="coordinates" value={`${coordinates.lat},${coordinates.lng}`} />
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="canton">Cantón</Label>
                <Select
                  value={formData.canton}
                  onValueChange={(value) => setFormData({ ...formData, canton: value, parroquia: '' })}
                >
                  <SelectTrigger id="canton">
                    <SelectValue placeholder="Seleccionar cantón" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(MORONA_SANTIAGO).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="parroquia">Parroquia</Label>
                <Select
                  value={formData.parroquia}
                  onValueChange={(value) => setFormData({ ...formData, parroquia: value })}
                  disabled={!formData.canton}
                >
                  <SelectTrigger id="parroquia">
                    <SelectValue
                      placeholder={formData.canton ? 'Seleccionar parroquia' : 'Seleccione un cantón primero'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {parishes.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Asset information */}
        <Card>
          <CardHeader>
            <CardTitle>Información del activo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="assetName">Nombre del activo</Label>
                  <Input
                    id="assetName"
                    value={formData.assetName}
                    onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="code">Código de activo</Label>
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
                  <Label htmlFor="serialNumber">Número de serie</Label>
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
                  <Label htmlFor="custodianId">Custodio responsable</Label>
                  <Select
                    value={formData.custodianId}
                    onValueChange={(value) => setFormData({ ...formData, custodianId: value })}
                  >
                    <SelectTrigger id="custodianId">
                      <SelectValue placeholder="Seleccionar custodio" />
                    </SelectTrigger>
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
                  <Label htmlFor="condition">Condición</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) => setFormData({ ...formData, condition: value as AssetCondition })}
                  >
                    <SelectTrigger id="condition">
                      <SelectValue placeholder="Seleccionar condición" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(AssetCondition).map((value) => (
                        <SelectItem key={value} value={value}>
                          {ASSET_CONDITION_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="initialValue">Valor inicial</Label>
                  <Input
                    id="initialValue"
                    type="number"
                    step="0.01"
                    value={formData.initialValue}
                    onChange={(e) => setFormData({ ...formData, initialValue: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currentValue">Valor actual</Label>
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

        <Button type="submit" className="w-full" disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Guardando...' : 'Guardar activo'}
        </Button>
      </form>
    </div>
  );
}
