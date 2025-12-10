// src/core/utils/date.ts

// Formateador para Título (Ej: Sábado 6 de Diciembre) - Forzando Chile
const chileTextFormatter = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  weekday: "long",
  day: "numeric",
  month: "long",
});

// Formateador para API (YYYY-MM-DD) - Forzando Chile
const chileISOFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Formateador de Hora (14:30)
const chileTimeFormatter = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  hour: "2-digit",
  minute: "2-digit",
});

// --- EXPORTS ---

export const formatDateToChile = (date: Date | number | string) => {
  const d = new Date(date);
  const str = chileTextFormatter.format(d);
  // Capitalizar primera letra
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const formatTime = (date: Date | number | string) => {
  return chileTimeFormatter.format(new Date(date));
};

export const toLocalISOString = (date: Date | number | string) => {
  return chileISOFormatter.format(new Date(date));
};

export const getTimestampForTime = (
  baseDate: Date,
  timeStr: string
): number => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
};

export const isSameDay = (
  timestamp1: number,
  timestamp2: number = Date.now()
) => {
  const d1 = new Date(timestamp1);
  const d2 = new Date(timestamp2);
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
};

export const isCurrentMonth = (timestamp: number) => {
  const d = new Date(timestamp);
  const now = new Date();
  return (
    d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  );
};
