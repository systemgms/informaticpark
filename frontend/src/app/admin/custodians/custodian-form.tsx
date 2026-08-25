"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

interface CustodianFormProps {
  custodianId?: number;
}

export function CustodianForm({ custodianId }: CustodianFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!custodianId;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    identifier: "",
    unit: "",
  });

  const loadCustodian = useCallback(async () => {
    try {
      const custodian = await api.custodians.getById(custodianId!);
      setFormData({
        fullName: custodian.fullName,
        identifier: custodian.identifier,
        unit: custodian.unit || "",
      });
    } catch (error) {
      console.error("Error loading custodian:", error);
    } finally {
      setLoading(false);
    }
  }, [custodianId]);

  useEffect(() => {
    if (isEdit) {
      loadCustodian();
    }
  }, [custodianId, isEdit, loadCustodian]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Basic validation
    if (!formData.fullName.trim()) {
      toast("El nombre completo es requerido", "error");
      return;
    }
    if (!formData.identifier.trim()) {
      toast("El identificador es requerido", "error");
      return;
    }
    
    setSaving(true);
    try {
      if (isEdit) {
        await api.custodians.update(custodianId!, formData);
      } else {
        await api.custodians.create(formData);
      }
      router.push("/admin/custodians");
      router.refresh();
    } catch (error: any) {
      toast(error?.message || "Error al guardar custodio", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/custodians">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">
          {isEdit ? "Editar Custodio" : "Nuevo Custodio"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Custodio</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Nombre Completo</Label>
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
            <Button type="submit" className="w-full" disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Guardando..." : "Guardar Custodio"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
