export interface Patient {
  id: string;
  name: string;
  rut?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: number;
}

// Omitimos 'id' y 'createdAt' porque no son parte del estado del formulario
export type PatientState = Omit<Patient, "id" | "createdAt">;
