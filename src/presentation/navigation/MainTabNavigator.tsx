import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Contextos
import { AppointmentProvider } from "../../core/context/AppointmentContext";
import { PatientProvider } from "../../core/context/PatientContext";

// Pantallas
import AppointmentScreen from "../screens/AppointmentScreen";
import HistoryScreen from "../screens/HistoryScreen";
import PatientsScreen from "../screens/PatientsScreen";

// Modelos y Tema
import { COLORS } from "../../core/theme/colors";
import { Appointment } from "../../domain/models/appointment";

type ScreenType = "add" | "history" | "patients";

export const MainTabNavigator = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("add");
  const [appointmentToEdit, setAppointmentToEdit] =
    useState<Appointment | null>(null);

  const handleEditRequest = (appointment: Appointment) => {
    setAppointmentToEdit(appointment);
    setCurrentScreen("add");
  };

  const handleEditComplete = () => {
    setAppointmentToEdit(null);
    setCurrentScreen("history");
  };

  const handleTabPress = (screen: ScreenType) => {
    if (screen === "add") setAppointmentToEdit(null);
    setCurrentScreen(screen);
  };

  return (
    // Proveedores de Datos (Solo viven dentro de la sesión)
    <AppointmentProvider>
      <PatientProvider>
        <View style={styles.container}>
          <StatusBar barStyle="dark-content" />

          <View style={styles.content}>
            {currentScreen === "add" ? (
              <AppointmentScreen
                appointmentToEdit={appointmentToEdit}
                onSuccess={handleEditComplete}
              />
            ) : currentScreen === "history" ? (
              <HistoryScreen onEdit={handleEditRequest} />
            ) : (
              <PatientsScreen />
            )}
          </View>

          <SafeAreaView edges={["bottom"]} style={styles.navBarContainer}>
            <View style={styles.navBarContent}>
              <TabButton
                label="Agendar"
                icon="+"
                isActive={currentScreen === "add"}
                onPress={() => handleTabPress("add")}
              />
              <View style={styles.separator} />
              <TabButton
                label="Historial"
                icon="H"
                isActive={currentScreen === "history"}
                onPress={() => handleTabPress("history")}
              />
              <View style={styles.separator} />
              <TabButton
                label="Clientes"
                icon="C"
                isActive={currentScreen === "patients"}
                onPress={() => handleTabPress("patients")}
              />
            </View>
          </SafeAreaView>
        </View>
      </PatientProvider>
    </AppointmentProvider>
  );
};

// Sub-componente para limpiar el código repetitivo
const TabButton = ({
  label,
  icon,
  isActive,
  onPress,
}: {
  label: string;
  icon: string;
  isActive: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={styles.navItem}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.iconPlaceholder, isActive && styles.iconActive]}>
      <Text style={[styles.iconText, isActive && styles.textActive]}>
        {icon}
      </Text>
    </View>
    <Text style={[styles.navText, isActive && styles.textActive]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { flex: 1 },
  navBarContainer: {
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 10,
  },
  navBarContent: {
    flexDirection: "row",
    height: 60,
    alignItems: "center",
    justifyContent: "space-around",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  iconPlaceholder: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    borderRadius: 12,
  },
  iconActive: { backgroundColor: "rgba(196, 127, 107, 0.1)" },
  iconText: { fontSize: 16, color: COLORS.textLight, fontWeight: "bold" },
  navText: {
    fontSize: 10,
    color: COLORS.textLight,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textActive: { color: COLORS.primary, fontWeight: "700" },
  separator: { width: 1, height: "40%", backgroundColor: "#EEE" },
});
