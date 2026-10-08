'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/back-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save } from 'lucide-react';

interface CustodianFormProps {
  custodianId?: number;
}

interface CustodianFormData {
  fullName: string;
  identifier: string;
  unit: string;
}

export function CustodianForm({ custodianId }: CustodianFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!custodianId;
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<CustodianFormData>({
    fullName: '',
    identifier: '',
    unit: '',
  });

  const loadCustodian = useCallback(async () => {
    try {
      const custodian = await api.custodians.getById(custodianId!);
      setFormData({
        fullName: custodian.fullName,
        identifier: custodian.identifier,
        unit: custodian.unit || '',
      });
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : 'Error al cargar el custodio', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [custodianId, toast]);

  useEffect(() => {
    if (isEdit) {
      loadCustodian();
    }
  }, [custodianId, isEdit, loadCustodian]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Basic validation
    if (!formData.fullName.trim()) {
      toast('El nombre completo es requerido', 'error');
      return;
    }
    if (!formData.identifier.trim()) {
      toast('El identificador es requerido', 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (isEdit) {
        await api.custodians.update(custodianId!, formData);
      } else {
        await api.custodians.create(formData);
      }
      router.push('/admin/custodians');
      router.refresh();
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : 'Error al guardar custodio', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-wrap items-center gap-4">
        <BackButton href="/admin/custodians" />
        <h1 className="tracking-tight min-w-0 break-words text-3xl font-semibold">
          {isEdit ? 'Editar custodio' : 'Nuevo custodio'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del custodio</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="identifier">Identificador (DNI/ID)</Label>
              <Input
                id="identifier"
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit">Unidad/Departamento</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar custodio'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
