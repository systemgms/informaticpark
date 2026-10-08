'use client';

import { useCallback } from 'react';
import { BackButton } from '@/components/back-button';
import { GovHeader } from '@/components/gov-header';
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
    <div className="gov-theme min-h-screen bg-background">
      <GovHeader />

      <div className="container mx-auto flex items-center gap-3 px-4 pt-6">
        <BackButton href="/" variant="ghost" />
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">Parque Informático</h1>
          <p className="text-sm font-medium text-muted-foreground">Inventario de activos</p>
        </div>
      </div>

      <div className="container mx-auto space-y-6 px-4 py-8">
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
      </div>
    </div>
  );
}
