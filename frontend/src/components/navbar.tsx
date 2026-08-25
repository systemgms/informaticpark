"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, LayoutDashboard, Clock, Package, Users, Building2, MapPin, ArrowRightLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function getTokenExpiry(): number | null {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const adminLinks = [
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/custodians", label: "Custodios", icon: Building2 },
  { href: "/admin/assets", label: "Activos", icon: Package },
  { href: "/admin/assets/traspasar", label: "Traspasar", icon: ArrowRightLeft },
  { href: "/admin/locations", label: "Ubicaciones", icon: MapPin },
];

const custodianLinks = [
  { href: "/admin/assets", label: "Activos", icon: Package },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const navLinks = user?.role === "ADMIN" ? adminLinks : custodianLinks;
  const [remaining, setRemaining] = useState<number | null>(null);
  const logoutCalledRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    const expiry = getTokenExpiry();
    if (!expiry) return;
    
    logoutCalledRef.current = false;
    
    const tick = () => {
      const secs = expiry - Math.floor(Date.now() / 1000);
      if (secs <= 0) {
        if (!logoutCalledRef.current) {
          logoutCalledRef.current = true;
          logout();
        }
      } else {
        setRemaining(secs);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [user, logout]);

  if (!user) return null;

  const isExpiringSoon = remaining !== null && remaining <= 300;

  return (
    <nav className="border-b bg-card sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-base shrink-0">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            <span className="hidden sm:block">Parque Informático</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  pathname.startsWith(href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserIcon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:block">{user.name}</span>
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">
              {user.role}
            </span>
            {remaining !== null && (
              <span className={cn(
                "hidden sm:flex items-center gap-1 font-mono text-xs",
                isExpiringSoon ? "text-destructive font-semibold" : "text-muted-foreground"
              )}>
                <Clock className="w-3 h-3" />
                {formatCountdown(remaining)}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:ml-1.5 sm:block">Salir</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
