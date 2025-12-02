import { useState, useEffect, useMemo } from "react";
import { Alert } from "react-native";
import {
  Appointment,
  AppointmentState,
  FinancialSummary,
  PRICE_LIST,
  MassageDuration,
  FacialType,
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

// 1. Lógica base de slots
const generateRawTimeSlots = () => {
  const slots = [];
  const startHour = 9;
  const endHour = 20;

  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += 10) {
      slots.push(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
      );
    }
  }
  return slots;
};

// Helper para convertir string "HH:mm" de hoy a Timestamp
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

// 2. NUEVA FUNCIÓN INTELIGENTE: Encuentra el primer slot futuro DISPONIBLE
const findBestAvailableTime = (appointments: Appointment[]) => {
  const slots = generateRawTimeSlots();
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  let startIndex = slots.findIndex((slot) => {
    const [h, m] = slot.split(":").map(Number);
    return h > currentHour || (h === currentHour && m > currentMinute);
  });

  if (startIndex === -1) startIndex = 0;

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

  return slots[startIndex] || slots[0];
};

export const useAppointmentForm = (
  appointmentToEdit?: Appointment | null,
  onSuccess?: () => void
) => {
  const { addAppointment, updateAppointment, appointments } = useAppointments();
  const { patients } = usePatients();

  const [formState, setFormState] = useState<AppointmentState>({
    date: "",
    patientName: "",
    patientId: undefined,
    duration: null as any,
    hasNailCut: false,
    facialType: "no",
    isHotelService: false,
    selectedTime: "",
  });

  const [showSuggestions, setShowSuggestions] = useState(false);

  // NUEVO HELPER: Calcula la duración total combinada
  const getTotalDuration = () => {
    let total = 0;
    // Masaje (si existe)
    if (formState.duration) total += formState.duration;
    // Uñas: 10 min
    if (formState.hasNailCut) total += 10;
    // Facial: 60 min
    if (formState.facialType !== "no") total += 60;

    return total;
  };

  // 3. CALCULAR DISPONIBILIDAD DE SLOTS (Para la UI)
  const timeSlots = useMemo(() => {
    const rawSlots = generateRawTimeSlots();
    const nowTimestamp = Date.now();

    // Calculamos duración total para verificar disponibilidad
    // Si es 0 (nada seleccionado), usamos 10 min por defecto para la verificación
    const currentTotalDuration = getTotalDuration() || 10;

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

      return {
        time,
        available: !isTaken && !isPast,
        isPast,
      };
    });

    const futureSlots = mappedSlots.filter((slot) => !slot.isPast);
    const firstAvailableIndex = futureSlots.findIndex((slot) => slot.available);

    if (firstAvailableIndex > 0) {
      return futureSlots.slice(firstAvailableIndex);
    }

    return futureSlots;
  }, [
    appointments,
    formState.duration,
    formState.hasNailCut,
    formState.facialType,
    appointmentToEdit,
  ]);

  const suggestions = useMemo(() => {
    if (!formState.patientName || !showSuggestions) return [];
    const term = formState.patientName.toLowerCase();
    return patients
      .filter((p) => p.name.toLowerCase().includes(term))
      .slice(0, 5);
  }, [patients, formState.patientName, showSuggestions]);

  useEffect(() => {
    if (appointmentToEdit) {
      setFormState({
        date: appointmentToEdit.date,
        patientName: appointmentToEdit.patientName,
        patientId: appointmentToEdit.patientId,
        duration: appointmentToEdit.duration,
        hasNailCut: appointmentToEdit.hasNailCut,
        facialType: appointmentToEdit.facialType,
        isHotelService: appointmentToEdit.isHotelService,
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

  const financialSummary: FinancialSummary = useMemo(() => {
    let currentTotal = 0;

    if (formState.duration) {
      currentTotal += PRICE_LIST.massage[formState.duration];
    }

    currentTotal += formState.hasNailCut
      ? PRICE_LIST.nails.yes
      : PRICE_LIST.nails.no;
    currentTotal += PRICE_LIST.facial[formState.facialType];

    let anami = 0;
    let hotel = 0;

    if (formState.isHotelService) {
      anami = currentTotal * 0.6;
      hotel = currentTotal * 0.4;
    } else {
      anami = currentTotal;
      hotel = 0;
    }

    return {
      total: currentTotal,
      anamiShare: anami,
      hotelShare: hotel,
    };
  }, [
    formState.duration,
    formState.hasNailCut,
    formState.facialType,
    formState.isHotelService,
  ]);

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
  const setIsHotelService = (value: boolean) =>
    setFormState((prev) => ({ ...prev, isHotelService: value }));
  const setSelectedTime = (time: string) =>
    setFormState((prev) => ({ ...prev, selectedTime: time }));

  const calculateTimestamps = () => {
    const startTimestamp = getTimestampForTime(formState.selectedTime);
    // Usamos la duración total real para guardar
    const totalDuration = getTotalDuration();
    const endTimestamp = startTimestamp + totalDuration * 60 * 1000;
    return { start: startTimestamp, end: endTimestamp };
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
      Alert.alert(
        "Falta información",
        "Por favor selecciona una hora para la cita."
      );
      return;
    }

    const hasService =
      formState.duration ||
      formState.hasNailCut ||
      formState.facialType !== "no";
    if (!hasService) {
      Alert.alert(
        "Sin servicios",
        "Debes seleccionar al menos un servicio (Masaje, Uñas o Facial)."
      );
      return;
    }

    const slotData = timeSlots.find((s) => s.time === formState.selectedTime);
    if (slotData && !slotData.available) {
      Alert.alert(
        "Horario no disponible",
        "El horario seleccionado ya pasó o choca con otra cita."
      );
      return;
    }

    const timestamps = calculateTimestamps();

    const commonData = {
      ...formState,
      ...financialSummary,
      scheduledStart: timestamps.start,
      scheduledEnd: timestamps.end,
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
        hasNailCut: false,
        facialType: "no",
        isHotelService: false,
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
      setDuration,
      setHasNailCut,
      setFacialType,
      setIsHotelService,
      setSelectedTime,
      saveAppointment,
    },
  };
};
