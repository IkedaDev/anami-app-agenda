import * as SecureStore from "expo-secure-store";

export const API_CONFIG = {
  // Usamos la variable de entorno o un fallback
  BASE_URL:
    process.env.EXPO_PUBLIC_API_URL || "https://api.ikedadev.com/anami/v1",
  HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

const getHeaders = async () => {
  const token = await SecureStore.getItemAsync("auth_token");
  return {
    ...API_CONFIG.HEADERS,
    Authorization: token ? `Bearer ${token}` : "",
  };
};

export const httpClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    const headers = await getHeaders();
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: "GET",
      headers: headers as any,
    });
    if (!response.ok)
      throw new Error(`Error GET ${endpoint} - ${response.status}`);
    return await response.json();
  },

  post: async <T>(endpoint: string, body: any): Promise<T> => {
    const headers = await getHeaders();
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: "POST",
      headers: headers as any,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.message || `Error POST ${endpoint}`);
    }
    return await response.json();
  },

  patch: async <T>(endpoint: string, body: any): Promise<T> => {
    const headers = await getHeaders();
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: "PATCH",
      headers: headers as any,
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Error PATCH ${endpoint}`);
    return await response.json();
  },

  delete: async (endpoint: string): Promise<void> => {
    const headers = await getHeaders();
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: headers as any,
    });
    if (!response.ok) throw new Error(`Error DELETE ${endpoint}`);
  },
};
