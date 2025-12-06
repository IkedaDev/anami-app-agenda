import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "../../core/context/AuthContext";
import { COLORS } from "../../core/theme/colors";
import LoginScreen from "../screens/LoginScreen";
import { MainTabNavigator } from "./MainTabNavigator";

export const RootNavigator = () => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return token ? <MainTabNavigator /> : <LoginScreen />;
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.bg,
  },
});
