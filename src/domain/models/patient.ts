export interface Patient {
  id: string;
  name: string; // Obligatorio
  rut?: string; // Opcional
  phone?: string; // Opcional
  email?: string; // Opcional
  address?: string; // Opcional
  createdAt: number;
}

export interface PatientState {
  name: string;
  rut: string;
  phone: string;
  email: string;
  address: string;
}
