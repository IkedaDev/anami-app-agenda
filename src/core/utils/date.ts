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
  date1: Date | number | string,
  date2: Date | number | string = new Date()
) => {
  // Comparamos los strings "2023-12-25" generados en zona horaria Santiago
  return toLocalISOString(date1) === toLocalISOString(date2);
};

export const isCurrentMonth = (date: Date | number | string) => {
  const d1Str = toLocalISOString(date); // Ej: "2023-12-05"
  const nowStr = toLocalISOString(new Date()); // Ej: "2023-12-23"

  // Comparamos solo "2023-12"
  return d1Str.substring(0, 7) === nowStr.substring(0, 7);
};

// Helper nuevo para saber si una fecha es "Hoy o Futuro" en Santiago
export const isTodayOrFuture = (date: Date | number | string) => {
  const targetDate = toLocalISOString(date);
  const todaySantiago = toLocalISOString(new Date());

  // Comparación alfabética de strings ISO funciona cronológicamente
  return targetDate >= todaySantiago;
};
