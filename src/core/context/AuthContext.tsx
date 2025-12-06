import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import { httpClient } from "../api/http";

interface AuthContextType {
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay sesión guardada al abrir la app
    const checkSession = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("auth_token");
        if (storedToken) setToken(storedToken);
      } catch (e) {
        console.error("Error recuperando sesión", e);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      // Llamada al endpoint de login que creamos en el backend
      const response = await httpClient.post<{
        success: boolean;
        data: { token: string };
      }>("/auth/login", {
        email,
        password: pass,
      });

      if (response.success && response.data.token) {
        const newToken = response.data.token;
        setToken(newToken);
        await SecureStore.setItemAsync("auth_token", newToken);
      }
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setToken(null);
    await SecureStore.deleteItemAsync("auth_token");
  };

  return (
    <AuthContext.Provider value={{ token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
