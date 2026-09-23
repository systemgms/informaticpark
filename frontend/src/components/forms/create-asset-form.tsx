"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

const createAssetSchema = z.object({
  assetName: z.string().min(1, "Nombre requerido").max(200, "Máximo 200 caracteres"),
  code: z.string().max(50, "Máximo 50 caracteres").optional(),
  brand: z.string().max(100, "Máximo 100 caracteres").optional(),
  model: z.string().max(100, "Máximo 100 caracteres").optional(),
  serialNumber: z.string().max(100, "Máximo 100 caracteres").optional(),
  location: z.string().max(200, "Máximo 200 caracteres").optional(),
  physicalLocation: z.string().max(200, "Máximo 200 caracteres").optional(),
  accountCode: z.string().max(50, "Máximo 50 caracteres").optional(),
  note: z.string().max(500, "Máximo 500 caracteres").optional(),
  initialValue: z.number().min(0, "Valor debe ser ≥ 0").optional(),
  currentValue: z.number().min(0, "Valor debe ser ≥ 0").optional(),
  custodianId: z.number().optional(),
  locationId: z.number().optional(),
});

type CreateAssetFormValues = z.infer<typeof createAssetSchema>;

export function CreateAssetForm() {
  const [isSubmitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<CreateAssetFormValues>({
    resolver: zodResolver(createAssetSchema),
    defaultValues: {
      assetName: "",
      code: "",
      brand: "",
      model: "",
      serialNumber: "",
      location: "",
      physicalLocation: "",
      accountCode: "",
      note: "",
      initialValue: undefined,
      currentValue: undefined,
      custodianId: undefined,
      locationId: undefined,
    },
  });

  const onSubmit = async (data: CreateAssetFormValues) => {
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await api.assets.create({
        assetName: data.assetName,
        code: data.code ?? undefined,
        previousCode: undefined,
        brand: data.brand ?? undefined,
        model: data.model ?? undefined,
        serialNumber: data.serialNumber ?? undefined,
        location: data.location ?? undefined,
        physicalLocation: data.physicalLocation ?? undefined,
        accountCode: data.accountCode ?? undefined,
        note: data.note ?? undefined,
        initialValue: data.initialValue ?? undefined,
        currentValue: data.currentValue ?? undefined,
        custodianId: data.custodianId ?? undefined,
        locationId: data.locationId ?? undefined,
      });

      setSuccess(true);
      reset();
    } catch (err: any) {
      setError(err.message || "Error al crear el activo");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Crear Nuevo Activo</h2>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 border border-red-400 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded bg-green-100 border border-green-400 text-green-700">
          Activo creado exitosamente
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Nombre del activo*</label>
          <Input
            {...register("assetName", { required: "Nombre requerido" })}
            placeholder="Ej: Computadora portátil"
          />
          {errors.assetName && (
            <p className="mt-1 text-sm text-red-600">{errors.assetName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Código (opcional)</label>
          <Input
            {...register("code", { maxLength: 50 })}
            placeholder="Ej: ACT-0001"
          />
          {errors.code && (
            <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Marca</label>
            <Input {...register("brand", { maxLength: 100 })} placeholder="Ej: Dell" />
            {errors.brand && (
              <p className="mt-1 text-sm text-red-600">{errors.brand.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Modelo</label>
            <Input {...register("model", { maxLength: 100 })} placeholder="Ej: XPS 13" />
            {errors.model && (
              <p className="mt-1 text-sm text-red-600">{errors.model.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Número de serie</label>
          <Input
            {...register("serialNumber", { maxLength: 100 })}
            placeholder="Ej: CNU12345678"
          />
          {errors.serialNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.serialNumber.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Ubicación actual</label>
          <Input
            {...register("location", { maxLength: 200 })}
            placeholder="Ej: Almacén principal"
          />
          {errors.location && (
            <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Ubicación FK</label>
            <Input
              {...register("locationId", { required: "Ubicación requerida" })}
              placeholder="ID ubicación"
            />
            {errors.locationId && (
              <p className="mt-1 text-sm text-red-600">{errors.locationId.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Custodio FK</label>
            <Input
              {...register("custodianId", { required: "Custodio requerido" })}
              placeholder="ID custodio"
            />
            {errors.custodianId && (
              <p className="mt-1 text-sm text-red-600">{errors.custodianId.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Valor inicial</label>
          <Input
            type="number"
            {...register("initialValue", { required: "Valor requerido" })}
            placeholder="0.00"
          />
          {errors.initialValue && (
            <p className="mt-1 text-sm text-red-600">{errors.initialValue.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Valor actual</label>
          <Input
            type="number"
            {...register("currentValue", { required: "Valor requerido" })}
            placeholder="0.00"
          />
          {errors.currentValue && (
            <p className="mt-1 text-sm text-red-600">{errors.currentValue.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Nota</label>
          <textarea
            {...register("note", { maxLength: 500 })}
            placeholder="Observaciones adicionales"
            rows={3}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {errors.note && (
            <p className="mt-1 text-sm text-red-600">{errors.note.message}</p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button type="button" onClick={() => reset()} disabled={!isDirty}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Crear Activo"}
          </Button>
        </div>
      </form>
    </div>
  )
}