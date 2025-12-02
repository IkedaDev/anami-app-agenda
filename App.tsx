import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { AppointmentProvider } from "./src/core/context/AppointmentContext";
import { PatientProvider } from "./src/core/context/PatientContext"; // Importar nuevo contexto
import AppointmentScreen from "./src/presentation/screens/AppointmentScreen";
import HistoryScreen from "./src/presentation/screens/HistoryScreen";
import PatientsScreen from "./src/presentation/screens/PatientsScreen"; // Importar nueva pantalla
import { COLORS } from "./src/core/theme/colors";
import { Appointment } from "./src/domain/models/appointment";

type ScreenType = "add" | "history" | "patients"; // Agregar tipo

export default function App() {
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
    <AppointmentProvider>
      <PatientProvider>
        <View style={styles.container}>
          <StatusBar style="dark" />

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

          <SafeAreaView style={styles.navBarContainer}>
            <View style={styles.navBarContent}>
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => handleTabPress("add")}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconPlaceholder,
                    currentScreen === "add" && styles.iconActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.iconText,
                      currentScreen === "add" && styles.textActive,
                    ]}
                  >
                    +
                  </Text>
                </View>
                <Text
                  style={[
                    styles.navText,
                    currentScreen === "add" && styles.textActive,
                  ]}
                >
                  Agendar
                </Text>
              </TouchableOpacity>

              <View style={styles.separator} />

              <TouchableOpacity
                style={styles.navItem}
                onPress={() => handleTabPress("history")}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconPlaceholder,
                    currentScreen === "history" && styles.iconActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.iconText,
                      currentScreen === "history" && styles.textActive,
                    ]}
                  >
                    H
                  </Text>
                </View>
                <Text
                  style={[
                    styles.navText,
                    currentScreen === "history" && styles.textActive,
                  ]}
                >
                  Historial
                </Text>
              </TouchableOpacity>

              <View style={styles.separator} />

              {/* NUEVO BOTÓN: CLIENTES */}
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => handleTabPress("patients")}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconPlaceholder,
                    currentScreen === "patients" && styles.iconActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.iconText,
                      currentScreen === "patients" && styles.textActive,
                    ]}
                  >
                    C
                  </Text>
                </View>
                <Text
                  style={[
                    styles.navText,
                    currentScreen === "patients" && styles.textActive,
                  ]}
                >
                  Clientes
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </PatientProvider>
    </AppointmentProvider>
  );
}

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
