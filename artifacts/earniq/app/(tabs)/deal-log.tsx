import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DealCard } from "@/components/DealCard";
import { SpiffCard } from "@/components/SpiffCard";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { formatCurrency, isThisMonth, isThisYear } from "@/utils/commission";

type FilterType = "month" | "year" | "all";

export default function DealLogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { deals, spiffs, deleteDeal, deleteSpiff } = useData();
  const [filter, setFilter] = useState<FilterType>("month");

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
  const totalSpiffs = filteredSpiffs.reduce((s, sp) => s + sp.amount, 0);

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
            onPress={() => router.push("/import")}
          >
            <Feather name="upload" size={18} color={colors.foreground} />
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
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[
              styles.filterTab,
              filter === tab.value
                ? { backgroundColor: colors.green }
                : { backgroundColor: colors.surface },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setFilter(tab.value);
            }}
          >
            <Text
              style={[
                styles.filterTabText,
                {
                  color: filter === tab.value ? colors.primaryForeground : colors.mutedForeground,
                  fontFamily: "Inter_600SemiBold",
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
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
              No deals for this period
            </Text>
          </View>
        ) : (
          filteredDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onDelete={handleDeleteDeal} />
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
              No spiffs for this period
            </Text>
          </View>
        ) : (
          filteredSpiffs.map((spiff) => (
            <SpiffCard key={spiff.id} spiff={spiff} onDelete={handleDeleteSpiff} />
          ))
        )}
      </ScrollView>
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
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: { fontSize: 15 },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
  },
  filterTabText: { fontSize: 12 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  summaryCard: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryLabel: { fontSize: 12, marginBottom: 4 },
  summaryValue: { fontSize: 16 },
  divider: { width: 1, marginHorizontal: 8 },
  statsRow: { flexDirection: "row", marginBottom: 4 },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  statLabel: { fontSize: 11, marginBottom: 4, textAlign: "center" },
  statValue: { fontSize: 17 },
  sectionTitle: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  empty: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 14 },
});
