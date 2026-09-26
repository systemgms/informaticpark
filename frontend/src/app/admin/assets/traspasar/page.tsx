'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Asset } from '@/lib/types';
import { useToast } from '@/components/ui/toast';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useCustodianOptions } from '@/hooks/use-custodian-options';
import { useLocationOptions } from '@/hooks/use-location-options';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Pagination } from '@/components/pagination';
import { ListSearchInput } from '@/components/list-search-input';
import { ArrowLeft, Send, X } from 'lucide-react';
import { SelectableAssetList } from './selectable-asset-list';

interface BulkTransferForm {
  toCustodianId: string;
  toLocationId: string;
  note: string;
}

interface BulkTransferPayload {
  assetIds: number[];
  toCustodianId?: number;
  toLocationId?: number;
  note?: string;
}

export default function BulkTransferPage() {
  const router = useRouter();
  const { toast } = useToast();

  const { custodians } = useCustodianOptions();
  const { locations } = useLocationOptions();

  const [selectedAssets, setSelectedAssets] = useState<Map<number, Asset>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<BulkTransferForm>({ toCustodianId: '', toLocationId: '', note: '' });

  const fetchAssets = useCallback(
    (params: { page: number; limit: number; search: string }) => api.assets.getAll(params),
    [],
  );

  const {
    items: assets,
    meta,
    page,
    setPage,
    search,
    setSearch,
    isLoading,
    error,
  } = usePaginatedList<Asset>({ fetchPage: fetchAssets });

  const selectedIds = useMemo(() => new Set(selectedAssets.keys()), [selectedAssets]);
  const selectedList = useMemo(() => Array.from(selectedAssets.values()), [selectedAssets]);
  const isAllOnPageSelected = assets.length > 0 && assets.every((asset) => selectedAssets.has(asset.id));

  function toggleSelect(asset: Asset) {
    setSelectedAssets((prev) => {
      const next = new Map(prev);
      if (next.has(asset.id)) {
        next.delete(asset.id);
      } else {
        next.set(asset.id, asset);
      }
      return next;
    });
  }

  function toggleSelectAllOnPage() {
    setSelectedAssets((prev) => {
      const next = new Map(prev);
      if (isAllOnPageSelected) {
        assets.forEach((asset) => next.delete(asset.id));
      } else {
        assets.forEach((asset) => next.set(asset.id, asset));
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedAssets(new Map());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedAssets.size === 0) {
      toast('Selecciona al menos un activo para traspasar.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const payload: BulkTransferPayload = {
        assetIds: Array.from(selectedAssets.keys()),
      };
      if (form.toCustodianId) payload.toCustodianId = Number(form.toCustodianId);
      if (form.toLocationId) payload.toLocationId = Number(form.toLocationId);
      if (form.note) payload.note = form.note;
      await api.movements.createBulk(payload);
      toast(`Traspaso masivo registrado: ${selectedAssets.size} activo(s).`, 'success');
      router.push('/admin/assets');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al registrar traspaso masivo';
      toast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/assets">
          <Button variant="outline" size="icon" className="h-11 w-11">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Traspaso Masivo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Selecciona uno o más activos para traspasar simultáneamente.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seleccionar Activos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <ListSearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o código..." />
            {!isLoading && meta && (
              <span className="whitespace-nowrap text-sm text-muted-foreground">
                {meta.total} {meta.total === 1 ? 'activo' : 'activos'} · {selectedAssets.size} seleccionado(s)
              </span>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-11 cursor-pointer"
            onClick={toggleSelectAllOnPage}
            disabled={assets.length === 0}
          >
            {isAllOnPageSelected ? 'Deseleccionar página actual' : 'Seleccionar página actual'}
          </Button>

          <SelectableAssetList
            assets={assets}
            isLoading={isLoading}
            error={error}
            hasSearch={search.length > 0}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
          />

          {meta && <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />}
        </CardContent>
      </Card>

      {selectedList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Datos del Traspaso ({selectedList.length} activo{selectedList.length > 1 ? 's' : ''})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {selectedList.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => toggleSelect(asset)}
                  className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs"
                  aria-label={`Quitar ${asset.assetName} de la selección`}
                >
                  {asset.assetName}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Custodio receptor</Label>
                  <Select
                    value={form.toCustodianId}
                    onValueChange={(value) => setForm({ ...form, toCustodianId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin cambio de custodio" />
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
                  <Label>Ubicación destino</Label>
                  <Select
                    value={form.toLocationId}
                    onValueChange={(value) => setForm({ ...form, toLocationId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin cambio de ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((l) => (
                        <SelectItem key={l.id} value={String(l.id)}>
                          {[l.canton, l.parroquia].filter(Boolean).join(' / ')}
                        </SelectItem>
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
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" disabled={isSaving} className="h-11 cursor-pointer">
                  <Send className="mr-2 h-4 w-4" />
                  {isSaving ? 'Registrando...' : `Traspasar ${selectedList.length} activo(s)`}
                </Button>
                <Button type="button" variant="outline" onClick={clearSelection} className="h-11 cursor-pointer">
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
