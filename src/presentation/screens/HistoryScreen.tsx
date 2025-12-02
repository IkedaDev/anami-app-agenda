import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useAppointments } from "../../core/context/AppointmentContext";
import { COLORS } from "../../core/theme/colors";
import { Appointment } from "../../domain/models/appointment";

interface HistoryScreenProps {
  onEdit: (appointment: Appointment) => void;
}

export default function HistoryScreen({ onEdit }: HistoryScreenProps) {
  const { appointments } = useAppointments();

  // Estado para controlar el filtro: 'today' | 'month' | 'all'
  const [viewMode, setViewMode] = useState<"today" | "month" | "all">("today");

  // Función auxiliar para validar si es hoy
  const isToday = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Función auxiliar para validar si es el mes actual
  const isCurrentMonth = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    return (
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // 1. FILTRADO DE DATOS
  const filteredAppointments = useMemo(() => {
    if (viewMode === "all") {
      return appointments;
    }
    if (viewMode === "month") {
      return appointments.filter((appt) => isCurrentMonth(appt.createdAt));
    }
    // Por defecto 'today'
    return appointments.filter((appt) => isToday(appt.createdAt));
  }, [appointments, viewMode]);

  // 2. CÁLCULOS DE RESUMEN (Basado en la lista filtrada)
  const stats = useMemo(() => {
    const hotelAppointments = filteredAppointments.filter(
      (appt) => appt.isHotelService
    );
    const hotelStats = hotelAppointments.reduce(
      (acc, curr) => ({
        total: acc.total + curr.total,
        anami: acc.anami + curr.anamiShare,
        hotel: acc.hotel + curr.hotelShare,
      }),
      { total: 0, anami: 0, hotel: 0 }
    );

    const totalDay = filteredAppointments.reduce(
      (sum, curr) => sum + curr.total,
      0
    );

    return { ...hotelStats, totalGeneral: totalDay };
  }, [filteredAppointments]);

  const renderItem = ({ item }: { item: Appointment }) => {
    const editable = isToday(item.createdAt);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.patientName}>{item.patientName}</Text>
            <Text style={styles.date}>{item.date}</Text>
          </View>

          {editable && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => onEdit(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.detailsRow}>
          <Text style={styles.detailText}>Masaje {item.duration} min</Text>
          {item.hasNailCut && <Text style={styles.detailText}>• Uñas</Text>}
          {item.facialType !== "no" && (
            <Text style={styles.detailText}>• Facial {item.facialType}</Text>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ${item.total.toLocaleString("es-CL")}
            </Text>
          </View>

          {item.isHotelService ? (
            <View style={styles.hotelTag}>
              <Text style={styles.hotelTagText}>Hotel</Text>
            </View>
          ) : (
            <View style={styles.anamiTag}>
              <Text style={styles.anamiTagText}>Particular</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const getSummaryTitle = () => {
    switch (viewMode) {
      case "today":
        return "Resumen del Día (Solo Hotel)";
      case "month":
        return "Resumen del Mes (Solo Hotel)";
      case "all":
        return "Resumen Histórico (Solo Hotel)";
    }
  };

  const ListHeader = () => (
    <View>
      {/* SELECTOR DE VISTA */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            viewMode === "today" && styles.filterBtnActive,
          ]}
          onPress={() => setViewMode("today")}
        >
          <Text
            style={[
              styles.filterText,
              viewMode === "today" && styles.filterTextActive,
            ]}
          >
            Hoy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            viewMode === "month" && styles.filterBtnActive,
          ]}
          onPress={() => setViewMode("month")}
        >
          <Text
            style={[
              styles.filterText,
              viewMode === "month" && styles.filterTextActive,
            ]}
          >
            Mes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            viewMode === "all" && styles.filterBtnActive,
          ]}
          onPress={() => setViewMode("all")}
        >
          <Text
            style={[
              styles.filterText,
              viewMode === "all" && styles.filterTextActive,
            ]}
          >
            Todo
          </Text>
        </TouchableOpacity>
      </View>

      {/* TARJETA DE RESUMEN */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryHeaderTitle}>{getSummaryTitle()}</Text>

        <View style={styles.summaryRowMain}>
          <Text style={styles.summaryLabelMain}>Total Recaudado</Text>
          <Text style={styles.summaryValueMain}>
            ${stats.total.toLocaleString("es-CL")}
          </Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summarySplit}>
          <View style={styles.splitItem}>
            <Text style={[styles.splitLabel, { color: COLORS.anami }]}>
              Anami (60%)
            </Text>
            <Text style={styles.splitValue}>
              ${stats.anami.toLocaleString("es-CL")}
            </Text>
          </View>
          <View style={[styles.verticalDivider]} />
          <View style={styles.splitItem}>
            <Text style={[styles.splitLabel, { color: COLORS.hotel }]}>
              Hotel (40%)
            </Text>
            <Text style={styles.splitValue}>
              ${stats.hotel.toLocaleString("es-CL")}
            </Text>
          </View>
        </View>

        <View style={[styles.summaryDivider, { marginTop: 15 }]} />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 12, color: COLORS.textLight }}>
            Total General (Incl. Particulares)
          </Text>
          <Text
            style={{ fontSize: 14, fontWeight: "700", color: COLORS.textMain }}
          >
            ${stats.totalGeneral.toLocaleString("es-CL")}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Historial</Text>
          <Text style={styles.subtitle}>
            {filteredAppointments.length}{" "}
            {filteredAppointments.length === 1 ? "Cita" : "Citas"}
          </Text>
        </View>

        <FlatList
          data={filteredAppointments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No hay citas para este periodo.
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === "android" ? 30 : 0,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "300",
    color: COLORS.textMain,
  },
  subtitle: {
    color: COLORS.textLight,
    marginTop: 4,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  filterBtnActive: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textLight,
  },
  filterTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  summaryCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  summaryHeaderTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textLight,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 15,
    textAlign: "center",
  },
  summaryRowMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryLabelMain: {
    fontSize: 18,
    fontWeight: "500",
    color: COLORS.textMain,
  },
  summaryValueMain: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textMain,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 12,
  },
  summarySplit: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  splitItem: {
    flex: 1,
    alignItems: "center",
  },
  verticalDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#F0F0F0",
  },
  splitLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  splitValue: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textMain,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  patientName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textMain,
  },
  date: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  editButton: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  editButtonText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
  },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 12,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    textTransform: "uppercase",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
  },
  hotelTag: {
    backgroundColor: COLORS.hotel,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 50,
  },
  hotelTagText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  anamiTag: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 50,
  },
  anamiTagText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    color: COLORS.textLight,
    fontSize: 16,
  },
});
