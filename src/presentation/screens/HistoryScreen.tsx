import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useAppointments } from "../../core/context/AppointmentContext";
import { useServices } from "../../core/context/ServiceContext";
import { COLORS } from "../../core/theme/colors";
import { Appointment } from "../../domain/models/appointment";
import { Card } from "../components/Card";
import { isSameDay, isCurrentMonth } from "../../core/utils/date";
import { SafeAreaView } from "react-native-safe-area-context";

interface HistoryScreenProps {
  onEdit: (appointment: Appointment) => void;
}

export default function HistoryScreen({ onEdit }: HistoryScreenProps) {
  const {
    appointments,
    loadMoreAppointments,
    isLoadingMore,
    refreshAppointments,
    isLoading,
  } = useAppointments();

  const { services } = useServices();

  const [viewMode, setViewMode] = useState<"today" | "month" | "all">("today");
  const onEndReachedCalledDuringMomentum = useRef(true);

  const filteredAppointments = useMemo(() => {
    if (viewMode === "all") {
      return appointments;
    }
    if (viewMode === "month") {
      return appointments.filter((appt) => isCurrentMonth(appt.scheduledStart));
    }
    return appointments.filter((appt) => isSameDay(appt.scheduledStart));
  }, [appointments, viewMode]);

  const stats = useMemo(() => {
    const hotelAppointments = filteredAppointments.filter(
      (appt) => appt.serviceMode === "hotel"
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
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    // const editable = isSameDay(item.createdAt);
    const editable = item.createdAt >= now.getTime();
    const isHotel = item.serviceMode === "hotel";

    const getParticularDetails = () => {
      const ids = item.selectedServiceIds || [];
      if (ids.length === 0) return "Servicio sin especificar";
      return ids
        .map((id) => {
          const service = services.find((s) => s.id === id);
          return service ? service.name : "Servicio desconocido";
        })
        .join(" + ");
    };

    return (
      <Card style={styles.itemCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.patientName}>{item.patientName}</Text>
            <Text style={styles.date}>
              {item.date} • {item.selectedTime}
            </Text>
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
          {isHotel ? (
            <>
              <Text style={styles.detailText}>Masaje {item.duration} min</Text>
              {item.hasNailCut && <Text style={styles.detailText}>• Uñas</Text>}
            </>
          ) : (
            <Text style={styles.detailText}>{getParticularDetails()}</Text>
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

          {isHotel ? (
            <View style={styles.hotelTag}>
              <Text style={styles.hotelTagText}>Hotel</Text>
            </View>
          ) : (
            <View style={styles.anamiTag}>
              <Text style={styles.anamiTagText}>Particular</Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  const ListHeader = () => (
    <View>
      <View style={styles.filterContainer}>
        {(["today", "month", "all"] as const).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.filterBtn,
              viewMode === mode && styles.filterBtnActive,
            ]}
            onPress={() => setViewMode(mode)}
          >
            <Text
              style={[
                styles.filterText,
                viewMode === mode && styles.filterTextActive,
              ]}
            >
              {mode === "today" ? "Hoy" : mode === "month" ? "Mes" : "Todo"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Card style={styles.summaryCard}>
        <Text style={styles.summaryHeaderTitle}>
          {viewMode === "today"
            ? "Resumen del Día (Solo Hotel)"
            : viewMode === "month"
            ? "Resumen del Mes (Solo Hotel)"
            : "Resumen Histórico (Solo Hotel)"}
        </Text>

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
      </Card>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

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
          onEndReached={() => {
            // Solo ejecutamos si NO estamos bloqueados por el momentum
            if (
              !onEndReachedCalledDuringMomentum.current &&
              viewMode === "all"
            ) {
              loadMoreAppointments();
              onEndReachedCalledDuringMomentum.current = true; // Bloquear hasta el próximo scroll
            }
          }}
          onEndReachedThreshold={0.2}
          onMomentumScrollBegin={() => {
            onEndReachedCalledDuringMomentum.current = false;
          }}
          removeClippedSubviews={true}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refreshAppointments}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No hay citas para este periodo.
                </Text>
              </View>
            ) : null
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
  itemCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
    lineHeight: 20,
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
