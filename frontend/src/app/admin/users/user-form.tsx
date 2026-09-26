'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useCustodianOptions } from '@/hooks/use-custodian-options';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Role } from '@/lib/types';

interface UserFormValues {
  name: string;
  email: string;
  password: string;
  role: Role;
  isActive: boolean;
  custodianId: string;
}

interface UserUpdatePayload {
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  custodianId: number | null;
  password?: string;
}

interface UserFormProps {
  userId?: number;
}

const INITIAL_FORM_VALUES: UserFormValues = {
  name: '',
  email: '',
  password: '',
  role: Role.USER,
  isActive: true,
  custodianId: '',
};

export function UserForm({ userId }: UserFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!userId;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { custodians } = useCustodianOptions();
  const [formValues, setFormValues] = useState<UserFormValues>(INITIAL_FORM_VALUES);

  useEffect(() => {
    async function load() {
      try {
        const userData = isEdit ? await api.users.getById(userId!) : null;
        if (userData) {
          setFormValues({
            name: userData.name,
            email: userData.email,
            password: '',
            role: userData.role,
            isActive: userData.isActive,
            custodianId: userData.custodianId ? String(userData.custodianId) : '',
          });
        }
      } catch (error: unknown) {
        toast(error instanceof Error ? error.message : 'Error al cargar el usuario', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [userId, isEdit, toast]);

  async function handleSubmitFn(e: React.FormEvent) {
    e.preventDefault();

    if (!formValues.name.trim()) {
      toast('El nombre es requerido', 'error');
      return;
    }
    if (!formValues.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
      toast('El email es requerido y debe ser válido', 'error');
      return;
    }
    if (!isEdit && !formValues.password) {
      toast('La contraseña es requerida', 'error');
      return;
    }
    if (formValues.password && formValues.password.length < 8) {
      toast('La contraseña debe tener al menos 8 caracteres', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload: UserUpdatePayload = {
        name: formValues.name,
        email: formValues.email,
        role: formValues.role,
        isActive: formValues.isActive,
        custodianId: formValues.custodianId ? Number(formValues.custodianId) : null,
      };
      if (formValues.password) payload.password = formValues.password;

      if (isEdit) {
        await api.users.update(userId!, payload);
      } else {
        if (!formValues.password) {
          toast('La contraseña es requerida', 'error');
          return;
        }
        await api.users.create({ ...payload, password: formValues.password });
      }
      router.push('/admin/users');
      router.refresh();
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : 'Error al guardar usuario', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitFn} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                value={formValues.name}
                onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formValues.email}
                onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                required
              />
            </div>

            {!isEdit && (
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={formValues.password}
                  onChange={(e) => setFormValues({ ...formValues, password: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={formValues.role}
                onValueChange={(value: string) => setFormValues({ ...formValues, role: value as Role })}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Role.USER}>Usuario (Custodio)</SelectItem>
                  <SelectItem value={Role.ADMIN}>Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formValues.role === Role.USER && (
              <div className="grid gap-2">
                <Label htmlFor="custodianId">Custodio vinculado</Label>
                <Select
                  value={formValues.custodianId}
                  onValueChange={(value: string) => setFormValues({ ...formValues, custodianId: value })}
                >
                  <SelectTrigger id="custodianId">
                    <SelectValue placeholder="Sin custodio vinculado" />
                  </SelectTrigger>
                  <SelectContent>
                    {custodians.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.identifier}
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
                checked={formValues.isActive}
                onChange={(e) => setFormValues({ ...formValues, isActive: e.target.checked })}
              />
              <Label htmlFor="isActive">Usuario Activo</Label>
            </div>

            <Button type="submit" className="w-full" disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar Usuario'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
