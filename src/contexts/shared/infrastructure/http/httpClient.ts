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

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (!skipAuth && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Error de servidor" }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
};
