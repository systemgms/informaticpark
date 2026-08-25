"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Building2, Package, MapPin, DollarSign, AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { Asset, AssetMovement } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth-provider";

interface AdminStats {
  users: number;
  custodians: number;
  assets: number;
  locations: number;
  totalValue: number;
  sinCustodio: number;
  sinUbicacion: number;
}

interface CustodianStats {
  assets: number;
  totalValue: number;
}

function StatCard({
  href,
  icon: Icon,
  color,
  label,
  value,
  sub,
  loading,
}: {
  href?: string;
  icon: React.ElementType;
  color: string;
  label: string;
  value: string | number;
  sub?: string;
  loading: boolean;
}) {
  const content = (
    <Card className={href ? "hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full" : "h-full"}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="h-9 w-24 mt-1" />
            ) : (
              <p className="text-4xl font-bold mt-1 tabular-nums">{value}</p>
            )}
            {sub && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{sub}</p>}
          </div>
          <div className={`p-3 rounded-xl shrink-0 ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href} className="group">{content}</Link> : content;
}

function AlertCard({ label, value }: { label: string; value: number }) {
  if (value === 0) return null;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm">
      <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" />
      <span className="text-yellow-800">
        <span className="font-semibold">{value}</span> {label}
      </span>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [custodianStats, setCustodianStats] = useState<CustodianStats | null>(null);
  const [pendingMovements, setPendingMovements] = useState<AssetMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        if (isAdmin) {
          const [users, custodians, assets, locations] = await Promise.all([
            api.users.getAll(),
            api.custodians.getAll(),
            api.assets.getAll(),
            api.locations.getAll(),
          ]);
          const assetList: Asset[] = assets.data || [];
          const totalValue = assetList.reduce((sum, a) => sum + (Number(a.currentValue) || 0), 0);
          setAdminStats({
            users: users.data?.length || 0,
            custodians: custodians.data?.length || 0,
            assets: assetList.length,
            locations: locations.data?.length || 0,
            totalValue,
            sinCustodio: assetList.filter((a) => !a.custodianId).length,
            sinUbicacion: assetList.filter((a) => !a.locationId).length,
          });
        } else {
          const [assets, pending] = await Promise.all([
            api.assets.getAll(),
            api.movements.getPendingForMe(),
          ]);
          const assetList: Asset[] = assets.data || [];
          const propios = assetList.filter((a) => a.custodianId === user?.custodianId);
          setCustodianStats({
            assets: propios.length,
            totalValue: propios.reduce((sum, a) => sum + (Number(a.currentValue) || 0), 0),
          });
          setPendingMovements(pending || []);
        }
      } catch {
        if (isAdmin) setAdminStats({ users: 0, custodians: 0, assets: 0, locations: 0, totalValue: 0, sinCustodio: 0, sinUbicacion: 0 });
        else setCustodianStats({ assets: 0, totalValue: 0 });
      } finally {
        setLoading(false);
      }
    }
    if (user !== null) loadStats();
  }, [user, isAdmin]);

  const fmt = (n: number) =>
    n.toLocaleString("es-EC", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isAdmin ? "Panel de Administración" : "Mis Activos"}
        </h1>
        <p className="text-muted-foreground mt-1">Parque Informático — GPMS Morona Santiago</p>
      </div>

      {isAdmin ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              href="/admin/assets"
              icon={Package}
              color="text-indigo-600 bg-indigo-50"
              label="Activos"
              value={adminStats?.assets ?? 0}
              sub="Total de bienes registrados"
              loading={loading}
            />
            <StatCard
              icon={DollarSign}
              color="text-emerald-600 bg-emerald-50"
              label="Valor total del parque"
              value={loading ? "—" : fmt(adminStats?.totalValue ?? 0)}
              sub="Suma del valor actual de todos los activos"
              loading={loading}
            />
            <StatCard
              href="/admin/custodians"
              icon={Building2}
              color="text-violet-600 bg-violet-50"
              label="Custodios"
              value={adminStats?.custodians ?? 0}
              sub="Responsables de activos registrados"
              loading={loading}
            />
            <StatCard
              href="/admin/users"
              icon={Users}
              color="text-blue-600 bg-blue-50"
              label="Usuarios"
              value={adminStats?.users ?? 0}
              sub="Cuentas de acceso al sistema"
              loading={loading}
            />
            <StatCard
              href="/admin/locations"
              icon={MapPin}
              color="text-orange-600 bg-orange-50"
              label="Ubicaciones"
              value={adminStats?.locations ?? 0}
              sub="Cantones y parroquias registradas"
              loading={loading}
            />
          </div>

          {!loading && adminStats && (
            <div className="flex flex-col gap-2">
              <AlertCard
                label="activos sin custodio asignado"
                value={adminStats.sinCustodio}
              />
              <AlertCard
                label="activos sin ubicación asignada"
                value={adminStats.sinUbicacion}
              />
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
            <StatCard
              href="/admin/assets"
              icon={Package}
              color="text-indigo-600 bg-indigo-50"
              label="Mis activos"
              value={custodianStats?.assets ?? 0}
              sub="Bienes bajo tu custodia"
              loading={loading}
            />
            <StatCard
              icon={DollarSign}
              color="text-emerald-600 bg-emerald-50"
              label="Valor total"
              value={loading ? "—" : fmt(custodianStats?.totalValue ?? 0)}
              sub="Valor actual de tus activos"
              loading={loading}
            />
          </div>

          {!loading && pendingMovements.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-yellow-700">
                <Clock className="w-4 h-4" />
                <span className="font-semibold text-sm">
                  {pendingMovements.length} traspaso{pendingMovements.length > 1 ? "s" : ""} pendiente{pendingMovements.length > 1 ? "s" : ""} de confirmar
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {pendingMovements.map((m) => (
                  <Link
                    key={m.id}
                    href={`/admin/assets/${m.assetId}/historial`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 hover:bg-yellow-100 transition-colors"
                  >
                    <div className="text-sm">
                      <span className="font-medium text-yellow-900">
                        {m.asset?.assetName ?? `Activo #${m.assetId}`}
                      </span>
                      {m.asset?.code && (
                        <span className="text-yellow-700 ml-2 font-mono text-xs">{m.asset.code}</span>
                      )}
                      <p className="text-yellow-700 text-xs mt-0.5">
                        Enviado por: {m.registeredBy?.name ?? "—"}
                      </p>
                    </div>
                    <span className="text-xs text-yellow-700 shrink-0 inline-flex items-center gap-1">
                      Ver traspaso <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
