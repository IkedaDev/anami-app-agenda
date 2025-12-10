import { useState, useEffect, useMemo } from "react";
import { Alert } from "react-native";
import {
  Appointment,
  AppointmentState,
  FinancialSummary,
  HOTEL_PRICES,
  MassageDuration,
  ServiceMode,
} from "../../domain/models/appointment";
import { useAppointments } from "../../core/context/AppointmentContext";
import { usePatients } from "../../core/context/PatientContext";
import { useServices } from "../../core/context/ServiceContext";
import { Patient } from "../../domain/models/patient";
import { PatientRepositoryImpl } from "../../data/repositories/PatientRepositoryImpl";
import { AppointmentRepositoryImpl } from "../../data/repositories/AppointmentRepositoryImpl";

import { generateUUID } from "../../core/utils/uuid";
import {
  toLocalISOString,
  formatDateToChile,
  getTimestampForTime,
} from "../../core/utils/date";

const patientRepo = new PatientRepositoryImpl();
const appointmentRepo = new AppointmentRepositoryImpl();

// Formateador para Título (Sábado 6 de Diciembre) forzando Chile
const chileTextFormatter = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  weekday: "long",
  day: "numeric",
  month: "long",
});

const toSpanishDateString = (date: Date) => {
  // capitalizeFirstLetter manual porque Intl devuelve minúsculas
  const str = chileTextFormatter.format(date);
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const generateAllDailySlots = () => {
  const slots = [];
  for (let h = 8; h < 23; h++) {
    for (let m = 0; m < 60; m += 10) {
      slots.push(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
      );
    }
  }
  return slots;
};

// --- 2. HOOK PRINCIPAL ---

export const useAppointmentForm = (
  appointmentToEdit?: Appointment | null,
  onSuccess?: () => void
) => {
  const { addAppointment, updateAppointment, cancelAppointment } =
    useAppointments();
  const { patients } = usePatients();
  const { services } = useServices();

  const baseDate = useMemo(() => {
    return appointmentToEdit
      ? new Date(appointmentToEdit.scheduledStart)
      : new Date();
  }, [appointmentToEdit]);

  const [formState, setFormState] = useState<
    AppointmentState & { selectedServiceIds: string[] }
  >({
    date: "",
    patientName: "",
    patientId: undefined,
    serviceMode: "hotel",
    duration: null as any,
    hasNailCut: false,
    selectedServiceIds: [],
    selectedTime: "",
  });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availableSlotsFromApi, setAvailableSlotsFromApi] = useState<string[]>(
    []
  );
  const [loadingSlots, setLoadingSlots] = useState(false);

  // --- CÁLCULOS ---

  const currentDuration = useMemo(() => {
    if (formState.serviceMode === "hotel") {
      let total = (formState.duration || 0) + (formState.hasNailCut ? 10 : 0);
      return total || 10;
    }
    const servicesDuration = formState.selectedServiceIds.reduce((acc, id) => {
      const s = services.find((srv) => srv.id === id);
      return acc + (s ? s.duration : 0);
    }, 0);
    return servicesDuration || 10;
  }, [
    formState.serviceMode,
    formState.duration,
    formState.hasNailCut,
    formState.selectedServiceIds,
    services,
  ]);

  const financialSummary: FinancialSummary = useMemo(() => {
    let currentTotal = 0;
    let massagePrice = 0;
    let nailsPrice = 0;

    if (formState.serviceMode === "hotel") {
      if (formState.duration) {
        massagePrice = HOTEL_PRICES.massage[formState.duration as 20 | 40] || 0;
      }
      nailsPrice = formState.hasNailCut ? HOTEL_PRICES.nails.yes : 0;
      currentTotal = massagePrice + nailsPrice;
    } else {
      currentTotal = formState.selectedServiceIds.reduce((acc, id) => {
        const s = services.find((srv) => srv.id === id);
        return acc + (s ? s.price : 0);
      }, 0);
    }

    let anami = currentTotal;
    let hotel = 0;

    if (formState.serviceMode === "hotel") {
      const hotelFromMassage = Math.round(massagePrice * 0.4);
      hotel = hotelFromMassage;
      anami = massagePrice - hotelFromMassage + nailsPrice;
    }

    return { total: currentTotal, anamiShare: anami, hotelShare: hotel };
  }, [
    formState.serviceMode,
    formState.duration,
    formState.hasNailCut,
    formState.selectedServiceIds,
    services,
  ]);

  // --- SLOTS VISUALES ---
  const timeSlots = useMemo(() => {
    const allSlots = generateAllDailySlots();
    const now = new Date();

    const mappedSlots = allSlots.map((time) => {
      const slotStart = getTimestampForTime(baseDate, time);
      // Margen de 1 minuto
      const isPast = slotStart < now.getTime() - 60000;

      const isAvailable =
        availableSlotsFromApi.includes(time) ||
        appointmentToEdit?.selectedTime === time;

      return {
        time,
        available: !isPast && isAvailable,
        isPast,
      };
    });

    const futureSlots = mappedSlots.filter((s) => !s.isPast);
    const firstAvailableIndex = futureSlots.findIndex((s) => s.available);

    return firstAvailableIndex === -1
      ? []
      : futureSlots.slice(firstAvailableIndex);
  }, [availableSlotsFromApi, baseDate, appointmentToEdit]);

  const suggestions = useMemo(() => {
    if (!formState.patientName || !showSuggestions) return [];
    const term = formState.patientName.toLowerCase();
    return patients
      .filter((p) => p.name.toLowerCase().includes(term))
      .slice(0, 5);
  }, [patients, formState.patientName, showSuggestions]);

  // --- EFECTOS ---

  // 1. Cargar Disponibilidad (Forzando Chile)
  useEffect(() => {
    let isActive = true;

    // Usamos el formatter de Chile para obtener YYYY-MM-DD correcto
    const dateStr = toLocalISOString(baseDate);

    const fetchAvailability = async () => {
      setLoadingSlots(true);
      try {
        const slots = await appointmentRepo.getAvailability(
          dateStr,
          currentDuration,
          appointmentToEdit?.id
        );
        if (isActive) setAvailableSlotsFromApi(slots);
      } catch (error) {
        console.error(error);
      } finally {
        if (isActive) setLoadingSlots(false);
      }
    };

    const timeout = setTimeout(fetchAvailability, 300);
    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [baseDate, currentDuration, appointmentToEdit?.id]);

  // 2. Auto-selección
  useEffect(() => {
    if (!appointmentToEdit && timeSlots.length > 0) {
      const firstSlot = timeSlots[0];
      const currentValid = timeSlots.find(
        (s) => s.time === formState.selectedTime
      )?.available;

      if (!formState.selectedTime || !currentValid) {
        setFormState((prev) => ({ ...prev, selectedTime: firstSlot.time }));
      }
    }
  }, [timeSlots, appointmentToEdit]);

  // 3. Inicialización
  useEffect(() => {
    if (appointmentToEdit) {
      setFormState({
        date: appointmentToEdit.date,
        patientName: appointmentToEdit.patientName,
        patientId: appointmentToEdit.patientId,
        serviceMode: (appointmentToEdit.serviceMode || "hotel") as ServiceMode,
        duration: appointmentToEdit.duration,
        hasNailCut: appointmentToEdit.hasNailCut,
        selectedServiceIds: appointmentToEdit.selectedServiceIds || [],
        selectedTime: appointmentToEdit.selectedTime || "",
      });
    } else {
      // Título con fecha de Chile
      setFormState((prev) => ({
        ...prev,
        date: formatDateToChile(baseDate),
        patientName: "",
        duration: null as any,
        selectedTime: "",
      }));
    }
  }, [appointmentToEdit, baseDate]);

  // --- HANDLERS ---

  const actions = {
    setPatientName: (t: string) => {
      setFormState((p) => ({ ...p, patientName: t, patientId: undefined }));
      setShowSuggestions(true);
    },
    selectPatient: (p: Patient) => {
      setFormState((prev) => ({
        ...prev,
        patientName: p.name,
        patientId: p.id,
      }));
      setShowSuggestions(false);
    },
    setServiceMode: (m: ServiceMode) =>
      setFormState((p) => ({
        ...p,
        serviceMode: m,
        duration: null as any,
        selectedServiceIds: [],
        hasNailCut: false,
        selectedTime: "",
      })),
    toggleService: (id: string) =>
      setFormState((p) => {
        const ids = p.selectedServiceIds.includes(id)
          ? p.selectedServiceIds.filter((i) => i !== id)
          : [...p.selectedServiceIds, id];
        return { ...p, selectedServiceIds: ids, selectedTime: "" };
      }),
    setDuration: (d: MassageDuration) =>
      setFormState((p) => ({ ...p, duration: d, selectedTime: "" })),
    setHasNailCut: (v: boolean) =>
      setFormState((p) => ({ ...p, hasNailCut: v, selectedTime: "" })),
    setSelectedTime: (t: string) =>
      setFormState((p) => ({ ...p, selectedTime: t })),

    saveAppointment: async () => {
      if (isSaving) return;
      if (!formState.patientName.trim())
        return Alert.alert("Falta información", "Nombre requerido.");
      if (!formState.selectedTime)
        return Alert.alert("Falta información", "Hora requerida.");

      if (
        formState.serviceMode === "hotel" &&
        !formState.duration &&
        !formState.hasNailCut
      ) {
        return Alert.alert("Sin servicios", "Selecciona un servicio.");
      }
      if (
        formState.serviceMode === "particular" &&
        formState.selectedServiceIds.length === 0
      ) {
        return Alert.alert("Sin servicios", "Selecciona un servicio.");
      }

      const slot = timeSlots.find((s) => s.time === formState.selectedTime);
      if (slot && !slot.available)
        return Alert.alert("No disponible", "El horario ya no está libre.");

      setIsSaving(true);
      try {
        let patientId = formState.patientId;
        if (!patientId) {
          const newP = await patientRepo.create({
            id: "",
            name: formState.patientName,
            createdAt: Date.now(),
          });
          patientId = newP.id;
        }

        const startTimestamp = getTimestampForTime(
          baseDate,
          formState.selectedTime
        );
        const endTimestamp = startTimestamp + currentDuration * 60 * 1000;

        const data = {
          ...formState,
          ...financialSummary,
          patientId,
          scheduledStart: startTimestamp,
          scheduledEnd: endTimestamp,
          duration: currentDuration,
        };

        if (appointmentToEdit) {
          await updateAppointment({
            ...data,
            id: appointmentToEdit.id,
            createdAt: appointmentToEdit.createdAt,
          });
          Alert.alert("Actualizado", "Cita modificada.", [
            { text: "OK", onPress: onSuccess },
          ]);
        } else {
          await addAppointment({
            ...data,
            id: generateUUID(),
            createdAt: Date.now(),
          });
          Alert.alert("Éxito", "Cita guardada.", [
            { text: "OK", onPress: resetForm },
          ]);
        }
      } catch (e) {
        Alert.alert("Error", "No se pudo guardar.");
      } finally {
        setIsSaving(false);
      }
    },

    handleDelete: () => {
      if (!appointmentToEdit) return;
      Alert.alert("Cancelar", "¿Eliminar esta cita?", [
        { text: "No", style: "cancel" },
        {
          text: "Sí",
          style: "destructive",
          onPress: async () => {
            setIsSaving(true);
            await cancelAppointment(appointmentToEdit.id);
            setIsSaving(false);
            onSuccess?.();
          },
        },
      ]);
    },
  };

  const resetForm = () => {
    if (!appointmentToEdit) {
      const now = new Date();
      setFormState((p) => ({
        ...p,
        date: toSpanishDateString(now),
        patientName: "",
        patientId: undefined,
        duration: null as any,
        selectedServiceIds: [],
        hasNailCut: false,
        selectedTime: "",
      }));
      setShowSuggestions(false);
    }
  };

  return {
    formState,
    financialSummary,
    isEditing: !!appointmentToEdit,
    suggestions,
    timeSlots,
    isSaving,
    loadingSlots,
    actions,
  };
};
