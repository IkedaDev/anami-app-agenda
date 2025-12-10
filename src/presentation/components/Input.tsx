import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  StyleProp,
  TextStyle,
} from "react-native";
import { COLORS } from "../../core/theme/colors";

interface InputProps extends TextInputProps {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<TextStyle>;
}

export const Input: React.FC<InputProps> = ({
  label,
  containerStyle,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor="#B0A8A6"
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 8,
    fontWeight: "600",
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
});
