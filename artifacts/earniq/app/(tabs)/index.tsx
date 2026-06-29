import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DealCard } from "@/components/DealCard";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { formatCurrency } from "@/utils/commission";

export default function EarningsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { mtdCommission, ytdCommission, avgCommissionPerDeal, recentDeals, isLoading } = useData();

  const now = new Date();
  const monthName = now.toLocaleDateString("en-US", { month: "long" });
  const year = now.getFullYear();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === "web" ? 67 : insets.top + 16,
            backgroundColor: colors.background,
          },
        ]}
      >
        <View>
          <Text style={[styles.appName, { color: colors.green, fontFamily: "Inter_700Bold" }]}>
            EarnIQ
          </Text>
          <Text style={[styles.period, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {monthName} {year}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/log-spiff");
            }}
          >
            <Ionicons name="add" size={16} color={colors.amber} />
            <Text style={[styles.headerBtnText, { color: colors.amber, fontFamily: "Inter_600SemiBold" }]}>
              Spiff
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: colors.green }]}
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/log-deal");
            }}
          >
            <Ionicons name="add" size={16} color={colors.primaryForeground} />
            <Text style={[styles.headerBtnText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>
              Deal
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* MTD Total */}
        <View style={[styles.mtdCard, { backgroundColor: "#0d1f14", borderColor: "#1a3d28" }]}>
          <Text style={[styles.mtdLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Month-to-Date
          </Text>
          <Text style={[styles.mtdAmount, { color: colors.green, fontFamily: "Inter_700Bold" }]}>
            {formatCurrency(mtdCommission)}
          </Text>
          <Text style={[styles.mtdSub, { color: "#4ade80", fontFamily: "Inter_400Regular" }]}>
            Deals + Spiffs
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              YTD Total
            </Text>
            <Text style={[styles.statValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {formatCurrency(ytdCommission)}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Avg per Deal
            </Text>
            <Text style={[styles.statValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {formatCurrency(avgCommissionPerDeal)}
            </Text>
          </View>
        </View>

        {/* Import Button */}
        <TouchableOpacity
          style={[styles.importBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/import");
          }}
        >
          <View style={[styles.importIconWrap, { backgroundColor: "#0d1f14" }]}>
            <Feather name="upload" size={18} color={colors.green} />
          </View>
          <View style={styles.importText}>
            <Text style={[styles.importTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Import Deal Sheet
            </Text>
            <Text style={[styles.importSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Photo or PDF upload
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        {/* Recent Deals */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
            Recent Deals
          </Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/deal-log")}>
            <Text style={[styles.seeAll, { color: colors.green, fontFamily: "Inter_600SemiBold" }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {recentDeals.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Feather name="file-text" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              No deals yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Tap + Deal to log your first commission
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.green }]}
              onPress={() => router.push("/log-deal")}
            >
              <Text style={[styles.emptyBtnText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>
                Log a Deal
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          recentDeals.map((deal) => <DealCard key={deal.id} deal={deal} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  appName: { fontSize: 32 },
  period: { fontSize: 14, marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  headerBtnText: { fontSize: 14 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 12 },
  mtdCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: "center",
  },
  mtdLabel: { fontSize: 13, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  mtdAmount: { fontSize: 56 },
  mtdSub: { fontSize: 13, marginTop: 4 },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  statLabel: { fontSize: 12, marginBottom: 6, textAlign: "center" },
  statValue: { fontSize: 20 },
  importBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  importIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  importText: { flex: 1 },
  importTitle: { fontSize: 15 },
  importSub: { fontSize: 13, marginTop: 2 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  sectionTitle: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8 },
  seeAll: { fontSize: 13 },
  emptyCard: {
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { fontSize: 17, marginTop: 4 },
  emptyText: { fontSize: 14, textAlign: "center" },
  emptyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  emptyBtnText: { fontSize: 15 },
});
