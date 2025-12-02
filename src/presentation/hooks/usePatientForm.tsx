import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { Patient, PatientState } from "../../domain/models/patient";
import { usePatients } from "../../core/context/PatientContext";

// Generador de ID simple
const generateUUID = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

export const usePatientForm = (
  patientToEdit?: Patient | null,
  onSuccess?: () => void
) => {
  const { addPatient, updatePatient } = usePatients();

  const [form, setForm] = useState<PatientState>({
    name: "",
    rut: "",
    phone: "",
    email: "",
    address: "",
  });

  // Cargar datos si es edición
  useEffect(() => {
    if (patientToEdit) {
      setForm({
        name: patientToEdit.name,
        rut: patientToEdit.rut || "",
        phone: patientToEdit.phone || "",
        email: patientToEdit.email || "",
        address: patientToEdit.address || "",
      });
    } else {
      resetForm();
    }
  }, [patientToEdit]);

  const handleChange = (field: keyof PatientState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      rut: "",
      phone: "",
      email: "",
      address: "",
    });
  };

  const savePatient = () => {
    // Validación: Solo Nombre es obligatorio
    if (!form.name.trim()) {
      Alert.alert("Error", "El nombre del paciente es obligatorio.");
      return;
    }

    const patientData = {
      name: form.name,
      rut: form.rut,
      phone: form.phone,
      email: form.email,
      address: form.address,
    };

    if (patientToEdit) {
      updatePatient({
        ...patientData,
        id: patientToEdit.id,
        createdAt: patientToEdit.createdAt,
      });
      Alert.alert("Actualizado", "Cliente actualizado correctamente.", [
        { text: "OK", onPress: onSuccess },
      ]);
    } else {
      addPatient({
        ...patientData,
        id: generateUUID(),
        createdAt: Date.now(),
      });
      Alert.alert("Guardado", "Cliente registrado exitosamente.", [
        {
          text: "OK",
          onPress: () => {
            resetForm();
            onSuccess?.();
          },
        },
      ]);
    }
  };

  return {
    form,
    isEditing: !!patientToEdit,
    handleChange,
    savePatient,
  };
};
