import { Appointment } from "../models/appointment";
import { Patient } from "../models/patient";

// Contrato para el Repositorio de Citas
export interface IAppointmentRepository {
  getAll(): Promise<Appointment[]>;
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
