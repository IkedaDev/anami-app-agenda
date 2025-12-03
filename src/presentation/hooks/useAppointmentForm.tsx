import { useState, useEffect, useMemo } from "react";
import { Alert } from "react-native";
import {
  Appointment,
  AppointmentState,
  FinancialSummary,
  HOTEL_PRICES,
  PARTICULAR_SERVICES,
  MassageDuration,
  FacialType,
  ServiceMode,
} from "../../domain/models/appointment";
import { useAppointments } from "../../core/context/AppointmentContext";
import { usePatients } from "../../core/context/PatientContext";
import { Patient } from "../../domain/models/patient";

const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// 1. Lógica base de slots (Actualizada: 8 AM a 11 PM)
const generateRawTimeSlots = () => {
  const slots = [];
  const startHour = 8; // Inicio: 08:00
  const endHour = 23; // Fin: 23:00 (11 PM)

  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += 10) {
      slots.push(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
      );
    }
  }
  return slots;
};

const getTimestampForTime = (timeStr: string): number => {
  const now = new Date();
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0,
    0
  );
  return date.getTime();
};

// 2. FUNCIÓN CORREGIDA: Encuentra el primer slot disponible o devuelve VACÍO
const findBestAvailableTime = (appointments: Appointment[]) => {
  const slots = generateRawTimeSlots();
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  let startIndex = slots.findIndex((slot) => {
    const [h, m] = slot.split(":").map(Number);
    return h > currentHour || (h === currentHour && m > currentMinute);
  });

  // Si ya pasó la hora de atención por hoy, no seleccionar nada
  if (startIndex === -1) return "";

  for (let i = startIndex; i < slots.length; i++) {
    const time = slots[i];
    const slotStart = getTimestampForTime(time);
    const durationMs = 10 * 60 * 1000;
    const slotEnd = slotStart + durationMs;

    const isTaken = appointments.some((appt) => {
      if (!appt.scheduledStart || !appt.scheduledEnd) return false;
      return slotStart < appt.scheduledEnd && slotEnd > appt.scheduledStart;
    });

    if (!isTaken) return time;
  }

  // Si llegamos aquí, significa que revisamos todo el día y todo está ocupado.
  // Devolvemos vacío para no pre-seleccionar una hora ocupada.
  return "";
};

export const useAppointmentForm = (
  appointmentToEdit?: Appointment | null,
  onSuccess?: () => void
) => {
  const { addAppointment, updateAppointment, appointments } = useAppointments();
  const { patients } = usePatients();

  // Extendemos el estado local para soportar array de IDs
  const [formState, setFormState] = useState<
    AppointmentState & { selectedServiceIds: string[] }
  >({
    date: "",
    patientName: "",
    patientId: undefined,
    serviceMode: "hotel",
    duration: null as any,
    hasNailCut: false,
    facialType: "no",
    selectedServiceIds: [],
    selectedTime: "",
  });

  const [showSuggestions, setShowSuggestions] = useState(false);

  // --- HELPER: OBTENER DURACIÓN REAL ---
  const getCurrentDuration = () => {
    if (formState.serviceMode === "hotel") {
      let total = 0;
      if (formState.duration) total += formState.duration;
      if (formState.hasNailCut) total += 10;
      if (formState.facialType !== "no") total += 60;
      return total;
    } else {
      // Modo Particular: Suma de todos los servicios seleccionados
      let total = 0;
      formState.selectedServiceIds.forEach((id) => {
        const service = PARTICULAR_SERVICES.find((s) => s.id === id);
        if (service) total += service.duration;
      });
      return total;
    }
  };

  // --- CÁLCULO DE SLOTS ---
  const timeSlots = useMemo(() => {
    const rawSlots = generateRawTimeSlots();
    const nowTimestamp = Date.now();

    const currentTotalDuration = getCurrentDuration() || 10;

    const mappedSlots = rawSlots.map((time) => {
      const slotStart = getTimestampForTime(time);
      const durationMs = currentTotalDuration * 60 * 1000;
      const slotEnd = slotStart + durationMs;
      const isPast = slotStart < nowTimestamp - 60000;

      const isTaken = appointments.some((appt) => {
        if (appointmentToEdit && appt.id === appointmentToEdit.id) return false;
        if (!appt.scheduledStart || !appt.scheduledEnd) return false;
        return slotStart < appt.scheduledEnd && slotEnd > appt.scheduledStart;
      });

      return { time, available: !isTaken && !isPast, isPast };
    });

    const futureSlots = mappedSlots.filter((slot) => !slot.isPast);
    const firstAvailableIndex = futureSlots.findIndex((slot) => slot.available);

    if (firstAvailableIndex > 0) return futureSlots.slice(firstAvailableIndex);
    return futureSlots;
  }, [appointments, formState, appointmentToEdit]);

  const suggestions = useMemo(() => {
    if (!formState.patientName || !showSuggestions) return [];
    const term = formState.patientName.toLowerCase();
    return patients
      .filter((p) => p.name.toLowerCase().includes(term))
      .slice(0, 5);
  }, [patients, formState.patientName, showSuggestions]);

  // --- INICIALIZACIÓN ---
  useEffect(() => {
    if (appointmentToEdit) {
      const mode =
        appointmentToEdit.serviceMode ||
        ((appointmentToEdit as any).isHotelService ? "hotel" : "particular");

      const serviceIds =
        (appointmentToEdit as any).selectedServiceIds ||
        ((appointmentToEdit as any).selectedServiceId
          ? [(appointmentToEdit as any).selectedServiceId]
          : []);

      setFormState({
        date: appointmentToEdit.date,
        patientName: appointmentToEdit.patientName,
        patientId: appointmentToEdit.patientId,
        serviceMode: mode,
        duration: appointmentToEdit.duration,
        hasNailCut: appointmentToEdit.hasNailCut,
        facialType: appointmentToEdit.facialType,
        selectedServiceIds: serviceIds,
        selectedTime: appointmentToEdit.selectedTime || "",
      });
    } else {
      const today = new Date();
      const formattedDate = today.toLocaleDateString("es-CL", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const capitalizedDate =
        formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

      setFormState((prev) => ({
        ...prev,
        date: capitalizedDate,
        patientName: "",
        duration: null as any,
        selectedTime: findBestAvailableTime(appointments),
      }));
    }
  }, [appointmentToEdit]);

  // --- CÁLCULO FINANCIERO ---
  const financialSummary: FinancialSummary = useMemo(() => {
    let currentTotal = 0;

    if (formState.serviceMode === "hotel") {
      if (formState.duration)
        currentTotal +=
          HOTEL_PRICES.massage[formState.duration as 20 | 40] || 0;
      currentTotal += formState.hasNailCut
        ? HOTEL_PRICES.nails.yes
        : HOTEL_PRICES.nails.no;
      currentTotal += HOTEL_PRICES.facial[formState.facialType];
    } else {
      formState.selectedServiceIds.forEach((id) => {
        const service = PARTICULAR_SERVICES.find((s) => s.id === id);
        if (service) currentTotal += service.price;
      });
    }

    let anami = 0;
    let hotel = 0;

    if (formState.serviceMode === "hotel") {
      anami = currentTotal * 0.6;
      hotel = currentTotal * 0.4;
    } else {
      anami = currentTotal;
      hotel = 0;
    }

    return { total: currentTotal, anamiShare: anami, hotelShare: hotel };
  }, [formState]);

  // --- ACCIONES ---
  const setServiceMode = (mode: ServiceMode) => {
    setFormState((prev) => ({
      ...prev,
      serviceMode: mode,
      duration: null as any,
      selectedServiceIds: [],
      hasNailCut: false,
      facialType: "no",
    }));
  };

  const toggleService = (id: string) => {
    setFormState((prev) => {
      const currentIds = prev.selectedServiceIds;
      const exists = currentIds.includes(id);
      let newIds;

      if (exists) {
        newIds = currentIds.filter((itemId) => itemId !== id);
      } else {
        newIds = [...currentIds, id];
      }

      return { ...prev, selectedServiceIds: newIds };
    });
  };

  const setPatientName = (text: string) => {
    setFormState((prev) => ({
      ...prev,
      patientName: text,
      patientId: undefined,
    }));
    setShowSuggestions(true);
  };

  const selectPatient = (patient: Patient) => {
    setFormState((prev) => ({
      ...prev,
      patientName: patient.name,
      patientId: patient.id,
    }));
    setShowSuggestions(false);
  };

  const setDuration = (duration: MassageDuration) =>
    setFormState((prev) => ({ ...prev, duration }));
  const setHasNailCut = (value: boolean) =>
    setFormState((prev) => ({ ...prev, hasNailCut: value }));
  const setFacialType = (type: FacialType) =>
    setFormState((prev) => ({ ...prev, facialType: type }));
  const setSelectedTime = (time: string) =>
    setFormState((prev) => ({ ...prev, selectedTime: time }));

  const setIsHotelService = (value: boolean) => {
    setServiceMode(value ? "hotel" : "particular");
  };

  const saveAppointment = () => {
    if (!formState.patientName.trim()) {
      Alert.alert(
        "Falta información",
        "Por favor ingresa el nombre del paciente."
      );
      return;
    }
    if (!formState.selectedTime) {
      Alert.alert("Falta información", "Por favor selecciona una hora.");
      return;
    }

    if (formState.serviceMode === "hotel") {
      const hasService =
        formState.duration ||
        formState.hasNailCut ||
        formState.facialType !== "no";
      if (!hasService) {
        Alert.alert("Sin servicios", "Debes seleccionar al menos un servicio.");
        return;
      }
    } else {
      if (formState.selectedServiceIds.length === 0) {
        Alert.alert("Sin servicios", "Debes seleccionar al menos un servicio.");
        return;
      }
    }

    const slotData = timeSlots.find((s) => s.time === formState.selectedTime);
    if (slotData && !slotData.available) {
      Alert.alert(
        "Horario no disponible",
        "El horario seleccionado choca con otra cita."
      );
      return;
    }

    const startTimestamp = getTimestampForTime(formState.selectedTime);
    const totalDuration = getCurrentDuration();
    const endTimestamp = startTimestamp + totalDuration * 60 * 1000;

    const commonData = {
      ...formState,
      ...financialSummary,
      scheduledStart: startTimestamp,
      scheduledEnd: endTimestamp,
      duration: totalDuration,
    };

    if (appointmentToEdit) {
      updateAppointment({
        ...commonData,
        id: appointmentToEdit.id,
        createdAt: appointmentToEdit.createdAt,
      });
      Alert.alert("Actualizado", "Cita modificada.", [
        { text: "OK", onPress: onSuccess },
      ]);
    } else {
      addAppointment({
        ...commonData,
        id: generateUUID(),
        createdAt: Date.now(),
      });
      Alert.alert("Éxito", "Cita guardada.", [
        { text: "OK", onPress: resetForm },
      ]);
    }
  };

  const resetForm = () => {
    if (!appointmentToEdit) {
      setFormState((prev) => ({
        ...prev,
        patientName: "",
        patientId: undefined,
        duration: null as any,
        selectedServiceId: undefined,
        selectedServiceIds: [],
        hasNailCut: false,
        facialType: "no",
        selectedTime: findBestAvailableTime(appointments),
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
    actions: {
      setPatientName,
      selectPatient,
      setServiceMode,
      toggleService,
      setDuration,
      setHasNailCut,
      setFacialType,
      setSelectedTime,
      setIsHotelService,
      saveAppointment,
    },
  };
};
