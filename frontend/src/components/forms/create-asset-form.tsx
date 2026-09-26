'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

interface CreateAssetFormData {
  assetName: string;
  code: string;
  brand: string;
  model: string;
  serialNumber: string;
  location: string;
  physicalLocation: string;
  accountCode: string;
  note: string;
  initialValue: string;
  currentValue: string;
  custodianId: string;
  locationId: string;
}

type CreateAssetFormErrors = Partial<Record<keyof CreateAssetFormData, string>>;

const INITIAL_FORM_DATA: CreateAssetFormData = {
  assetName: '',
  code: '',
  brand: '',
  model: '',
  serialNumber: '',
  location: '',
  physicalLocation: '',
  accountCode: '',
  note: '',
  initialValue: '',
  currentValue: '',
  custodianId: '',
  locationId: '',
};

function validate(formData: CreateAssetFormData): CreateAssetFormErrors {
  const errors: CreateAssetFormErrors = {};
  if (!formData.assetName.trim()) errors.assetName = 'Nombre requerido';
  else if (formData.assetName.length > 200) errors.assetName = 'Máximo 200 caracteres';
  if (formData.code.length > 50) errors.code = 'Máximo 50 caracteres';
  if (formData.brand.length > 100) errors.brand = 'Máximo 100 caracteres';
  if (formData.model.length > 100) errors.model = 'Máximo 100 caracteres';
  if (formData.serialNumber.length > 100) errors.serialNumber = 'Máximo 100 caracteres';
  if (formData.location.length > 200) errors.location = 'Máximo 200 caracteres';
  if (formData.note.length > 500) errors.note = 'Máximo 500 caracteres';
  if (!formData.locationId.trim()) errors.locationId = 'Ubicación requerida';
  if (!formData.custodianId.trim()) errors.custodianId = 'Custodio requerido';
  if (!formData.initialValue.trim()) errors.initialValue = 'Valor requerido';
  else if (Number(formData.initialValue) < 0) errors.initialValue = 'Valor debe ser ≥ 0';
  if (!formData.currentValue.trim()) errors.currentValue = 'Valor requerido';
  else if (Number(formData.currentValue) < 0) errors.currentValue = 'Valor debe ser ≥ 0';
  return errors;
}

export function CreateAssetForm() {
  const [formData, setFormData] = useState<CreateAssetFormData>(INITIAL_FORM_DATA);
  const [fieldErrors, setFieldErrors] = useState<CreateAssetFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDirty = JSON.stringify(formData) !== JSON.stringify(INITIAL_FORM_DATA);

  function handleChange(field: keyof CreateAssetFormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  function handleCancel() {
    setFormData(INITIAL_FORM_DATA);
    setFieldErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSuccess(false);

    const errors = validate(formData);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      await api.assets.create({
        assetName: formData.assetName,
        code: formData.code || undefined,
        previousCode: undefined,
        brand: formData.brand || undefined,
        model: formData.model || undefined,
        serialNumber: formData.serialNumber || undefined,
        location: formData.location || undefined,
        physicalLocation: formData.physicalLocation || undefined,
        accountCode: formData.accountCode || undefined,
        note: formData.note || undefined,
        initialValue: formData.initialValue ? Number(formData.initialValue) : undefined,
        currentValue: formData.currentValue ? Number(formData.currentValue) : undefined,
        custodianId: formData.custodianId ? Number(formData.custodianId) : undefined,
        locationId: formData.locationId ? Number(formData.locationId) : undefined,
      });

      setIsSuccess(true);
      setFormData(INITIAL_FORM_DATA);
      setFieldErrors({});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear el activo');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Crear Nuevo Activo</h2>

      {error && <div className="mb-4 p-3 rounded bg-red-100 border border-red-400 text-red-700">{error}</div>}

      {isSuccess && (
        <div className="mb-4 p-3 rounded bg-green-100 border border-green-400 text-green-700">
          Activo creado exitosamente
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Nombre del activo*</label>
          <Input
            value={formData.assetName}
            onChange={handleChange('assetName')}
            placeholder="Ej: Computadora portátil"
          />
          {fieldErrors.assetName && <p className="mt-1 text-sm text-red-600">{fieldErrors.assetName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Código (opcional)</label>
          <Input value={formData.code} onChange={handleChange('code')} placeholder="Ej: ACT-0001" />
          {fieldErrors.code && <p className="mt-1 text-sm text-red-600">{fieldErrors.code}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Marca</label>
            <Input value={formData.brand} onChange={handleChange('brand')} placeholder="Ej: Dell" />
            {fieldErrors.brand && <p className="mt-1 text-sm text-red-600">{fieldErrors.brand}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Modelo</label>
            <Input value={formData.model} onChange={handleChange('model')} placeholder="Ej: XPS 13" />
            {fieldErrors.model && <p className="mt-1 text-sm text-red-600">{fieldErrors.model}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Número de serie</label>
          <Input value={formData.serialNumber} onChange={handleChange('serialNumber')} placeholder="Ej: CNU12345678" />
          {fieldErrors.serialNumber && <p className="mt-1 text-sm text-red-600">{fieldErrors.serialNumber}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Ubicación actual</label>
          <Input value={formData.location} onChange={handleChange('location')} placeholder="Ej: Almacén principal" />
          {fieldErrors.location && <p className="mt-1 text-sm text-red-600">{fieldErrors.location}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Ubicación FK</label>
            <Input value={formData.locationId} onChange={handleChange('locationId')} placeholder="ID ubicación" />
            {fieldErrors.locationId && <p className="mt-1 text-sm text-red-600">{fieldErrors.locationId}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Custodio FK</label>
            <Input value={formData.custodianId} onChange={handleChange('custodianId')} placeholder="ID custodio" />
            {fieldErrors.custodianId && <p className="mt-1 text-sm text-red-600">{fieldErrors.custodianId}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Valor inicial</label>
          <Input
            type="number"
            value={formData.initialValue}
            onChange={handleChange('initialValue')}
            placeholder="0.00"
          />
          {fieldErrors.initialValue && <p className="mt-1 text-sm text-red-600">{fieldErrors.initialValue}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Valor actual</label>
          <Input
            type="number"
            value={formData.currentValue}
            onChange={handleChange('currentValue')}
            placeholder="0.00"
          />
          {fieldErrors.currentValue && <p className="mt-1 text-sm text-red-600">{fieldErrors.currentValue}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Nota</label>
          <textarea
            value={formData.note}
            onChange={handleChange('note')}
            placeholder="Observaciones adicionales"
            rows={3}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {fieldErrors.note && <p className="mt-1 text-sm text-red-600">{fieldErrors.note}</p>}
        </div>

        <div className="flex gap-3 mt-6">
          <Button type="button" onClick={handleCancel} disabled={!isDirty}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Crear Activo'}
          </Button>
        </div>
      </form>
    </div>
  );
}
