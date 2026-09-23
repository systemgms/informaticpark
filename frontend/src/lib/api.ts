import { User, Custodian, Location, Asset, AssetMovement } from "./types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
const API_URL = `${BACKEND_URL}/api`;

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  let token = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("token");
  }

  // Ensure endpoint doesn't double slash or miss slash
  const url = `${API_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let response: Response;
  try {
    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
    if (isHttps && BACKEND_URL.startsWith("http://")) {
      throw new Error(`Conexión bloqueada por contenido mixto: frontend en HTTPS y backend en HTTP`);
    }
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
      mode: "cors",
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeout);
    const msg = err?.message || "";
    if (msg.includes("Failed to fetch") || err?.name === "AbortError" || msg.includes("NetworkError")) {
      throw new Error(
        `No se pudo conectar con el servidor. Verifica que el servidor esté encendido.`
      );
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    if (
      response.status === 401 &&
      typeof window !== "undefined" &&
      !url.includes("/auth/login") &&
      !window.location.pathname.startsWith("/public")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    const error = (await response
      .json()
      .catch(() => ({ message: "Ocurrió un error" }))) as { message?: string };
    throw new Error(error.message || `Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}


async function fetcherMultipart<T>(endpoint: string, body: FormData, method = 'POST'): Promise<T> {
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token');
  }
  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body,
      mode: 'cors',
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeout);
    const msg = err?.message || "";
    if (err?.name === "AbortError") {
      throw new Error("La solicitud tardó demasiado. Intenta de nuevo.");
    }
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
      throw new Error("No se pudo conectar con el servidor. Verifica que el servidor esté encendido.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    if (
      response.status === 401 &&
      typeof window !== 'undefined' &&
      !url.includes('/auth/login') &&
      !window.location.pathname.startsWith('/public')
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    const error = (await response
      .json()
      .catch(() => ({ message: 'Ocurrió un error' }))) as { message?: string };
    throw new Error(error.message || `Error ${response.status}`);
  }
  return response.json();
}

export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      fetcher<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
    me: () => fetcher<User>("/auth/me"),
  },
  users: {
    getAll: () => fetcher<PaginatedResponse<User>>("/users"),
    getById: (id: number) => fetcher<User>(`/users/${id}`),
    create: (data: { name: string; email: string; password: string; role?: string; custodianId?: number | null }) =>
      fetcher<User>("/users", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: { name?: string; email?: string; password?: string; role?: string; custodianId?: number | null }) =>
      fetcher<User>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => fetcher<void>(`/users/${id}`, { method: "DELETE" }),
  },
  custodians: {
    getAll: () => fetcher<PaginatedResponse<Custodian>>("/custodians"),
    getById: (id: number) => fetcher<Custodian>(`/custodians/${id}`),
    create: (data: { fullName: string; identifier: string; unit?: string; locationId?: number }) =>
      fetcher<Custodian>("/custodians", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: { fullName?: string; identifier?: string; unit?: string; locationId?: number | null }) =>
      fetcher<Custodian>(`/custodians/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => fetcher<void>(`/custodians/${id}`, { method: "DELETE" }),
  },
  locations: {
    getAll: () => fetcher<PaginatedResponse<Location>>("/locations"),
    getById: (id: number) => fetcher<Location>(`/locations/${id}`),
    create: (data: { canton?: string; parroquia?: string; lat?: number; lng?: number }) =>
      fetcher<Location>("/locations", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: { canton?: string; parroquia?: string; lat?: number; lng?: number }) =>
      fetcher<Location>(`/locations/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => fetcher<void>(`/locations/${id}`, { method: "DELETE" }),
  },
  assets: {
    getAll: () => fetcher<PaginatedResponse<Asset>>("/assets"),
    getById: (id: number) => fetcher<Asset>(`/assets/${id}`),
    create: (data: {
      code?: string | null;
      previousCode?: string | null;
      assetName: string;
      brand?: string | null;
      model?: string | null;
      serialNumber?: string | null;
      location?: string | null;
      physicalLocation?: string | null;
      accountCode?: string | null;
      note?: string | null;
      custodianId?: number | null;
      locationId?: number | null;
      initialValue?: number | null;
      currentValue?: number | null;
    }) =>
      fetcher<Asset>("/assets", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: {
      code?: string | null;
      previousCode?: string | null;
      assetName?: string;
      brand?: string | null;
      model?: string | null;
      serialNumber?: string | null;
      location?: string | null;
      physicalLocation?: string | null;
      accountCode?: string | null;
      note?: string | null;
      custodianId?: number | null;
      locationId?: number | null;
      initialValue?: number | null;
      currentValue?: number | null;
    }) =>
      fetcher<Asset>(`/assets/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => fetcher<void>(`/assets/${id}`, { method: "DELETE" }),
  },
  movements: {
    getByAsset: (assetId: number) => fetcher<AssetMovement[]>(`/assets/${assetId}/movements`),
    getPendingForMe: () => fetcher<AssetMovement[]>(`/movements/pending`),
    create: (assetId: number, formData: FormData) =>
      fetcherMultipart<AssetMovement>(`/assets/${assetId}/movements`, formData),
    confirm: (assetId: number, movementId: number, formData: FormData) =>
      fetcherMultipart<AssetMovement>(`/assets/${assetId}/movements/${movementId}/confirm`, formData, 'PATCH'),
    reject: (assetId: number, movementId: number) =>
      fetcher<AssetMovement>(`/assets/${assetId}/movements/${movementId}/reject`, { method: "PATCH" }),
    createBulk: (formData: FormData) =>
      fetcherMultipart<AssetMovement[]>('/movements/bulk', formData),
    confirmBulk: (groupId: string, formData: FormData) =>
      fetcherMultipart<AssetMovement[]>(`/movements/bulk/${groupId}/confirm`, formData, 'PATCH'),
    rejectBulk: (groupId: string) =>
      fetcher<AssetMovement[]>(`/movements/bulk/${groupId}/reject`, { method: "PATCH" }),
  },
};

