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

// Generamos todos los slots del día (08:00 a 23:00)
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

// 1. CORRECCIÓN: Ahora recibe la fecha base como argumento
const getTimestampForTime = (baseDate: Date, timeStr: string): number => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  // Clonamos la fecha base para no mutarla
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
};

// 2. NUEVOS HELPERS PARA FORMATEO MANUAL (Evita el bug de UTC en Android)
const toLocalISOString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`; // Retorna "2025-12-06" respetando hora local
};

const toSpanishDateString = (date: Date) => {
  const days = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const dayName = days[date.getDay()];
  const dayNumber = date.getDate();
  const monthName = months[date.getMonth()];
  // const year = date.getFullYear(); // Opcional

  return `${dayName} ${dayNumber} de ${monthName}`;
};

export const useAppointmentForm = (
  appointmentToEdit?: Appointment | null,
  onSuccess?: () => void
) => {
  const { addAppointment, updateAppointment, cancelAppointment } =
    useAppointments();
  const { patients } = usePatients();
  const { services } = useServices();

  // 3. LÓGICA DE FECHA BASE (Crucial para editar)
  // Si editamos, la base es la fecha de la cita. Si es nueva, es Hoy.
  const baseDate = useMemo(() => {
    if (appointmentToEdit) {
      return new Date(appointmentToEdit.scheduledStart);
    }
    return new Date();
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

  // --- CONSULTAR DISPONIBILIDAD AL BACKEND ---
  useEffect(() => {
    let isActive = true;

    const dateStr = toLocalISOString(baseDate);

    const fetchAvailability = async () => {
      setLoadingSlots(true);
      try {
        const excludeId = appointmentToEdit?.id;

        const slots = await appointmentRepo.getAvailability(
          dateStr,
          currentDuration,
          excludeId // <--- Enviamos el ID para que el backend lo ignore
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

    const mappedSlots = allSlots.map((time) => {
      // 5. Usamos la fecha base correcta para calcular el timestamp exacto de este slot
      const slotStart = getTimestampForTime(baseDate, time);

      // 6. Lógica de "Ya pasó": Comparamos el timestamp del slot con AHORA mismo
      const isPast = slotStart < now.getTime();

      const isAvailableInBackend = availableSlotsFromApi.includes(time);
      const isMyOriginalTime = appointmentToEdit?.selectedTime === time;

      return {
        time,
        available: !isPast && (isAvailableInBackend || isMyOriginalTime),
        isPast,
      };
    });

    // Filtramos visualmente lo pasado y cortamos desde el primero disponible
    const futureSlots = mappedSlots.filter((slot) => !slot.isPast);
    const firstAvailableIndex = futureSlots.findIndex((slot) => slot.available);

    if (firstAvailableIndex === -1) return [];
    return futureSlots.slice(firstAvailableIndex);
  }, [availableSlotsFromApi, baseDate, appointmentToEdit]);

  // --- AUTO-SELECCIÓN ---
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
      // 7. USO DEL HELPER MANUAL PARA EL TÍTULO
      const dateObj = new Date(baseDate);
      const formattedDate = toSpanishDateString(dateObj);

      setFormState((prev) => ({
        ...prev,
        date: formattedDate,
        patientName: "",
        duration: null as any,
        selectedTime: "",
      }));
    }
  }, [appointmentToEdit, baseDate]);

  // --- CÁLCULO FINANCIERO (UÑAS 100% PARA ANAMI) ---
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
      formState.selectedServiceIds.forEach((id) => {
        const service = services.find((s) => s.id === id);
        if (service) currentTotal += service.price;
      });
    }

    let anami = 0;
    let hotel = 0;

    if (formState.serviceMode === "hotel") {
      const hotelFromMassage = Math.round(massagePrice * 0.4);
      hotel = hotelFromMassage;
      anami = massagePrice - hotelFromMassage + nailsPrice;
    } else {
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
      facialType: "no",
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

  // Stubs para compatibilidad de interfaz
  const setIsHotelService = (val: boolean) => {};

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
        "El horario seleccionado choca con otra cita o ya pasó."
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

      // 8. GUARDAR USANDO LA FECHA BASE CORRECTA
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
      // Al resetear, volvemos a HOY
      const now = new Date();
      const formattedDate = toSpanishDateString(now);

      setFormState((prev) => ({
        ...prev,
        date: formattedDate,
        patientName: "",
        patientId: undefined,
        duration: null as any,
        selectedServiceId: undefined,
        selectedServiceIds: [],
        hasNailCut: false,
        facialType: "no",
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
      setIsHotelService,
      saveAppointment,
      handleDelete,
    },
  };
};
