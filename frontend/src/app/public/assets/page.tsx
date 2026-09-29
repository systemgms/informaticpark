'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { PublicAsset } from '@/lib/types';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { Pagination } from '@/components/pagination';
import { ListSearchInput } from '@/components/list-search-input';
import { PublicAssetList } from './asset-list';

export default function PublicAssetsPage() {
  const fetchAssets = useCallback(
    (params: { page: number; limit: number; search: string }) => api.public.assets.getAll(params),
    [],
  );

  const {
    items: assets,
    meta,
    page,
    setPage,
    search,
    setSearch,
    isLoading,
    error,
  } = usePaginatedList<PublicAsset>({ fetchPage: fetchAssets });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Volver"
            className="flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Parque Informático</h1>
            <p className="text-sm text-muted-foreground">Gobernación Provincial de Morona Santiago</p>
            <p className="text-sm font-medium">Inventario de activos</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-6 px-4 py-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <ListSearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre, código o marca..." />
          {!isLoading && meta && (
            <span className="whitespace-nowrap text-sm text-muted-foreground">
              {meta.total} {meta.total === 1 ? 'resultado' : 'resultados'}
            </span>
          )}
        </div>

        <PublicAssetList assets={assets} isLoading={isLoading} error={error} hasSearch={search.length > 0} />

        {meta && <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />}
      </main>
    </div>
  );
}
