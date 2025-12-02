export type MassageDuration = 20 | 40;
export type FacialType = "no" | "hombre" | "mujer";

export interface AppointmentState {
  date: string; // Texto legible (ej: "Lunes...") para mostrar
  patientName: string;
  patientId?: string;
  duration: MassageDuration;
  hasNailCut: boolean;
  facialType: FacialType;
  isHotelService: boolean;

  // NUEVO: Hora seleccionada en formato "HH:mm" (ej: "14:30") para la UI
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

  // NUEVOS CAMPOS PARA CALENDARIO FUTURO
  // Estos son los que leerá la librería de calendario (ej: React Native Calendars)
  scheduledStart: number; // Timestamp exacto de inicio
  scheduledEnd: number; // Timestamp exacto de fin (Start + Duration)
}

// Configuración de Precios (Regla de Negocio)
export const PRICE_LIST = {
  massage: {
    20: 10000,
    40: 20000,
  },
  nails: {
    yes: 5000,
    no: 0,
  },
  facial: {
    no: 0,
    hombre: 10000,
    mujer: 15000,
  },
} as const;
