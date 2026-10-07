export interface ApplyGuardInput {
  databaseUrl: string | undefined;
  shouldApply: boolean;
  isRemoteAllowed: boolean;
  confirmRemoteEnv: string | undefined;
}

export interface ApplyGuardResult {
  isAllowed: boolean;
  /** Host only. Never includes credentials. */
  host: string;
  reason: string | null;
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function extractHost(databaseUrl: string | undefined): string | null {
  if (!databaseUrl) return null;
  try {
    return new URL(databaseUrl).hostname.replace(/^\[|\]$/g, '');
  } catch {
    return null;
  }
}

/** Decides whether the import may write to the target database. */
export function evaluateApplyGuard(input: ApplyGuardInput): ApplyGuardResult {
  const host = extractHost(input.databaseUrl);
  const displayHost = host ?? '(desconocido)';

  if (!input.shouldApply) {
    return { isAllowed: true, host: displayHost, reason: null };
  }
  if (host === null) {
    return {
      isAllowed: false,
      host: displayHost,
      reason: 'DATABASE_URL ausente o invalida',
    };
  }
  if (LOCAL_HOSTS.has(host)) {
    return { isAllowed: true, host, reason: null };
  }
  if (input.isRemoteAllowed && input.confirmRemoteEnv === 'yes') {
    return { isAllowed: true, host, reason: null };
  }
  return {
    isAllowed: false,
    host,
    reason:
      'Base de datos remota: --apply requiere --allow-remote y CONFIRM_REMOTE_IMPORT=yes',
  };
}
