// Configuración base de la API
export const API_CONFIG = {
  BASE_URL: "https://api.tu-backend.com",
  HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

// Cliente HTTP genérico
export const httpClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: "GET",
      headers: API_CONFIG.HEADERS,
    });
    if (!response.ok) throw new Error(`Error GET ${endpoint}`);
    return await response.json();
  },

  post: async <T>(endpoint: string, body: any): Promise<T> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: "POST",
      headers: API_CONFIG.HEADERS,
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Error POST ${endpoint}`);
    return await response.json();
  },

  put: async <T>(endpoint: string, body: any): Promise<T> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: API_CONFIG.HEADERS,
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Error PUT ${endpoint}`);
    return await response.json();
  },

  delete: async (endpoint: string): Promise<void> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: API_CONFIG.HEADERS,
    });
    if (!response.ok) throw new Error(`Error DELETE ${endpoint}`);
  },
};
