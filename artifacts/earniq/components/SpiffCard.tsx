import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Spiff } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { formatCurrency, formatDate } from "@/utils/commission";

interface SpiffCardProps {
  spiff: Spiff;
  onDelete?: (id: string) => void;
}

export function SpiffCard({ spiff, onDelete }: SpiffCardProps) {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          <View style={[styles.dot, { backgroundColor: colors.amber }]} />
          <View style={styles.info}>
            <Text
              style={[styles.description, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}
              numberOfLines={2}
            >
              {spiff.description || "Spiff"}
            </Text>
            <Text style={[styles.date, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {formatDate(spiff.date)}
            </Text>
          </View>
        </View>
        <View style={styles.right}>
          <Text style={[styles.amount, { color: colors.amber, fontFamily: "Inter_700Bold" }]}>
            {formatCurrency(spiff.amount)}
          </Text>
          {onDelete && (
            <TouchableOpacity
              onPress={() => onDelete(spiff.id)}
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
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  info: {
    flex: 1,
  },
  description: {
    fontSize: 15,
  },
  date: {
    fontSize: 13,
    marginTop: 2,
  },
  right: {
    alignItems: "flex-end",
    gap: 6,
  },
  amount: {
    fontSize: 18,
  },
});
