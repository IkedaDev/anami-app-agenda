import React from "react";
import { Text, StyleSheet } from "react-native";
import { COLORS } from "../../core/theme/colors";

interface SectionTitleProps {
  title: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ title }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    color: COLORS.textMain,
    marginBottom: 12,
    fontWeight: "400",
  },
});
