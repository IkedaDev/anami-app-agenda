import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Patient } from "../../domain/models/patient";
import { PatientRepositoryImpl } from "../../data/repositories/PatientRepositoryImpl";
import { Alert } from "react-native";

interface PatientContextType {
  patients: Patient[];
  isLoading: boolean;
  addPatient: (patient: Patient) => Promise<void>;
  updatePatient: (patient: Patient) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

// Instanciamos el repositorio (Inyección de dependencias)
const repository = new PatientRepositoryImpl();

export const PatientProvider = ({ children }: { children: ReactNode }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar pacientes al iniciar el Provider
  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      const data = await repository.getAll();
      // Ordenamos por fecha de creación, los más nuevos primero
      setPatients(data.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Error",
        "No se pudieron cargar los clientes desde el servidor."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const addPatient = async (patient: Patient) => {
    setIsLoading(true);
    try {
      const newPatient = await repository.create(patient);
      setPatients((prev) => [newPatient, ...prev]);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo guardar el cliente en la nube.");
    } finally {
      setIsLoading(false);
    }
  };

  const updatePatient = async (updatedPatient: Patient) => {
    setIsLoading(true);
    try {
      const result = await repository.update(updatedPatient);
      setPatients((prev) => prev.map((p) => (p.id === result.id ? result : p)));
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo actualizar la información del cliente.");
    } finally {
      setIsLoading(false);
    }
  };

  const deletePatient = async (id: string) => {
    setIsLoading(true);
    try {
      await repository.delete(id);
      setPatients((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo eliminar el cliente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PatientContext.Provider
      value={{
        patients,
        isLoading,
        addPatient,
        updatePatient,
        deletePatient,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

export const usePatients = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error("usePatients must be used within a PatientProvider");
  }
  return context;
};
