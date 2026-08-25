"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { LayoutDashboard, LogIn, Info } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api.auth.login({ email, password });
      login(response.accessToken, response.user);
    } catch (err: any) {
      setError(err.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="p-3 rounded-xl bg-primary/10">
            <LayoutDashboard className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Parque Informático</h1>
          <p className="text-sm text-muted-foreground">GPMS — Morona Santiago</p>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <p className="text-sm text-muted-foreground text-center">
              Ingresa tus credenciales para acceder al panel
            </p>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@infopark.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full cursor-pointer" type="submit" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Iniciando sesión...
                  </span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Ingresar
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <p>¿Olvidaste tu contraseña? Contacta al administrador.</p>
        </div>
      </div>
    </div>
  );
}
