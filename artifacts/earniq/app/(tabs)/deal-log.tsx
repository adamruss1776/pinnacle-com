import { Feather, Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DealCard } from "@/components/DealCard";
import { PaywallModal } from "@/components/PaywallModal";
import { SpiffCard } from "@/components/SpiffCard";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { useSubscription } from "@/lib/revenuecat";
import { formatCurrency, isThisMonth, isThisYear } from "@/utils/commission";

type FilterType = "month" | "year" | "all";

export default function DealLogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { deals, spiffs, deleteDeal, deleteSpiff } = useData();
  const { isSubscribed } = useSubscription();
  const [filter, setFilter] = useState<FilterType>("month");
  const [paywallVisible, setPaywallVisible] = useState(false);

  const filteredDeals = deals.filter((d) => {
    if (filter === "month") return isThisMonth(d.date);
    if (filter === "year") return isThisYear(d.date);
    return true;
  });

  const filteredSpiffs = spiffs.filter((s) => {
    if (filter === "month") return isThisMonth(s.date);
    if (filter === "year") return isThisYear(s.date);
    return true;
  });

  const totalDealComm = filteredDeals.reduce((s, d) => s + d.commission, 0);
  const totalSpiffs = filteredSpiffs.reduce((s, sp) => sp.amount + s, 0);

  function handleEditDeal(id: string) {
    router.push({ pathname: "/log-deal", params: { editId: id } });
  }

  function handleEditSpiff(id: string) {
    router.push({ pathname: "/log-spiff", params: { editId: id } });
  }

  function handleDeleteDeal(id: string) {
    Alert.alert("Delete Deal", "Are you sure you want to delete this deal?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteDeal(id);
        },
      },
    ]);
  }

  function handleDeleteSpiff(id: string) {
    Alert.alert("Delete Spiff", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteSpiff(id);
        },
      },
    ]);
  }

  async function handleExportCSV() {
    if (!isSubscribed) {
      Haptics.selectionAsync();
      setPaywallVisible(true);
      return;
    }
    Haptics.selectionAsync();

    const header = "Type,Date,Vehicle,Deal Type,Gross,Commission,Notes\n";
    const dealRows = filteredDeals
      .map((d) =>
        [
          "Deal",
          d.date,
          `"${(d.vehicle ?? "").replace(/"/g, '""')}"`,
          d.dealType,
          d.gross.toFixed(2),
          d.commission.toFixed(2),
          `"${(d.notes ?? "").replace(/"/g, '""')}"`,
        ].join(",")
      )
      .join("\n");
    const spiffRows = filteredSpiffs
      .map((s) =>
        [
          "Spiff",
          s.date,
          `"${(s.description ?? "").replace(/"/g, '""')}"`,
          "",
          "",
          s.amount.toFixed(2),
          "",
        ].join(",")
      )
      .join("\n");
    const csv = header + dealRows + (dealRows && spiffRows ? "\n" : "") + spiffRows;

    if (Platform.OS === "web") {
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `earniq-deals-${filter}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    try {
      const path = `${FileSystem.cacheDirectory}earniq-deals-${filter}.csv`;
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, { mimeType: "text/csv", dialogTitle: "Export Deals CSV" });
      } else {
        Alert.alert("Export unavailable", "Sharing is not available on this device.");
      }
    } catch {
      Alert.alert("Export failed", "Could not create the CSV file. Please try again.");
    }
  }

  function handleFilterPress(value: FilterType) {
    if ((value === "year" || value === "all") && !isSubscribed) {
      Haptics.selectionAsync();
      setPaywallVisible(true);
      return;
    }
    Haptics.selectionAsync();
    setFilter(value);
  }

  const TABS: { label: string; value: FilterType }[] = [
    { label: "This Month", value: "month" },
    { label: "This Year", value: "year" },
    { label: "All Time", value: "all" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Deal Log
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.surface }]}
            onPress={handleExportCSV}
          >
            <Feather name="download" size={18} color={isSubscribed ? colors.foreground : colors.mutedForeground} />
            {!isSubscribed && (
              <Ionicons name="lock-closed" size={9} color={colors.green} style={styles.lockBadge} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.surface }]}
            onPress={() => {
              if (!isSubscribed) {
                setPaywallVisible(true);
                return;
              }
              router.push("/import");
            }}
          >
            <Feather name="upload" size={18} color={isSubscribed ? colors.foreground : colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.green }]}
            onPress={() => router.push("/log-deal")}
          >
            <Ionicons name="add" size={20} color={colors.primaryForeground} />
            <Text style={[styles.addBtnText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>
              Deal
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterRow, { backgroundColor: colors.background }]}>
        {TABS.map((tab) => {
          const isProLocked = (tab.value === "year" || tab.value === "all") && !isSubscribed;
          const isActive = filter === tab.value;
          return (
            <TouchableOpacity
              key={tab.value}
              style={[
                styles.filterTab,
                isActive
                  ? { backgroundColor: colors.green }
                  : { backgroundColor: colors.surface },
              ]}
              onPress={() => handleFilterPress(tab.value)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  {
                    color: isActive
                      ? colors.primaryForeground
                      : isProLocked
                      ? colors.mutedForeground
                      : colors.mutedForeground,
                    fontFamily: "Inter_600SemiBold",
                  },
                ]}
              >
                {tab.label}
              </Text>
              {isProLocked && (
                <Ionicons name="lock-closed" size={11} color={colors.green} style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Deals
            </Text>
            <Text style={[styles.summaryValue, { color: colors.green, fontFamily: "Inter_700Bold" }]}>
              {formatCurrency(totalDealComm)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Spiffs
            </Text>
            <Text style={[styles.summaryValue, { color: colors.amber, fontFamily: "Inter_700Bold" }]}>
              {formatCurrency(totalSpiffs)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Total
            </Text>
            <Text style={[styles.summaryValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {formatCurrency(totalDealComm + totalSpiffs)}
            </Text>
          </View>
        </View>

        {/* Deal Stats Row */}
        <View style={[styles.statsRow, { gap: 12 }]}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Deal Count
            </Text>
            <Text style={[styles.statValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {filteredDeals.length}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Avg per Deal
            </Text>
            <Text style={[styles.statValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {filteredDeals.length > 0
                ? formatCurrency(totalDealComm / filteredDeals.length)
                : "—"}
            </Text>
          </View>
        </View>

        {/* Deals */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          Deals ({filteredDeals.length})
        </Text>
        {filteredDeals.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="file-text" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {filter === "month"
                ? `No deals logged this month yet`
                : "No deals for this period"}
            </Text>
            {filter === "month" && deals.length > 0 && (
              <Text style={[styles.emptyHint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Previous months are in{" "}
                <Text style={{ fontFamily: "Inter_600SemiBold" }}>This Year</Text>
                {" "}or{" "}
                <Text style={{ fontFamily: "Inter_600SemiBold" }}>All Time</Text>
              </Text>
            )}
          </View>
        ) : (
          filteredDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onDelete={handleDeleteDeal} onEdit={handleEditDeal} />
          ))
        )}

        {/* Spiffs */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold", marginTop: 16 }]}>
          Spiffs & Bonuses ({filteredSpiffs.length})
        </Text>
        {filteredSpiffs.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="zap" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {filter === "month" ? "No spiffs logged this month yet" : "No spiffs for this period"}
            </Text>
            {filter === "month" && spiffs.length > 0 && (
              <Text style={[styles.emptyHint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Previous months are in{" "}
                <Text style={{ fontFamily: "Inter_600SemiBold" }}>This Year</Text>
                {" "}or{" "}
                <Text style={{ fontFamily: "Inter_600SemiBold" }}>All Time</Text>
              </Text>
            )}
          </View>
        ) : (
          filteredSpiffs.map((spiff) => (
            <SpiffCard key={spiff.id} spiff={spiff} onDelete={handleDeleteSpiff} onEdit={handleEditSpiff} />
          ))
        )}
      </ScrollView>

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 28 },
  headerActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  lockBadge: {
    position: "absolute",
    bottom: 6,
    right: 5,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: { fontSize: 14 },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  filterTabText: { fontSize: 13 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  summaryCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryLabel: { fontSize: 12, marginBottom: 4 },
  summaryValue: { fontSize: 18 },
  divider: { width: 1, height: 36 },
  statsRow: { flexDirection: "row" },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  statLabel: { fontSize: 12, marginBottom: 4, textAlign: "center" },
  statValue: { fontSize: 20 },
  sectionTitle: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8 },
  empty: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 14, textAlign: "center" },
  emptyHint: { fontSize: 12, textAlign: "center", lineHeight: 20 },
});
