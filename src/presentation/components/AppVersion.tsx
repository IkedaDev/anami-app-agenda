import React, { useRef } from "react";
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import Constants from "expo-constants";
import { COLORS } from "../../core/theme/colors";

export const AppVersion = () => {
  const { version } = Constants.expoConfig || {};
  const { commitHash, buildNumber } = Constants.expoConfig?.extra || {};
  const fullVersionString = `v${version} • Build ${buildNumber} (${commitHash})`;

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(fullVersionString);

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
        <Text style={styles.toastText}>Copiado</Text>
      </Animated.View>

      <TouchableOpacity
        onPress={copyToClipboard}
        activeOpacity={0.6}
        style={styles.container}
      >
        <Text style={styles.versionText}>{fullVersionString}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  toast: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  toastText: {
    color: COLORS.bg,
    fontSize: 11,
    fontWeight: "500",
  },
  container: {
    paddingVertical: 0,
  },
  versionText: {
    fontSize: 10,
    color: COLORS.textLight,
    fontWeight: "400",
  },
});
