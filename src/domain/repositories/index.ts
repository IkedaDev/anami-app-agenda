import { Appointment } from "../models/appointment";
import { Patient } from "../models/patient";

// Contrato para el Repositorio de Citas
export interface IAppointmentRepository {
  /**
   * Obtiene todas las citas (Método legacy o para reportes)
   */
  getAll(): Promise<Appointment[]>;

  /**
   * Obtiene citas de manera paginada para optimizar rendimiento.
   * @param limitCount Cantidad de items a traer
   * @param lastVisible (Opcional) El cursor del último documento obtenido para seguir desde ahí
   */
  getPaginated(
    limitCount: number,
    lastVisible?: any
  ): Promise<{ appointments: Appointment[]; lastDoc: any }>;

  create(appointment: Appointment): Promise<Appointment>;

  update(appointment: Appointment): Promise<Appointment>;

  delete(id: string): Promise<void>;
  getAvailability(date: string, durationMinutes: number): Promise<string[]>;
}

// Contrato para el Repositorio de Pacientes
export interface IPatientRepository {
  getAll(): Promise<Patient[]>;
  create(patient: Patient): Promise<Patient>;
  update(patient: Patient): Promise<Patient>;
  delete(id: string): Promise<void>;
}

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  price: number; // Mapeo de basePrice
  duration: number; // Mapeo de durationMin
  isActive: boolean;
}

// NUEVO: Contrato para el Repositorio de Servicios
export interface IServiceRepository {
  /**
   * Obtiene todos los servicios marcados como activos desde el API.
   */
  getAllActive(): Promise<Service[]>;
}
