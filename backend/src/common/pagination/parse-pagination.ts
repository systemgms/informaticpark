export interface ParsePaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

export interface ParsedPagination {
  page: number;
  limit: number;
}

export function parsePagination(
  page?: string,
  limit?: string,
  options?: ParsePaginationOptions,
): ParsedPagination {
  const defaultLimit = options?.defaultLimit ?? 20;
  const maxLimit = options?.maxLimit ?? 100;

  const parsedPage = Math.max(1, parseInt(page || '1', 10) || 1);
  const parsedLimit = Math.min(
    maxLimit,
    Math.max(1, parseInt(limit || String(defaultLimit), 10) || defaultLimit),
  );

  return { page: parsedPage, limit: parsedLimit };
}
