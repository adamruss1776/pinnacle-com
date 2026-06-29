import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Deal } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { formatCurrency, formatDate } from "@/utils/commission";

interface DealCardProps {
  deal: Deal;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export function DealCard({ deal, onDelete, compact = false }: DealCardProps) {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.row}>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.vehicleName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}
              numberOfLines={1}
            >
              {deal.vehicleName || "Untitled Vehicle"}
            </Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: deal.type === "new" ? "#1d3a5c" : "#3d2a0a" },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: deal.type === "new" ? colors.blue : colors.amber, fontFamily: "Inter_600SemiBold" },
                ]}
              >
                {deal.type === "new" ? "New" : "Used"}
              </Text>
            </View>
            {deal.isCapped && (
              <View style={[styles.cappedBadge, { backgroundColor: "#1a1a1a" }]}>
                <Text style={[styles.cappedText, { color: colors.amber, fontFamily: "Inter_600SemiBold" }]}>
                  ⚡ Capped
                </Text>
              </View>
            )}
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.meta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {formatDate(deal.date)}
            </Text>
            {deal.stockNumber ? (
              <Text style={[styles.meta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {" • "}#{deal.stockNumber}
              </Text>
            ) : null}
            {deal.split < 1 && (
              <Text style={[styles.meta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {" • "}{Math.round(deal.split * 100)}% split
              </Text>
            )}
          </View>
        </View>
        <View style={styles.rightSide}>
          <Text style={[styles.commission, { color: colors.green, fontFamily: "Inter_700Bold" }]}>
            {formatCurrency(deal.commission)}
          </Text>
          {onDelete && (
            <TouchableOpacity
              onPress={() => onDelete(deal.id)}
              style={styles.deleteBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  vehicleName: {
    fontSize: 15,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgeText: {
    fontSize: 11,
  },
  cappedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  cappedText: {
    fontSize: 11,
  },
  metaRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  meta: {
    fontSize: 13,
  },
  rightSide: {
    alignItems: "flex-end",
    gap: 6,
  },
  commission: {
    fontSize: 18,
  },
  deleteBtn: {
    padding: 2,
  },
});
