"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Role } from "@/lib/types";

const createUserSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(100, "Máximo 100 caracteres"),
  email: z.string().email("Email inválido").max(100, "Máximo 100 caracteres"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100, "Máximo 100 caracteres"),
  role: z.enum(["ADMIN", "USER"], "Rol inválido"),
  isActive: z.boolean(),
  custodianId: z.string().optional(),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

export function UserForm({ userId }: { userId?: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!userId;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [custodians, setCustodians] = useState<{ id: number; identifier: string }[]>([]);
  const [formValues, setFormValues] = useState<CreateUserFormValues>({
    name: "",
    email: "",
    password: "",
    role: "USER",
    isActive: true,
    custodianId: "",
  });

  const {
    register,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "USER",
      isActive: true,
      custodianId: "",
    },
  });

  useEffect(() => {
    async function load() {
      try {
        const [custodiansData, userData] = await Promise.all([
          api.custodians.getAll(),
          isEdit ? api.users.getById(userId!) : Promise.resolve(null),
        ]);
        setCustodians(custodiansData.data.map((c) => ({
          id: c.id,
          identifier: c.identifier,
        })));
        if (userData) {
          setFormValues({
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

  async function handleSubmitFn(e: React.FormEvent) {
    e.preventDefault();

    // Usar validación del schema a través de react-hook-form
    if (!formValues.name.trim()) {
      toast("El nombre es requerido", "error");
      return;
    }
    if (!formValues.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
      toast("El email es requerido y debe ser válido", "error");
      return;
    }
    if (!isEdit && !formValues.password) {
      toast("La contraseña es requerida", "error");
      return;
    }
    if (formValues.password && formValues.password.length < 8) {
      toast("La contraseña debe tener al menos 8 caracteres", "error");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
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
          toast("La contraseña es requerida", "error");
          return;
        }
        await api.users.create({ ...payload, password: formValues.password });
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
          <form onSubmit={handleSubmitFn} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                {...register("name", { required: "Nombre requerido" })}
                required
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email", { required: "Email requerido" })}
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {!isEdit && (
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password", {
                    required: "Contraseña requerida",
                    minLength: {
                      value: 8,
                      message: "Mínimo 8 caracteres",
                    },
                  })}
                  required
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={formValues.role}
                onValueChange={(value: string) =>
                  setFormValues({ ...formValues, role: value as Role })
                }
              >
                <SelectTrigger id="role"><SelectValue /></SelectTrigger>
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
                  onValueChange={(value: string) =>
                    setFormValues({ ...formValues, custodianId: value })
                  }
                >
                  <SelectTrigger id="custodianId"><SelectValue placeholder="Sin custodio vinculado" /></SelectTrigger>
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
                onChange={(e) =>
                  setFormValues({ ...formValues, isActive: e.target.checked })
                }
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
  )
}