import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SLIDES = [
  {
    icon: "calculator-outline" as const,
    headline: "Tired of guessing your commission?",
    subtext:
      "Most salespeople have no idea what they made until payday. Crumpled deal sheets, calculator apps, texting yourself numbers — there's a better way.",
  },
  {
    icon: "document-text-outline" as const,
    headline: "Log every deal in seconds.",
    subtext:
      "Snap a photo of your deal sheet and EarnIQ reads the numbers automatically. Or enter them manually in under 30 seconds. New, used, split deals, spiffs — all of it.",
  },
  {
    icon: "bar-chart-outline" as const,
    headline: "Always know where you stand.",
    subtext:
      "See your month-to-date commission, your projected month-end total, and how close you are to hitting your goal — in real time, every day.",
  },
  {
    icon: "build-outline" as const,
    headline: "Let's set up your pay plan.",
    subtext:
      "EarnIQ calculates your commission accurately when it knows how you get paid. Takes 60 seconds and you only do it once.",
  },
];

interface Props {
  onComplete: (goToPayPlan: boolean) => void;
}

export function Onboarding({ onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const slide = SLIDES[step]!;
  const isLast = step === SLIDES.length - 1;

  function handleNext() {
    if (isLast) {
      onComplete(true);
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 },
      ]}
    >
      <View style={styles.header}>
        <View />
        <TouchableOpacity
          onPress={() => onComplete(false)}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name={slide.icon} size={64} color="#4ade80" />
        </View>
        <Text style={styles.headline}>{slide.headline}</Text>
        <Text style={styles.subtext}>{slide.subtext}</Text>
      </View>

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === step ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>
        <TouchableOpacity style={styles.btn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.btnText}>{isLast ? "Get Started" : "Next"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0a0a0a",
    zIndex: 999,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  skip: {
    color: "#666",
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 28,
    paddingHorizontal: 8,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 32,
    backgroundColor: "#0d1f14",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1a3d28",
  },
  headline: {
    fontSize: 30,
    color: "#ffffff",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 38,
  },
  subtext: {
    fontSize: 16,
    color: "#888888",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 25,
  },
  bottom: {
    gap: 24,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: "#4ade80",
  },
  dotInactive: {
    width: 7,
    backgroundColor: "#2a2a2a",
  },
  btn: {
    backgroundColor: "#4ade80",
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
  },
  btnText: {
    color: "#080808",
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
});
