"use client";

import { useAuth } from "@/components/auth-provider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

const ADMIN_ONLY_PATHS = ["/admin/users", "/admin/custodians", "/admin/locations", "/admin/brand"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = pathname === "/login" || pathname.startsWith("/public");
  const isAdminOnlyPath = ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublicPath) {
      router.push("/login");
      return;
    }
    if (user && user.role !== "ADMIN" && isAdminOnlyPath) {
      router.push("/admin/assets");
    }
  }, [user, loading, router, isPublicPath, isAdminOnlyPath]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isPublicPath) {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

