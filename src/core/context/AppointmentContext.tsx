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
    if (!hasMore || isLoadingMore || isLoading) return;

    setIsLoadingMore(true);
    try {
      const { appointments: newApps, lastDoc: newCurrentPage } =
        await repository.getPaginated(PAGE_SIZE, currentPage);

      if (newApps.length > 0) {
        setAppointments((prev) => [...prev, ...newApps]);
        setCurrentPage(newCurrentPage);
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
    // 1. Optimistic Update: La mostramos inmediatamente con el ID temporal
    setAppointments((prev) => [appointment, ...prev]);

    try {
      // 2. Enviamos al backend y ESPERAMOS la respuesta (que trae el ID real)
      const savedAppointment = await repository.create(appointment);

      // 3. Reemplazamos silenciosamente la cita temporal por la real
      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === appointment.id ? savedAppointment : appt
        )
      );
    } catch (error) {
      console.error(error);
      // Si falla, quitamos la cita de la lista (Rollback)
      setAppointments((prev) => prev.filter((a) => a.id !== appointment.id));
      Alert.alert("Error", "No se pudo guardar la cita en el servidor.");
    }
  };

  const updateAppointment = async (updatedAppointment: Appointment) => {
    // Optimistic Update
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
      // Aquí podrías recargar la lista para deshacer el cambio visual
      refreshAppointments();
    }
  };
  const cancelAppointment = async (id: string) => {
    // 1. Optimistic Update: La quitamos de la lista inmediatamente
    const previousList = [...appointments];
    setAppointments((prev) => prev.filter((a) => a.id !== id));

    try {
      // 2. Llamada al Backend (DELETE)
      await repository.delete(id);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo cancelar la cita en el sistema.");
      // Rollback si falla
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
