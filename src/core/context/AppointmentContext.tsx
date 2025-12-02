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
  addAppointment: (appointment: Appointment) => Promise<void>;
  updateAppointment: (appointment: Appointment) => Promise<void>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(
  undefined
);

// Instanciamos el repositorio (Inyección de dependencias simple)
const repository = new AppointmentRepositoryImpl();

export const AppointmentProvider = ({ children }: { children: ReactNode }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar datos al iniciar la app
  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const data = await repository.getAll();
      // Ordenamos por fecha de creación (más reciente primero)
      setAppointments(data.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudieron cargar las citas");
    } finally {
      setIsLoading(false);
    }
  };

  const addAppointment = async (appointment: Appointment) => {
    setIsLoading(true);
    try {
      const newAppointment = await repository.create(appointment);
      setAppointments((prev) => [newAppointment, ...prev]);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo guardar la cita en la nube");
    } finally {
      setIsLoading(false);
    }
  };

  const updateAppointment = async (updatedAppointment: Appointment) => {
    setIsLoading(true);
    try {
      const result = await repository.update(updatedAppointment);
      setAppointments((prev) =>
        prev.map((appt) => (appt.id === result.id ? result : appt))
      );
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo actualizar la cita");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppointmentContext.Provider
      value={{ appointments, isLoading, addAppointment, updateAppointment }}
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
