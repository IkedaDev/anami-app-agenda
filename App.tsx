import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/core/context/AuthContext";
import { RootNavigator } from "./src/presentation/navigation/RootNavigator";
import { ServiceProvider } from "./src/core/context/ServiceContext";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ServiceProvider>
          <RootNavigator />
        </ServiceProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
