import { ApiError } from "./errors/ApiError";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const getToken = (): string | null => {
  return localStorage.getItem("auth_token");
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
