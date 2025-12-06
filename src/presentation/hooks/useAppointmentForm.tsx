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

const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const patientRepo = new PatientRepositoryImpl();
const appointmentRepo = new AppointmentRepositoryImpl();

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

const getTimestampForTime = (dateStr: string, timeStr: string): number => {
  return new Date(`${dateStr}T${timeStr}:00`).getTime();
};

export const useAppointmentForm = (
  appointmentToEdit?: Appointment | null,
  onSuccess?: () => void
) => {
  const { addAppointment, updateAppointment, cancelAppointment } =
    useAppointments();
  const { patients } = usePatients();
  const { services } = useServices();

  const baseDate = useMemo(() => {
    if (appointmentToEdit) {
      return new Date(appointmentToEdit.scheduledStart)
        .toISOString()
        .split("T")[0];
    }
    return new Date().toISOString().split("T")[0];
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
    // facialType eliminado
    selectedServiceIds: [],
    selectedTime: "",
  });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [availableSlotsFromApi, setAvailableSlotsFromApi] = useState<string[]>(
    []
  );
  const [loadingSlots, setLoadingSlots] = useState(false);

  // --- CÁLCULO DE DURACIÓN REAL ---
  const currentDuration = useMemo(() => {
    if (formState.serviceMode === "hotel") {
      let total = 0;
      if (formState.duration) total += formState.duration;
      if (formState.hasNailCut) total += 10;
      return total || 10;
    } else {
      let total = 0;
      formState.selectedServiceIds.forEach((id) => {
        const service = services.find((s) => s.id === id);
        if (service) total += service.duration;
      });
      return total || 10;
    }
  }, [formState, services]);

  // --- CONSULTAR DISPONIBILIDAD ---
  useEffect(() => {
    let isActive = true;
    const fetchAvailability = async () => {
      setLoadingSlots(true);
      try {
        const slots = await appointmentRepo.getAvailability(
          baseDate,
          currentDuration
        );
        if (isActive) setAvailableSlotsFromApi(slots);
      } catch (error) {
        console.error("Error fetching slots:", error);
      } finally {
        if (isActive) setLoadingSlots(false);
      }
    };
    const timeout = setTimeout(fetchAvailability, 300);
    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [baseDate, currentDuration]);

  // --- CÁLCULO DE SLOTS VISUALES ---
  const timeSlots = useMemo(() => {
    const allSlots = generateAllDailySlots();
    const now = new Date();
    const todayStr = now.toLocaleDateString("en-CA");
    const isToday = baseDate === todayStr;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const mappedSlots = allSlots.map((time) => {
      const [h, m] = time.split(":").map(Number);
      const slotMinutes = h * 60 + m;
      const isPast = isToday && slotMinutes < currentMinutes;
      const isAvailableInBackend = availableSlotsFromApi.includes(time);
      const isMyOriginalTime = appointmentToEdit?.selectedTime === time;

      return {
        time,
        available: !isPast && (isAvailableInBackend || isMyOriginalTime),
        isPast,
      };
    });

    const futureSlots = mappedSlots.filter((slot) => !slot.isPast);
    const firstAvailableIndex = futureSlots.findIndex((slot) => slot.available);

    if (firstAvailableIndex === -1) return [];
    return futureSlots.slice(firstAvailableIndex);
  }, [availableSlotsFromApi, baseDate, appointmentToEdit]);

  // --- AUTO-SELECCIÓN DE HORA ---
  useEffect(() => {
    if (timeSlots.length > 0) {
      const firstSlot = timeSlots[0];
      const currentSelectionIsValid = timeSlots.find(
        (s) => s.time === formState.selectedTime
      )?.available;

      if (!formState.selectedTime || !currentSelectionIsValid) {
        if (!appointmentToEdit) {
          setFormState((prev) => ({ ...prev, selectedTime: firstSlot.time }));
        }
      }
    }
  }, [timeSlots, appointmentToEdit]);

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

      const serviceIds = appointmentToEdit.selectedServiceIds || [];

      setFormState({
        date: appointmentToEdit.date,
        patientName: appointmentToEdit.patientName,
        patientId: appointmentToEdit.patientId,
        serviceMode: mode,
        duration: appointmentToEdit.duration,
        hasNailCut: appointmentToEdit.hasNailCut,
        selectedServiceIds: serviceIds,
        selectedTime: appointmentToEdit.selectedTime || "",
      });
    } else {
      const dateObj = new Date(baseDate + "T12:00:00");
      const formattedDate = dateObj.toLocaleDateString("es-CL", {
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
        selectedTime: "",
      }));
    }
  }, [appointmentToEdit, baseDate]);

  // --- CÁLCULO FINANCIERO ---
  const financialSummary: FinancialSummary = useMemo(() => {
    let currentTotal = 0;
    let massagePrice = 0;
    let nailsPrice = 0;

    if (formState.serviceMode === "hotel") {
      // 1. Calcular precio BASE del masaje (Sujeto a comisión)
      if (formState.duration) {
        massagePrice = HOTEL_PRICES.massage[formState.duration as 20 | 40] || 0;
      }

      // 2. Calcular precio EXTRA de uñas (100% Anami)
      nailsPrice = formState.hasNailCut ? HOTEL_PRICES.nails.yes : 0;

      // El total que paga el cliente es la suma de ambos
      currentTotal = massagePrice + nailsPrice;
    } else {
      // Modo Particular: Suma simple de servicios seleccionados (sin comisión hotel)
      formState.selectedServiceIds.forEach((id) => {
        const service = services.find((s) => s.id === id);
        if (service) currentTotal += service.price;
      });
    }

    let anami = 0;
    let hotel = 0;

    if (formState.serviceMode === "hotel") {
      // --- REGLA DE NEGOCIO ---
      // El hotel gana el 40% SOLO del precio del masaje.
      const hotelFromMassage = Math.round(massagePrice * 0.4);

      hotel = hotelFromMassage;

      // Anami gana: (El resto del masaje) + (El 100% de las uñas)
      anami = massagePrice - hotelFromMassage + nailsPrice;
    } else {
      // En particular, todo es para Anami
      anami = currentTotal;
      hotel = 0;
    }

    return { total: currentTotal, anamiShare: anami, hotelShare: hotel };
  }, [formState, services]);

  // --- ACCIONES ---
  const setServiceMode = (mode: ServiceMode) => {
    setFormState((prev) => ({
      ...prev,
      serviceMode: mode,
      duration: null as any,
      selectedServiceIds: [],
      hasNailCut: false,
      selectedTime: "",
    }));
  };

  const toggleService = (id: string) => {
    setFormState((prev) => {
      const currentIds = prev.selectedServiceIds;
      const newIds = currentIds.includes(id)
        ? currentIds.filter((itemId) => itemId !== id)
        : [...currentIds, id];
      return { ...prev, selectedServiceIds: newIds, selectedTime: "" };
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
    setFormState((prev) => ({ ...prev, duration, selectedTime: "" }));
  const setHasNailCut = (value: boolean) =>
    setFormState((prev) => ({ ...prev, hasNailCut: value, selectedTime: "" }));
  const setSelectedTime = (time: string) =>
    setFormState((prev) => ({ ...prev, selectedTime: time }));

  const saveAppointment = async () => {
    if (isSaving) return;

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
      // Validamos que haya al menos duración o uñas (ya no facial)
      const hasService = formState.duration || formState.hasNailCut;
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
        "El horario seleccionado ya no está disponible."
      );
      return;
    }

    setIsSaving(true);

    try {
      let finalPatientId = formState.patientId;
      if (!finalPatientId) {
        const newPatient = await patientRepo.create({
          id: "",
          name: formState.patientName,
          createdAt: Date.now(),
        });
        finalPatientId = newPatient.id;
      }

      const startTimestamp = getTimestampForTime(
        baseDate,
        formState.selectedTime
      );
      const endTimestamp = startTimestamp + currentDuration * 60 * 1000;

      const commonData = {
        ...formState,
        ...financialSummary,
        patientId: finalPatientId,
        scheduledStart: startTimestamp,
        scheduledEnd: endTimestamp,
        duration: currentDuration,
      };

      if (appointmentToEdit) {
        await updateAppointment({
          ...commonData,
          id: appointmentToEdit.id,
          createdAt: appointmentToEdit.createdAt,
        });
        Alert.alert("Actualizado", "Cita modificada.", [
          { text: "OK", onPress: onSuccess },
        ]);
      } else {
        await addAppointment({
          ...commonData,
          id: generateUUID(),
          createdAt: Date.now(),
        });
        Alert.alert("Éxito", "Cita guardada.", [
          { text: "OK", onPress: resetForm },
        ]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo guardar la cita.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!appointmentToEdit) return;
    Alert.alert(
      "Cancelar Cita",
      "¿Estás segura de que quieres eliminar esta cita? El horario quedará libre.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, Eliminar",
          style: "destructive",
          onPress: async () => {
            setIsSaving(true);
            await cancelAppointment(appointmentToEdit.id);
            setIsSaving(false);
            onSuccess?.();
          },
        },
      ]
    );
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
    actions: {
      setPatientName,
      selectPatient,
      setServiceMode,
      toggleService,
      setDuration,
      setHasNailCut,
      setSelectedTime,
      saveAppointment,
      handleDelete,
    },
  };
};
