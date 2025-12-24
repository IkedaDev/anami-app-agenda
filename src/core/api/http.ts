import * as SecureStore from "expo-secure-store";

export const API_CONFIG = {
  // Usamos la variable de entorno o un fallback
  BASE_URL: process.env.EXPO_PUBLIC_API_URL,
  HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

let onUnauthorized: () => void = () => {};

export const setUnauthorizedCallback = (callback: () => void) => {
  onUnauthorized = callback;
};

const getHeaders = async () => {
  const token = await SecureStore.getItemAsync("auth_token");
  return {
    ...API_CONFIG.HEADERS,
    Authorization: token ? `Bearer ${token}` : "",
  };
};

const handleResponse = async (response: Response) => {
  if (response.status === 401) {
    onUnauthorized(); // Ejecuta el logout si es 401
    throw new Error("Sesión expirada");
  }
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `Error HTTP ${response.status}`);
  }
  // Si es un 204 No Content, retornar null o undefined, si no, json
  if (response.status === 204) return null;
  return await response.json();
};
export const httpClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    const headers = await getHeaders();
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: "GET",
      headers: headers as any,
    });
    return handleResponse(response);
  },

  post: async <T>(endpoint: string, body: any): Promise<T> => {
    const headers = await getHeaders();
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: "POST",
      headers: headers as any,
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  patch: async <T>(endpoint: string, body: any): Promise<T> => {
    const headers = await getHeaders();
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: "PATCH",
      headers: headers as any,
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  delete: async (endpoint: string): Promise<void> => {
    const headers = await getHeaders();
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: headers as any,
    });
    return handleResponse(response) as any;
  },
};
