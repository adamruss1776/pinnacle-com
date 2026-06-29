import React, { useRef, useState } from "react";
import {
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface CustomSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatLabel?: (value: number) => string;
}

export function CustomSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
  formatLabel,
}: CustomSliderProps) {
  const colors = useColors();
  const [trackWidth, setTrackWidth] = useState(0);
  const trackX = useRef(0);

  const clamp = (v: number) => Math.max(min, Math.min(max, v));

  const valueToPercent = (v: number) => ((clamp(v) - min) / (max - min)) * 100;

  const pxToValue = (px: number) => {
    if (trackWidth === 0) return value;
    const ratio = Math.max(0, Math.min(1, px / trackWidth));
    const raw = min + ratio * (max - min);
    if (step > 0) {
      return clamp(Math.round(raw / step) * step);
    }
    return clamp(raw);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const x = e.nativeEvent.locationX;
        onChange(pxToValue(x));
      },
      onPanResponderMove: (e) => {
        const x = e.nativeEvent.locationX - trackX.current + e.nativeEvent.locationX;
        const absX = e.nativeEvent.pageX - trackX.current;
        onChange(pxToValue(Math.max(0, absX)));
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  const simplePan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      const absX = e.nativeEvent.pageX - trackX.current;
      onChange(pxToValue(Math.max(0, absX)));
    },
    onPanResponderMove: (e) => {
      const absX = e.nativeEvent.pageX - trackX.current;
      onChange(pxToValue(Math.max(0, absX)));
    },
  });

  const percent = valueToPercent(value);

  return (
    <View style={styles.wrapper}>
      <View
        style={styles.trackContainer}
        onLayout={(e: LayoutChangeEvent) => {
          setTrackWidth(e.nativeEvent.layout.width);
          e.nativeEvent.layout.x && (trackX.current = e.nativeEvent.layout.x);
        }}
        {...simplePan.panHandlers}
      >
        <View
          style={[
            styles.track,
            { backgroundColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.fill,
              { width: `${percent}%` as any, backgroundColor: colors.green },
            ]}
          />
        </View>
        <View
          style={[
            styles.thumb,
            {
              left: `${percent}%` as any,
              backgroundColor: colors.green,
              borderColor: colors.background,
            },
          ]}
        />
      </View>
      <Text style={[styles.valueLabel, { color: colors.green, fontFamily: "Inter_600SemiBold" }]}>
        {formatLabel ? formatLabel(value) : value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  trackContainer: {
    flex: 1,
    height: 40,
    justifyContent: "center",
    position: "relative",
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: "visible",
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
  thumb: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginLeft: -10,
    top: -8,
  },
  valueLabel: {
    fontSize: 14,
    minWidth: 56,
    textAlign: "right",
  },
});
