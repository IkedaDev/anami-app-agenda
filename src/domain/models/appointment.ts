// Tipos
export type MassageDuration = 20 | 40 | number; // Ahora puede ser cualquier número (ej: 35, 45, 60)
export type ServiceMode = "hotel" | "particular";

export interface AppointmentState {
  date: string;
  patientName: string;
  patientId?: string;

  // Configuración
  serviceMode: ServiceMode; // NUEVO: 'hotel' o 'particular'

  // Datos Hotel
  duration: MassageDuration;
  hasNailCut: boolean;

  // Datos Particular
  selectedServiceIds?: string[]; // ID del servicio particular seleccionado

  // Común
  selectedTime: string;
}

export interface FinancialSummary {
  total: number;
  anamiShare: number;
  hotelShare: number;
}

export interface Appointment extends AppointmentState, FinancialSummary {
  id: string;
  createdAt: number;
  scheduledStart: number;
  scheduledEnd: number;
}

// Precios Hotel (Mantienen la lógica antigua)
export const HOTEL_PRICES = {
  massage: { 20: 10000, 40: 20000 },
  nails: { yes: 5000, no: 0 },
} as const;
