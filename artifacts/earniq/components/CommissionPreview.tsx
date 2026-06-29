import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { formatCurrency } from "@/utils/commission";

interface CommissionPreviewProps {
  commission: number;
  frontCommission: number;
  backCommission: number;
  isCapped: boolean;
  split: number;
}

export function CommissionPreview({
  commission,
  frontCommission,
  backCommission,
  isCapped,
  split,
}: CommissionPreviewProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: "#0d1f14", borderColor: "#1a3d28" }]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          Commission Preview
        </Text>
        {isCapped && (
          <View style={[styles.cappedTag, { backgroundColor: "#2a1f00" }]}>
            <Text style={[styles.cappedText, { color: colors.amber, fontFamily: "Inter_600SemiBold" }]}>
              ⚡ Front End Capped
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.total, { color: colors.green, fontFamily: "Inter_700Bold" }]}>
        {formatCurrency(commission)}
      </Text>
      <View style={styles.breakdown}>
        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Front End
          </Text>
          <Text style={[styles.breakdownValue, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
            {formatCurrency(frontCommission)}
          </Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Back End
          </Text>
          <Text style={[styles.breakdownValue, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
            {formatCurrency(backCommission)}
          </Text>
        </View>
        {split < 1 && (
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Split ({Math.round(split * 100)}%)
            </Text>
            <Text style={[styles.breakdownValue, { color: colors.green, fontFamily: "Inter_500Medium" }]}>
              applied
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  cappedTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cappedText: {
    fontSize: 11,
  },
  total: {
    fontSize: 36,
    marginBottom: 12,
  },
  breakdown: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "#1a3d28",
    paddingTop: 12,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  breakdownLabel: {
    fontSize: 13,
  },
  breakdownValue: {
    fontSize: 13,
  },
});
