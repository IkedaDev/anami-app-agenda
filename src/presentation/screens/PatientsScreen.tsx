import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  ScrollView,
} from "react-native";
import { COLORS } from "../../core/theme/colors";
import { usePatients } from "../../core/context/PatientContext";
import { Patient } from "../../domain/models/patient";
import { usePatientForm } from "../hooks/usePatientForm";

// --- SUB-COMPONENTE: FORMULARIO ---
const PatientForm = ({
  patientToEdit,
  onCancel,
  onSuccess,
}: {
  patientToEdit?: Patient | null;
  onCancel: () => void;
  onSuccess: () => void;
}) => {
  const { form, isEditing, handleChange, savePatient } = usePatientForm(
    patientToEdit,
    onSuccess
  );

  return (
    <ScrollView contentContainerStyle={styles.formContainer}>
      <Text style={styles.headerTitle}>
        {isEditing ? "Editar Cliente" : "Nuevo Cliente"}
      </Text>

      <View style={styles.card}>
        {/* NOMBRE (Obligatorio) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: María Pérez"
            placeholderTextColor="#B0A8A6"
            value={form.name}
            onChangeText={(text) => handleChange("name", text)}
          />
        </View>

        {/* RUT */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>RUT</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 12.345.678-9"
            placeholderTextColor="#B0A8A6"
            value={form.rut}
            onChangeText={(text) => handleChange("rut", text)}
          />
        </View>

        {/* CELULAR */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Celular</Text>
          <TextInput
            style={styles.input}
            placeholder="+56 9..."
            placeholderTextColor="#B0A8A6"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(text) => handleChange("phone", text)}
          />
        </View>

        {/* CORREO */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Correo</Text>
          <TextInput
            style={styles.input}
            placeholder="correo@ejemplo.com"
            placeholderTextColor="#B0A8A6"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(text) => handleChange("email", text)}
          />
        </View>

        {/* DIRECCIÓN */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Dirección</Text>
          <TextInput
            style={styles.input}
            placeholder="Calle, Número, Comuna"
            placeholderTextColor="#B0A8A6"
            value={form.address}
            onChangeText={(text) => handleChange("address", text)}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={savePatient}>
        <Text style={styles.saveButtonText}>
          {isEditing ? "Actualizar" : "Guardar"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <Text style={styles.cancelButtonText}>Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// --- PANTALLA PRINCIPAL DE CLIENTES ---
export default function PatientsScreen() {
  const { patients } = usePatients();
  const [view, setView] = useState<"list" | "form">("list");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setView("form");
  };

  const handleAddNew = () => {
    setSelectedPatient(null);
    setView("form");
  };

  const handleFormSuccess = () => {
    setView("list");
    setSelectedPatient(null);
  };

  const renderItem = ({ item }: { item: Patient }) => (
    <TouchableOpacity
      style={styles.patientCard}
      onPress={() => handleEdit(item)}
      activeOpacity={0.7}
    >
      <View style={styles.patientAvatar}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        {item.phone ? (
          <Text style={styles.patientDetail}>{item.phone}</Text>
        ) : null}
        {item.email ? (
          <Text style={styles.patientDetail}>{item.email}</Text>
        ) : null}
      </View>
      <Text style={styles.editIcon}>✎</Text>
    </TouchableOpacity>
  );

  if (view === "form") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
        <PatientForm
          patientToEdit={selectedPatient}
          onCancel={() => setView("list")}
          onSuccess={handleFormSuccess}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clientes</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
          <Text style={styles.addButtonText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={patients}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No tienes clientes registrados.
            </Text>
            <Text style={styles.emptySubText}>Agrega uno para comenzar.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === "android" ? 30 : 0,
  },
  formContainer: { padding: 20, paddingBottom: 100 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
    marginTop: 10,
  },
  headerTitle: { fontSize: 28, fontWeight: "300", color: COLORS.textMain },
  addButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: { color: COLORS.primary, fontWeight: "600" },
  listContent: { padding: 20, paddingBottom: 100 },

  // Card Cliente
  patientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  patientAvatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  avatarText: { fontSize: 18, fontWeight: "600", color: COLORS.primary },
  patientInfo: { flex: 1 },
  patientName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textMain,
    marginBottom: 2,
  },
  patientDetail: { fontSize: 13, color: COLORS.textLight },
  editIcon: { fontSize: 18, color: COLORS.textLight, padding: 5 },

  // Estilos Formulario
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#C47F6B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 6,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: COLORS.textMain,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 50,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 1,
  },
  cancelButton: { marginTop: 15, alignItems: "center", padding: 10 },
  cancelButtonText: { color: COLORS.textLight, fontSize: 16 },

  emptyState: { alignItems: "center", marginTop: 60 },
  emptyText: { color: COLORS.textMain, fontSize: 18, marginBottom: 5 },
  emptySubText: { color: COLORS.textLight, fontSize: 14 },
});
