import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ServiceRepositoryImpl } from "../../data/repositories/ServiceRepositoryImpl";
import { Service } from "../../domain/repositories";
import { Alert } from "react-native";

interface ServiceContextType {
  services: Service[];
  isLoading: boolean;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

// Instanciamos el repositorio
const repository = new ServiceRepositoryImpl();

export const ServiceProvider = ({ children }: { children: ReactNode }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const data = await repository.getAllActive();
      setServices(data);
    } catch (error) {
      console.error("Error cargando servicios:", error);
      Alert.alert(
        "Error",
        "No se pudo cargar el catálogo de servicios desde el servidor."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ServiceContext.Provider
      value={{
        services,
        isLoading,
      }}
    >
      {children}
    </ServiceContext.Provider>
  );
};

export const useServices = () => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error("useServices must be used within a ServiceProvider");
  }
  return context;
};
