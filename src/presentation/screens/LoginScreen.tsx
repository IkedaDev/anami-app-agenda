import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context"; // <--- 1. IMPORTAR ESTO
import { COLORS } from "../../core/theme/colors";
import { useAuth } from "../../core/context/AuthContext";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Faltan datos", "Por favor ingresa correo y contraseña.");
      return;
    }

    try {
      await login(email, password);
    } catch (error) {
      Alert.alert(
        "Error de acceso",
        "Credenciales incorrectas o error de conexión."
      );
    }
  };

  return (
    // 2. ENVOLVER TODO EN SAFE AREA VIEW
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.content}>
          {/* LOGO Y TITULO */}
          <View style={styles.headerContainer}>
            <Image
              source={require("../../../assets/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Anami Agenda</Text>
            <Text style={styles.subtitle}>
              Inicia sesión para gestionar citas
            </Text>
          </View>

          {/* FORMULARIO */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
              <TextInput
                style={styles.input}
                placeholder="admin@anami.cl"
                placeholderTextColor="#B0A8A6"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONTRASEÑA</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#B0A8A6"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.loginButtonText}>INGRESAR</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Desarrollado por IkedaDev</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Nuevo estilo para el contenedor seguro
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    borderRadius: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "300",
    color: COLORS.textMain,
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 8,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: COLORS.textMain,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 50,
    alignItems: "center",
    marginTop: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: COLORS.textLight,
    shadowOpacity: 0,
  },
  loginButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    color: COLORS.textLight,
    fontSize: 12,
    opacity: 0.5,
  },
});
