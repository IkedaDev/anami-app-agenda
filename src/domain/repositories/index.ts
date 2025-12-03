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
}

// Contrato para el Repositorio de Pacientes
export interface IPatientRepository {
  getAll(): Promise<Patient[]>;
  create(patient: Patient): Promise<Patient>;
  update(patient: Patient): Promise<Patient>;
  delete(id: string): Promise<void>;
}
