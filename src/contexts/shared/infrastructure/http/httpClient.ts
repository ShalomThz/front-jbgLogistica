import { ApiError } from "./errors/ApiError";
import { TOKEN_KEY } from "@contexts/iam/infrastructure/storage/tokenStorage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const httpClient = async <T>(
  endpoint: string,
  options: RequestInit = {},
  skipAuth = false,
): Promise<T> => {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (!skipAuth && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    // Evita el revalidado condicional del navegador (If-None-Match → 304).
    // El server respondía 304 en GETs (p. ej. /user/current) y, al no estar
    // 304 en el rango 2xx, `response.ok` era false y se lanzaba como error.
    // react-query ya gestiona la caché en memoria, así que no perdemos nada.
    cache: "no-store",
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
    }

    const body = await response
      .json()
      .catch(() => ({ message: "Error de servidor" }));

    throw new ApiError(
      body.code ?? null,
      body.error ?? body.message ?? `HTTP ${response.status}`,
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return (text ? text : undefined) as T;
};

export const httpClientBlob = async (
  endpoint: string,
  options: RequestInit = {},
): Promise<Blob> => {
  const token = getToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    cache: "no-store",
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => ({ message: "Error de servidor" }));

    throw new ApiError(
      body.code ?? null,
      body.error ?? body.message ?? `HTTP ${response.status}`,
      response.status,
    );
  }

  return response.blob();
};
