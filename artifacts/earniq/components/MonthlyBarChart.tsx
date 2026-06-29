import React from "react";
import { Text, View, StyleSheet } from "react-native";
import Svg, { Rect, G } from "react-native-svg";
import { MonthlyDataPoint } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { formatCurrency } from "@/utils/commission";

interface MonthlyBarChartProps {
  data: MonthlyDataPoint[];
  height?: number;
}

export function MonthlyBarChart({ data, height = 120 }: MonthlyBarChartProps) {
  const colors = useColors();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const barAreaHeight = height;
  const barWidth = 28;
  const barGap = 12;
  const totalWidth = data.length * (barWidth + barGap) - barGap;

  return (
    <View style={styles.wrapper}>
      <Svg width={totalWidth} height={barAreaHeight} style={styles.svg}>
        {data.map((point, i) => {
          const isCurrentMonth = point.year === currentYear && point.month === currentMonth;
          const fillHeight = point.total > 0
            ? Math.max((point.total / maxTotal) * (barAreaHeight - 4), 4)
            : 2;
          const x = i * (barWidth + barGap);
          const y = barAreaHeight - fillHeight;
          return (
            <G key={`${point.year}-${point.month}`}>
              <Rect
                x={x}
                y={0}
                width={barWidth}
                height={barAreaHeight}
                rx={6}
                fill={colors.surface}
              />
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={fillHeight}
                rx={6}
                fill={isCurrentMonth ? colors.green : "#2d6a4f"}
                opacity={isCurrentMonth ? 1 : 0.7}
              />
            </G>
          );
        })}
      </Svg>

      <View style={[styles.labelsRow, { width: totalWidth }]}>
        {data.map((point, i) => {
          const isCurrentMonth = point.year === currentYear && point.month === currentMonth;
          return (
            <View key={`label-${i}`} style={[styles.labelCol, { width: barWidth }]}>
              <Text
                style={[
                  styles.monthLabel,
                  {
                    color: isCurrentMonth ? colors.green : colors.mutedForeground,
                    fontFamily: isCurrentMonth ? "Inter_600SemiBold" : "Inter_400Regular",
                  },
                ]}
                numberOfLines={1}
              >
                {point.label}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={[styles.labelsRow, { width: totalWidth }]}>
        {data.map((point, i) => {
          const isCurrentMonth = point.year === currentYear && point.month === currentMonth;
          if (point.total === 0) {
            return <View key={`val-${i}`} style={[styles.labelCol, { width: barWidth }]} />;
          }
          return (
            <View key={`val-${i}`} style={[styles.labelCol, { width: barWidth }]}>
              <Text
                style={[
                  styles.valueLabel,
                  { color: isCurrentMonth ? colors.green : colors.mutedForeground },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {point.total >= 1000
                  ? `$${(point.total / 1000).toFixed(1)}k`
                  : formatCurrency(point.total)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "flex-start" },
  svg: {},
  labelsRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  labelCol: {
    alignItems: "center",
    marginRight: 12,
  },
  monthLabel: { fontSize: 10, textAlign: "center" },
  valueLabel: { fontSize: 9, textAlign: "center" },
});
