"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useBrand } from "@/components/brand-provider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, Save, Upload, ImageIcon, Fingerprint } from "lucide-react";

export default function BrandAdminPage() {
  const { brand, refresh } = useBrand();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<{ logo: boolean; favicon: boolean }>({
    logo: false,
    favicon: false,
  });
  const [formData, setFormData] = useState({
    appName: "",
    primaryColor: "#4f46e5",
    secondaryColor: "#6366f1",
    accentColor: "#e0e7ff",
    logoUrl: "",
    faviconUrl: "",
  });

  useEffect(() => {
    if (brand) {
      setFormData({
        appName: brand.appName,
        primaryColor: brand.primaryColor,
        secondaryColor: brand.secondaryColor,
        accentColor: brand.accentColor,
        logoUrl: brand.logoUrl ?? "",
        faviconUrl: brand.faviconUrl ?? "",
      });
    }
  }, [brand]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.brandSettings.update({
        appName: formData.appName,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        accentColor: formData.accentColor,
        logoUrl: formData.logoUrl || undefined,
        faviconUrl: formData.faviconUrl || undefined,
      });
      await refresh();
      toast("Marca actualizada correctamente", "success");
    } catch (error: any) {
      toast(error?.message || "Error al actualizar la marca", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "favicon"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading((prev) => ({ ...prev, [type]: true }));
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("type", type);
      const result = await api.brandSettings.uploadFile(formDataUpload);
      setFormData((prev) => ({ ...prev, [`${type}Url`]: result.url }));
      toast(`${type === "logo" ? "Logo" : "Favicon"} subido correctamente`, "success");
    } catch (error: any) {
      toast(error?.message || "Error al subir el archivo", "error");
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  }

  if (!brand) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Palette className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Personalizar marca</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Cambia colores, nombre, logo y favicon del sistema.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Identidad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="appName">Nombre de la aplicación</Label>
              <Input
                id="appName"
                value={formData.appName}
                onChange={(e) =>
                  setFormData({ ...formData, appName: e.target.value })
                }
                placeholder="Parque Informático"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="logoUrl">Logo (URL)</Label>
                <div className="flex gap-2">
                  <Input
                    id="logoUrl"
                    value={formData.logoUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, logoUrl: e.target.value })
                    }
                    placeholder="https://..."
                    className="flex-1"
                  />
                  <Label
                    htmlFor="logoFile"
                    className="cursor-pointer inline-flex items-center justify-center px-3 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors shrink-0"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading.logo ? "Subiendo..." : "Subir"}
                  </Label>
                  <Input
                    id="logoFile"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/x-icon,image/vnd.microsoft.icon,image/svg+xml,image/webp"
                    onChange={(e) => handleFileUpload(e, "logo")}
                    className="hidden"
                    disabled={uploading.logo}
                  />
                </div>
                {formData.logoUrl && (
                  <img
                    src={formData.logoUrl}
                    alt="Logo preview"
                    className="mt-2 h-16 w-auto object-contain border rounded-md p-2"
                  />
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="faviconUrl">Favicon (URL)</Label>
                <div className="flex gap-2">
                  <Input
                    id="faviconUrl"
                    value={formData.faviconUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, faviconUrl: e.target.value })
                    }
                    placeholder="https://..."
                    className="flex-1"
                  />
                  <Label
                    htmlFor="faviconFile"
                    className="cursor-pointer inline-flex items-center justify-center px-3 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors shrink-0"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading.favicon ? "Subiendo..." : "Subir"}
                  </Label>
                  <Input
                    id="faviconFile"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/x-icon,image/vnd.microsoft.icon,image/svg+xml,image/webp"
                    onChange={(e) => handleFileUpload(e, "favicon")}
                    className="hidden"
                    disabled={uploading.favicon}
                  />
                </div>
                {formData.faviconUrl && (
                  <img
                    src={formData.faviconUrl}
                    alt="Favicon preview"
                    className="mt-2 h-8 w-8 object-contain border rounded-md p-1"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Colores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="primaryColor">Color primario</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) =>
                      setFormData({ ...formData, primaryColor: e.target.value })
                    }
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) =>
                      setFormData({ ...formData, primaryColor: e.target.value })
                    }
                    placeholder="#4f46e5"
                    className="flex-1 font-mono"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="secondaryColor">Color secundario</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) =>
                      setFormData({ ...formData, secondaryColor: e.target.value })
                    }
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formData.secondaryColor}
                    onChange={(e) =>
                      setFormData({ ...formData, secondaryColor: e.target.value })
                    }
                    placeholder="#6366f1"
                    className="flex-1 font-mono"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="accentColor">Color de acento</Label>
                <div className="flex gap-2">
                  <Input
                    id="accentColor"
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) =>
                      setFormData({ ...formData, accentColor: e.target.value })
                    }
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formData.accentColor}
                    onChange={(e) =>
                      setFormData({ ...formData, accentColor: e.target.value })
                    }
                    placeholder="#e0e7ff"
                    className="flex-1 font-mono"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vista previa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Logo"
                    className="h-12 w-auto object-contain"
                  />
                ) : (
                  <ImageIcon className="w-10 h-10 text-muted-foreground" />
                )}
                <div>
                  <h2 className="text-xl font-bold" style={{ color: formData.primaryColor }}>
                    {formData.appName || "Parque Informático"}
                  </h2>
                  <p className="text-sm text-muted-foreground">Panel administrativo</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  style={{ backgroundColor: formData.primaryColor }}
                  className="text-white"
                >
                  Botón primario
                </Button>
                <Button
                  type="button"
                  style={{ backgroundColor: formData.secondaryColor }}
                  className="text-white"
                >
                  Botón secundario
                </Button>
                <span
                  className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium"
                  style={{
                    backgroundColor: formData.accentColor,
                    color: formData.primaryColor,
                  }}
                >
                  <Fingerprint className="w-4 h-4 mr-2" />
                  Acento
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </form>
    </div>
  );
}
