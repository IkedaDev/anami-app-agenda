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
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  addAppointment: (appointment: Appointment) => Promise<void>;
  updateAppointment: (appointment: Appointment) => Promise<void>;
  refreshAppointments: () => Promise<void>;
  loadMoreAppointments: () => Promise<void>;
  cancelAppointment: (id: string) => Promise<void>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(
  undefined
);
const repository = new AppointmentRepositoryImpl();
const PAGE_SIZE = 15;

export const AppointmentProvider = ({ children }: { children: ReactNode }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState<any>(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const { appointments: newApps, lastDoc: newCurrentPage } =
        await repository.getPaginated(PAGE_SIZE);
      setAppointments(newApps);
      setCurrentPage(newCurrentPage);
      setHasMore(newApps.length === PAGE_SIZE);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudieron cargar las citas");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAppointments = async () => {
    setHasMore(true);
    await loadInitialData();
  };

  const loadMoreAppointments = async () => {
    // 1. GUARDIA ROBUSTA: Si no hay más o ya estamos cargando, detener.
    if (!hasMore || isLoadingMore || isLoading) return;

    setIsLoadingMore(true);
    try {
      const { appointments: newApps, lastDoc: nextPage } =
        await repository.getPaginated(PAGE_SIZE, currentPage);

      if (newApps.length > 0) {
        // Filtro de duplicados (el fix anterior)
        setAppointments((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const uniqueNewApps = newApps.filter((a) => !existingIds.has(a.id));
          return [...prev, ...uniqueNewApps];
        });
      }

      // 2. CORRECCIÓN RAÍZ:
      // Si nextPage es null, el backend dice "se acabó".
      if (nextPage) {
        setCurrentPage(nextPage);
        setHasMore(true);
      } else {
        setHasMore(false); // <--- Bloqueo definitivo
      }
    } catch (error) {
      console.error(error);
      // Opcional: Si falla, detenemos la paginación para evitar reintentos locos
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const addAppointment = async (appointment: Appointment) => {
    // 1. PREVENCIÓN DE DOBLE CLICK:
    // Si la cita ya está en la lista (mismo ID temporal), no hacemos nada.
    // Usamos el callback de setAppointments para tener el estado más fresco.
    let isDuplicateRequest = false;
    setAppointments((prev) => {
      if (prev.some((a) => a.id === appointment.id)) {
        isDuplicateRequest = true;
        return prev;
      }
      // Si no existe, agregamos la versión Optimista (Temporal)
      return [appointment, ...prev];
    });

    if (isDuplicateRequest) return;

    try {
      // 2. Guardamos en el servidor
      const savedAppointment = await repository.create(appointment);

      // 3. ACTUALIZACIÓN INTELIGENTE (EL FIX):
      setAppointments((prev) => {
        // ¿Ya existe la versión FINAL (ID real) en la lista?
        // (Esto pasa si hubo un auto-refresh mientras esperábamos)
        const realAlreadyExists = prev.some(
          (a) => a.id === savedAppointment.id
        );

        if (realAlreadyExists) {
          // Si ya llegó la real por otro lado, solo borramos la temporal para no tener clones.
          return prev.filter((a) => a.id !== appointment.id);
        }

        // Si no existe la real, buscamos la temporal y la reemplazamos (Swap de ID)
        return prev.map((appt) =>
          appt.id === appointment.id ? savedAppointment : appt
        );
      });
    } catch (error) {
      console.error(error);
      // Rollback: Si falló, borramos la temporal
      setAppointments((prev) => prev.filter((a) => a.id !== appointment.id));
      Alert.alert("Error", "No se pudo guardar la cita en el servidor.");
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
      Alert.alert("Error", "No se pudo actualizar la cita.");
      refreshAppointments();
    }
  };

  const cancelAppointment = async (id: string) => {
    const previousList = [...appointments];
    setAppointments((prev) => prev.filter((a) => a.id !== id));

    try {
      await repository.delete(id);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo cancelar la cita en el sistema.");
      setAppointments(previousList);
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
        cancelAppointment,
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
