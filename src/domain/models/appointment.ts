// Tipos
export type MassageDuration = 20 | 40 | number; // Ahora puede ser cualquier número (ej: 35, 45, 60)
export type FacialType = "no" | "hombre" | "mujer";
export type ServiceMode = "hotel" | "particular";

// Lista de Servicios Particulares (Según tu requerimiento)
export const PARTICULAR_SERVICES = [
  { id: "desc", name: "Masaje Descontracturante", duration: 40, price: 17000 },
  { id: "mixto", name: "Masaje Mixto", duration: 40, price: 15000 },
  {
    id: "relajacion",
    name: "Masaje de Relajación",
    duration: 40,
    price: 13000,
  },
  { id: "craneo", name: "Masaje Cráneo Facial", duration: 35, price: 10000 },
  { id: "cuerpo", name: "Masaje Cuerpo Completo", duration: 60, price: 20000 },
  { id: "drenaje", name: "Drenaje Linfático", duration: 45, price: 14000 },
  { id: "podal", name: "Masaje Podal", duration: 30, price: 10000 },
  { id: "facial", name: "Limpieza Facial", duration: 60, price: 20000 },
  { id: "unas", name: "Corte de uñas", duration: 10, price: 5000 },
] as const;

export interface AppointmentState {
  date: string;
  patientName: string;
  patientId?: string;

  // Configuración
  serviceMode: ServiceMode; // NUEVO: 'hotel' o 'particular'

  // Datos Hotel
  duration: MassageDuration;
  hasNailCut: boolean;
  facialType: FacialType;

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
  massage: { 20: 15000, 40: 25000 },
  nails: { yes: 5000, no: 0 },
  facial: { no: 0, hombre: 15000, mujer: 18000 },
} as const;
