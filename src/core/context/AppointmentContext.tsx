import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Appointment } from "../../domain/models/appointment";
import { AppointmentRepositoryImpl } from "../../data/repositories/AppointmentRepositoryImpl";
import { Alert } from "react-native";

interface AppointmentContextType {
  appointments: Appointment[];
  isLoading: boolean; // Carga inicial
  isLoadingMore: boolean; // Carga de paginación
  hasMore: boolean; // Si quedan más datos por cargar
  addAppointment: (appointment: Appointment) => Promise<void>;
  updateAppointment: (appointment: Appointment) => Promise<void>;
  refreshAppointments: () => Promise<void>; // Recargar desde cero
  loadMoreAppointments: () => Promise<void>; // Cargar siguiente página
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(
  undefined
);
const repository = new AppointmentRepositoryImpl();
const PAGE_SIZE = 15; // Cantidad de items por página

export const AppointmentProvider = ({ children }: { children: ReactNode }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null); // Cursor de Firestore
  const [hasMore, setHasMore] = useState(true);

  // Carga inicial al montar
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const { appointments: newApps, lastDoc: newLastDoc } =
        await repository.getPaginated(PAGE_SIZE);
      setAppointments(newApps);
      setLastDoc(newLastDoc);
      setHasMore(newApps.length === PAGE_SIZE); // Si trajimos menos que el límite, no hay más
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudieron cargar las citas");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAppointments = async () => {
    // Reinicia la lista y carga la primera página
    setHasMore(true);
    await loadInitialData();
  };

  const loadMoreAppointments = async () => {
    if (!hasMore || isLoadingMore || isLoading) return;

    setIsLoadingMore(true);
    try {
      const { appointments: newApps, lastDoc: newLastDoc } =
        await repository.getPaginated(PAGE_SIZE, lastDoc);

      if (newApps.length > 0) {
        setAppointments((prev) => [...prev, ...newApps]); // Concatenamos
        setLastDoc(newLastDoc);
        if (newApps.length < PAGE_SIZE) setHasMore(false);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const addAppointment = async (appointment: Appointment) => {
    // Optimistic update: Agregamos visualmente primero
    setAppointments((prev) => [appointment, ...prev]);
    try {
      await repository.create(appointment);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo guardar en la nube, pero está local.");
    }
  };

  const updateAppointment = async (updatedAppointment: Appointment) => {
    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === updatedAppointment.id ? updatedAppointment : appt
      )
    );
    try {
      await repository.update(updatedAppointment);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        isLoading,
        isLoadingMore,
        hasMore,
        addAppointment,
        updateAppointment,
        refreshAppointments,
        loadMoreAppointments,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
};

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (!context)
    throw new Error(
      "useAppointments must be used within an AppointmentProvider"
    );
  return context;
};
