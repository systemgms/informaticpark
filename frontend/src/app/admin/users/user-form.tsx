"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Custodian, Role } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserFormProps {
  userId?: number;
}

export function UserForm({ userId }: UserFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!userId;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [custodians, setCustodians] = useState<Custodian[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: Role.USER,
    isActive: true,
    custodianId: "" as string,
  });

  useEffect(() => {
    async function load() {
      try {
        const [custodiansData, userData] = await Promise.all([
          api.custodians.getAll(),
          isEdit ? api.users.getById(userId!) : Promise.resolve(null),
        ]);
        setCustodians(custodiansData.data);
        if (userData) {
          setFormData({
            name: userData.name,
            email: userData.email,
            password: "",
            role: userData.role,
            isActive: userData.isActive,
            custodianId: userData.custodianId ? String(userData.custodianId) : "",
          });
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId, isEdit]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      toast("El nombre es requerido", "error");
      return;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast("El email es requerido y debe ser válido", "error");
      return;
    }
    if (!isEdit && !formData.password) {
      toast("La contraseña es requerida", "error");
      return;
    }
    if (formData.password && formData.password.length < 8) {
      toast("La contraseña debe tener al menos 8 caracteres", "error");
      return;
    }
    
    setSaving(true);
    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
        custodianId: formData.custodianId ? Number(formData.custodianId) : null,
      };
      if (formData.password) payload.password = formData.password;

      if (isEdit) {
        await api.users.update(userId!, payload);
      } else {
        if (!formData.password) { toast("La contraseña es requerida", "error"); return; }
        await api.users.create({ ...payload, password: formData.password });
      }
      router.push("/admin/users");
      router.refresh();
    } catch (error: any) {
      toast(error?.message || "Error al guardar usuario", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">
          {isEdit ? "Editar Usuario" : "Nuevo Usuario"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            {!isEdit && (
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            )}
              <div className="grid gap-2">
                <Label htmlFor="role">Rol</Label>
                <Select value={formData.role} onValueChange={(value) =>
                  setFormData({ ...formData, role: value as Role, custodianId: "" })
                }>
                  <SelectTrigger id="role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Role.USER}>Usuario (Custodio)</SelectItem>
                    <SelectItem value={Role.ADMIN}>Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            {formData.role === Role.USER && (
              <div className="grid gap-2">
                <Label htmlFor="custodianId">Custodio vinculado</Label>
                <Select value={formData.custodianId} onValueChange={(value) => setFormData({ ...formData, custodianId: value })}>
                  <SelectTrigger id="custodianId"><SelectValue placeholder="Sin custodio vinculado" /></SelectTrigger>
                  <SelectContent>
                  {custodians.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.fullName} — {c.identifier}
                      {c.unit ? ` (${c.unit})` : ""}
                    </SelectItem>
                  ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Vincula este usuario a un custodio para que pueda registrar traspasos de sus activos.
                </p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <Label htmlFor="isActive">Usuario Activo</Label>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Guardando..." : "Guardar Usuario"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
