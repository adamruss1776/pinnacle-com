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
  const trackWidthRef = useRef(0);

  const clamp = (v: number) => Math.max(min, Math.min(max, v));

  const pxToValue = (locationX: number) => {
    const width = trackWidthRef.current;
    if (width === 0) return value;
    const ratio = Math.max(0, Math.min(1, locationX / width));
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
        onChange(pxToValue(e.nativeEvent.locationX));
      },
      onPanResponderMove: (e) => {
        onChange(pxToValue(e.nativeEvent.locationX));
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  const percent = ((clamp(value) - min) / (max - min)) * 100;

  return (
    <View style={styles.wrapper}>
      <View
        style={styles.trackContainer}
        onLayout={(e: LayoutChangeEvent) => {
          const w = e.nativeEvent.layout.width;
          setTrackWidth(w);
          trackWidthRef.current = w;
        }}
        {...panResponder.panHandlers}
      >
        <View style={[styles.track, { backgroundColor: colors.border }]}>
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
      <Text
        style={[
          styles.valueLabel,
          { color: colors.green, fontFamily: "Inter_600SemiBold" },
        ]}
      >
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
