import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { COLORS } from "../../core/theme/colors";
import { useAppointmentForm } from "../hooks/useAppointmentForm";
import { OptionButton } from "../components/OptionButton";
import { SectionTitle } from "../components/SectionTitle";
import {
  Appointment,
  PARTICULAR_SERVICES,
} from "../../domain/models/appointment";

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
    actions,
  } = useAppointmentForm(appointmentToEdit, onSuccess);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isEditing ? "Editar Cita" : "Nueva Cita"}
          </Text>
          <Text style={styles.headerDate}>{formState.date}</Text>
        </View>

        <View style={styles.card}>
          {/* SELECTOR DE MODO (TABS) */}
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

          {/* PACIENTE */}
          <View style={[styles.inputGroup, { zIndex: 100 }]}>
            <Text style={styles.label}>Paciente</Text>
            <View>
              <TextInput
                style={styles.input}
                placeholder="Nombre del paciente"
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

          {/* TIME PICKER */}
          <View style={styles.inputGroup}>
            <SectionTitle title="Hora de Inicio" />
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
          </View>

          {/* --- FORMULARIO DINÁMICO SEGÚN MODO --- */}

          {formState.serviceMode === "hotel" ? (
            <>
              {/* FORMULARIO HOTEL (ANTIGUO) */}
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
                <SectionTitle title="Corte de Uñas" />
                <View style={styles.row}>
                  <OptionButton
                    label="No"
                    selected={!formState.hasNailCut}
                    onPress={() => actions.setHasNailCut(false)}
                  />
                  <OptionButton
                    label="Sí (+$5.000)"
                    selected={formState.hasNailCut}
                    onPress={() => actions.setHasNailCut(true)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <SectionTitle title="Limpieza Facial" />
                <View style={styles.row}>
                  <OptionButton
                    label="No"
                    selected={formState.facialType === "no"}
                    onPress={() => actions.setFacialType("no")}
                  />
                  <OptionButton
                    label="Hombre"
                    selected={formState.facialType === "hombre"}
                    onPress={() => actions.setFacialType("hombre")}
                  />
                  <OptionButton
                    label="Mujer"
                    selected={formState.facialType === "mujer"}
                    onPress={() => actions.setFacialType("mujer")}
                  />
                </View>
              </View>
            </>
          ) : (
            <>
              {/* FORMULARIO PARTICULAR (ACTUALIZADO PARA MULTI-SELECCIÓN) */}
              <View style={styles.inputGroup}>
                <SectionTitle title="Servicios Particulares (Selección Múltiple)" />
                <View style={styles.servicesGrid}>
                  {PARTICULAR_SERVICES.map((service) => {
                    // CAMBIO: Verificamos si el ID está incluido en el array de seleccionados
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
                        onPress={() => actions.toggleService(service.id)} // CAMBIO: Usamos toggleService
                      >
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
                          ${service.price.toLocaleString("es-CL")} •{" "}
                          {service.duration}m
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          )}
        </View>

        {/* RESUMEN FINANCIERO */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Resumen Financiero</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Servicio</Text>
            <Text style={styles.summaryValue}>
              ${financialSummary.total.toLocaleString("es-CL")}
            </Text>
          </View>

          {/* Desglose solo si es hotel */}
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
              <View style={styles.divider} />
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
          style={[styles.saveButton, isEditing && styles.updateButton]}
          onPress={actions.saveAppointment}
        >
          <Text style={styles.saveButtonText}>
            {isEditing ? "Actualizar Cita" : "Registrar Cita"}
          </Text>
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity style={styles.cancelButton} onPress={onSuccess}>
            <Text style={styles.cancelButtonText}>Cancelar Edición</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === "android" ? 30 : 0,
  },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20, marginTop: 10 },
  headerTitle: {
    fontSize: 28,
    fontWeight: "300",
    color: COLORS.textMain,
    letterSpacing: -0.5,
  },
  headerDate: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 5,
  },
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

  // TABS DE MODO
  modeTabs: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  modeTabActive: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeTabText: { fontSize: 14, fontWeight: "500", color: COLORS.textLight },
  modeTabTextActive: { color: COLORS.primary, fontWeight: "700" },

  inputGroup: { marginBottom: 24 },
  label: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.textMain,
  },

  timeScroll: { paddingVertical: 5, gap: 10 },
  timeChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FAFAFA",
    marginRight: 8,
  },
  timeChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeChipDisabled: {
    backgroundColor: "#F5F5F5",
    borderColor: "#EEE",
    opacity: 0.5,
  },
  timeText: { color: COLORS.textLight, fontWeight: "500" },
  timeTextSelected: { color: "#FFF", fontWeight: "700" },
  timeTextDisabled: { color: "#CCC", textDecorationLine: "line-through" },

  // GRID DE SERVICIOS PARTICULARES
  servicesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  serviceChip: {
    width: "48%",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FAFAFA",
    marginBottom: 5,
  },
  serviceChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  serviceText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMain,
    marginBottom: 4,
  },
  servicePrice: { fontSize: 12, color: COLORS.textLight },
  serviceTextSelected: { color: "#FFF" },

  suggestionsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#E0E0E0",
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
  row: { flexDirection: "row", gap: 10 },
  hotelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 0,
  },
  hotelLabel: { fontSize: 16, fontWeight: "600", color: COLORS.hotel },
  hotelSubLabel: { fontSize: 12, color: COLORS.textLight },
  summaryContainer: { marginBottom: 30 },
  summaryTitle: {
    fontSize: 18,
    color: COLORS.textMain,
    marginBottom: 15,
    fontWeight: "300",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  summaryLabel: { fontSize: 20, fontWeight: "500", color: COLORS.textMain },
  summaryValue: { fontSize: 24, fontWeight: "700", color: COLORS.textMain },
  splitBox: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  splitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  splitLabel: { fontSize: 14, fontWeight: "500" },
  splitValue: { fontSize: 16, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#EEE", marginVertical: 8 },
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
  updateButton: { backgroundColor: COLORS.hotel },
  saveButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 1,
  },
  cancelButton: { marginTop: 15, alignItems: "center", padding: 10 },
  cancelButtonText: { color: COLORS.textLight, fontSize: 16 },
});
