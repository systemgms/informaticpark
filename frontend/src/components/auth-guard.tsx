'use client';

import { useAuth } from '@/components/auth-provider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { isPublicPath } from '@/lib/public-path';

const ADMIN_ONLY_PATHS = ['/admin/users', '/admin/custodians', '/admin/locations', '/admin/brand'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isCurrentPathPublic = isPublicPath(pathname);
  const isAdminOnlyPath = ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (isLoading) return;
    if (!user && !isCurrentPathPublic) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'ADMIN' && isAdminOnlyPath) {
      router.push('/admin/assets');
    }
  }, [user, isLoading, router, isCurrentPathPublic, isAdminOnlyPath]);

  if (isCurrentPathPublic) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
