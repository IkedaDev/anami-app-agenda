import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Modal, // Necesario para iOS
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { COLORS } from "../../core/theme/colors";
import { useAppointmentForm } from "../hooks/useAppointmentForm";
import { useServices } from "../../core/context/ServiceContext";
import { OptionButton } from "../components/OptionButton";
import { SectionTitle } from "../components/SectionTitle";
import { Appointment } from "../../domain/models/appointment";
import { Card } from "../components/Card";

interface AppointmentScreenProps {
  appointmentToEdit?: Appointment | null;
  onSuccess?: () => void;
}

export default function AppointmentScreen({
  appointmentToEdit,
  onSuccess,
}: AppointmentScreenProps) {
  const {
    formState,
    financialSummary,
    isEditing,
    suggestions,
    timeSlots,
    isSaving,
    loadingSlots,
    actions,
    dateObject,
  } = useAppointmentForm(appointmentToEdit, onSuccess);

  const { services, isLoading: isLoadingServices } = useServices();

  // Estados para el selector de fecha
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  useEffect(() => {
    if (dateObject) setTempDate(dateObject);
  }, [dateObject, showDatePicker]);

  const handlePlatformDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (event.type === "set" && selectedDate)
        actions.changeDate(selectedDate);
    } else if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const confirmIOSDate = () => {
    actions.changeDate(tempDate);
    setShowDatePicker(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* --- HEADER --- */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isEditing ? "Editar Cita" : "Nueva Cita"}
          </Text>

          <TouchableOpacity
            style={styles.dateSelector}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dateIcon}>🗓️</Text>
            <Text style={styles.dateSelectorText}>{formState.date}</Text>
            {/* <Text style={styles.editHint}>Editar</Text> */}
          </TouchableOpacity>
        </View>

        {/* --- TARJETA 1: CONFIGURACIÓN DEL SERVICIO --- */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Configuración del Servicio</Text>
          </View>

          {/* Selector de Modo */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[
                styles.modeTab,
                formState.serviceMode === "hotel" && styles.modeTabActive,
              ]}
              onPress={() => actions.setServiceMode("hotel")}
            >
              <Text
                style={[
                  styles.modeTabText,
                  formState.serviceMode === "hotel" && styles.modeTabTextActive,
                ]}
              >
                Hotel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeTab,
                formState.serviceMode === "particular" && styles.modeTabActive,
              ]}
              onPress={() => actions.setServiceMode("particular")}
            >
              <Text
                style={[
                  styles.modeTabText,
                  formState.serviceMode === "particular" &&
                    styles.modeTabTextActive,
                ]}
              >
                Particular
              </Text>
            </TouchableOpacity>
          </View>

          {/* Lógica de Servicios */}
          {formState.serviceMode === "hotel" ? (
            <View style={styles.sectionContainer}>
              <View style={styles.inputGroup}>
                <SectionTitle title="Masaje Express" />
                <View style={styles.row}>
                  <OptionButton
                    label="20 min"
                    selected={formState.duration === 20}
                    onPress={() => actions.setDuration(20)}
                  />
                  <OptionButton
                    label="40 min"
                    selected={formState.duration === 40}
                    onPress={() => actions.setDuration(40)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <SectionTitle title="Adicionales" />
                <View style={styles.row}>
                  <OptionButton
                    label="Sin corte"
                    selected={!formState.hasNailCut}
                    onPress={() => actions.setHasNailCut(false)}
                  />
                  <OptionButton
                    label="Corte Uñas (+$5.000)"
                    selected={formState.hasNailCut}
                    onPress={() => actions.setHasNailCut(true)}
                  />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.sectionContainer}>
              <SectionTitle title="Selecciona Servicios" />
              {isLoadingServices ? (
                <ActivityIndicator
                  size="large"
                  color={COLORS.primary}
                  style={{ margin: 20 }}
                />
              ) : (
                <View style={styles.servicesGrid}>
                  {services.map((service) => {
                    const isSelected = formState.selectedServiceIds.includes(
                      service.id
                    );
                    return (
                      <TouchableOpacity
                        key={service.id}
                        style={[
                          styles.serviceChip,
                          isSelected && styles.serviceChipSelected,
                        ]}
                        onPress={() => actions.toggleService(service.id)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.serviceText,
                              isSelected && styles.serviceTextSelected,
                            ]}
                          >
                            {service.name}
                          </Text>
                          <Text
                            style={[
                              styles.servicePrice,
                              isSelected && styles.serviceTextSelected,
                            ]}
                          >
                            {service.duration} min
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.servicePriceBold,
                            isSelected && styles.serviceTextSelected,
                          ]}
                        >
                          ${service.price.toLocaleString("es-CL")}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </Card>

        {/* --- TARJETA 2: DETALLES DE LA CITA --- */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Detalles del Agendamiento</Text>
          </View>

          {/* Input Paciente */}
          <View style={[styles.inputGroup, { zIndex: 100 }]}>
            <Text style={styles.label}>Paciente</Text>
            <View>
              <TextInput
                style={styles.input}
                placeholder="Nombre completo"
                placeholderTextColor="#B0A8A6"
                value={formState.patientName}
                onChangeText={actions.setPatientName}
              />
              {suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {suggestions.map((patient) => (
                    <TouchableOpacity
                      key={patient.id}
                      style={styles.suggestionItem}
                      onPress={() => actions.selectPatient(patient)}
                    >
                      <Text style={styles.suggestionText}>{patient.name}</Text>
                      {patient.email ? (
                        <Text style={styles.suggestionSubText}>
                          {patient.email}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Time Picker - Lógica condicional elegante */}
          <View style={styles.inputGroup}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <SectionTitle title="Horarios Disponibles" />
              {loadingSlots && (
                <ActivityIndicator size="small" color={COLORS.primary} />
              )}
            </View>

            {formState.duration === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>⏳</Text>
                <Text style={styles.emptyStateText}>
                  Selecciona un servicio arriba para ver los horarios
                  disponibles.
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.timeScroll}
              >
                {timeSlots.map((slot) => {
                  const isSelected = formState.selectedTime === slot.time;
                  const isDisabled = !slot.available && !isSelected;
                  return (
                    <TouchableOpacity
                      key={slot.time}
                      disabled={isDisabled}
                      style={[
                        styles.timeChip,
                        isSelected && styles.timeChipSelected,
                        isDisabled && styles.timeChipDisabled,
                      ]}
                      onPress={() => actions.setSelectedTime(slot.time)}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          isSelected && styles.timeTextSelected,
                          isDisabled && styles.timeTextDisabled,
                        ]}
                      >
                        {slot.time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </Card>

        {/* --- RESUMEN Y ACCIONES --- */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total a Pagar</Text>
            <Text style={styles.summaryValue}>
              ${financialSummary.total.toLocaleString("es-CL")}
            </Text>
          </View>

          {formState.serviceMode === "hotel" && (
            <View style={styles.splitBox}>
              <View style={styles.splitRow}>
                <Text style={[styles.splitLabel, { color: COLORS.anami }]}>
                  Anami (60%)
                </Text>
                <Text style={[styles.splitValue, { color: COLORS.anami }]}>
                  ${financialSummary.anamiShare.toLocaleString("es-CL")}
                </Text>
              </View>
              <View style={styles.splitDivider} />
              <View style={styles.splitRow}>
                <Text style={[styles.splitLabel, { color: COLORS.hotel }]}>
                  Hotel (40%)
                </Text>
                <Text style={[styles.splitValue, { color: COLORS.hotel }]}>
                  ${financialSummary.hotelShare.toLocaleString("es-CL")}
                </Text>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            isEditing && styles.updateButton,
            isSaving && { opacity: 0.7 },
          ]}
          onPress={actions.saveAppointment}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditing ? "Guardar Cambios" : "Confirmar Cita"}
            </Text>
          )}
        </TouchableOpacity>

        {isEditing && !isSaving && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={actions.handleDelete}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteButtonText}>Eliminar Cita</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onSuccess}>
              <Text style={styles.cancelButtonText}>Cancelar edición</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* --- MODALES --- */}
      {Platform.OS === "android" && showDatePicker && (
        <DateTimePicker
          value={dateObject || new Date()}
          mode="date"
          display="default"
          onChange={handlePlatformDateChange}
          minimumDate={new Date(2024, 0, 1)}
        />
      )}

      {Platform.OS === "ios" && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Fecha</Text>
                <TouchableOpacity onPress={confirmIOSDate}>
                  <Text style={styles.modalConfirmText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
              <View
                style={{
                  width: "100%",
                  alignItems: "center",
                  backgroundColor: "white",
                }}
              >
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={handlePlatformDateChange}
                  minimumDate={new Date(2024, 0, 1)}
                  locale="es-ES"
                  textColor="black"
                  style={{
                    height: 210,
                    width: "100%",
                    backgroundColor: "white",
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA", // Fondo más moderno
    paddingTop: Platform.OS === "android" ? 30 : 0,
  },
  scrollContent: { padding: 20, paddingBottom: 50 },

  // Header
  header: { marginBottom: 20, marginTop: 10 },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.textMain,
    marginBottom: 8,
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateIcon: { fontSize: 16, marginRight: 8 },
  dateSelectorText: {
    fontSize: 16,
    color: COLORS.textMain,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  editHint: {
    marginLeft: 8,
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
  },

  // Cards
  card: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
  },
  cardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingBottom: 15,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textMain,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionContainer: { marginTop: 5 },

  // Mode Tabs
  modeTabs: {
    flexDirection: "row",
    backgroundColor: "#F5F6F8",
    borderRadius: 16,
    padding: 5,
    marginBottom: 20,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  modeTabActive: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  modeTabText: { fontSize: 14, fontWeight: "600", color: COLORS.textLight },
  modeTabTextActive: { color: COLORS.primary, fontWeight: "700" },

  // Inputs
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 14,
    color: COLORS.textMain,
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#E1E4E8",
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: COLORS.textMain,
  },

  // Services
  servicesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  serviceChip: {
    width: "48%", // 2 Columnas
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEE",
    backgroundColor: "#FAFAFA",
    marginBottom: 6,
    justifyContent: "space-between",
  },
  serviceChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  serviceText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMain,
    marginBottom: 4,
  },
  servicePrice: { fontSize: 12, color: COLORS.textLight },
  servicePriceBold: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textMain,
    marginTop: 4,
  },
  serviceTextSelected: { color: "#FFF" },

  // Time Picker
  timeScroll: { paddingVertical: 5, gap: 8 },
  timeChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFF",
    marginRight: 6,
  },
  timeChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeChipDisabled: {
    backgroundColor: "#F9F9F9",
    borderColor: "#F0F0F0",
    opacity: 0.4,
  },
  timeText: { color: COLORS.textMain, fontWeight: "600", fontSize: 14 },
  timeTextSelected: { color: "#FFF", fontWeight: "700" },
  timeTextDisabled: { color: "#CCC", textDecorationLine: "line-through" },

  // Empty State
  emptyState: {
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    borderStyle: "dashed",
  },
  emptyStateIcon: { fontSize: 24, marginBottom: 8 },
  emptyStateText: {
    color: COLORS.textLight,
    textAlign: "center",
    fontSize: 14,
  },

  // Suggestions
  suggestionsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#EEE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
  },
  suggestionItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  suggestionText: { fontSize: 16, color: COLORS.textMain },
  suggestionSubText: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },

  // Common
  row: { flexDirection: "row", gap: 10 },
  divider: { height: 1, backgroundColor: "#EFEFEF", marginVertical: 20 },

  // Summary
  summaryContainer: { marginBottom: 30, paddingHorizontal: 10 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  summaryLabel: { fontSize: 18, fontWeight: "600", color: COLORS.textLight },
  summaryValue: { fontSize: 26, fontWeight: "700", color: COLORS.textMain },
  splitBox: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E1E4E8",
  },
  splitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  splitLabel: { fontSize: 14, fontWeight: "500" },
  splitValue: { fontSize: 16, fontWeight: "700" },
  splitDivider: { height: 1, backgroundColor: "#EEE", marginVertical: 8 },

  // Buttons
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  updateButton: { backgroundColor: COLORS.hotel },
  saveButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  actionsContainer: { marginTop: 20, gap: 10 },
  deleteButton: {
    backgroundColor: "#FFF",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFE5E5",
  },
  deleteButtonText: { color: "#FF6B6B", fontSize: 16, fontWeight: "700" },
  cancelButton: { alignItems: "center", padding: 10 },
  cancelButtonText: {
    color: COLORS.textLight,
    fontSize: 15,
    fontWeight: "500",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    width: "100%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    backgroundColor: "#FAFAFA",
  },
  modalTitle: { fontWeight: "700", fontSize: 16, color: COLORS.textMain },
  modalCancelText: { color: COLORS.textLight, fontSize: 16 },
  modalConfirmText: { color: COLORS.primary, fontSize: 16, fontWeight: "600" },
});
