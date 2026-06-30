import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CommissionPreview } from "@/components/CommissionPreview";
import { CustomSlider } from "@/components/CustomSlider";
import { DEFAULT_GOALS, DEFAULT_PAY_PLAN, type MonthlyGoals, type PayPlan, useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { calcCommission } from "@/utils/commission";
import { exportDataAsCsv } from "@/utils/exportData";

export default function PayPlanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { payPlan, updatePayPlan, monthlyGoals, updateGoals, deals, spiffs } = useData();

  const [localPlan, setLocalPlan] = useState<PayPlan>(payPlan);
  const [localGoals, setLocalGoals] = useState<MonthlyGoals>(monthlyGoals);
  const [calcFrontGross, setCalcFrontGross] = useState("");
  const [calcBackGross, setCalcBackGross] = useState("");
  const [calcType, setCalcType] = useState<"new" | "used">("new");
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);

  function update(field: keyof PayPlan, value: number | boolean) {
    setLocalPlan((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function handleSave() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updatePayPlan(localPlan);
    updateGoals(localGoals);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    setLocalPlan(DEFAULT_PAY_PLAN);
    setSaved(false);
  }

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      await exportDataAsCsv(deals, spiffs, payPlan);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not export data.";
      Alert.alert("Export Failed", message);
    } finally {
      setExporting(false);
    }
  }

  const front = parseFloat(calcFrontGross) || 0;
  const back = parseFloat(calcBackGross) || 0;
  const calcResult = calcCommission(calcType, front, back, 1, localPlan);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          Pay Plan
        </Text>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: saved ? "#1a3d28" : colors.green }]}
          onPress={handleSave}
        >
          <Text style={[styles.saveBtnText, { color: saved ? colors.green : colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>
            {saved ? "Saved" : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* New Car Section */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
              <View style={[styles.typeBadge, { backgroundColor: "#1d3a5c" }]}>
                <Text style={[styles.typeBadgeText, { color: colors.blue, fontFamily: "Inter_600SemiBold" }]}>
                  NEW
                </Text>
              </View>
              <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                New Car
              </Text>
            </View>
            <View style={styles.sliderSection}>
              <View style={styles.sliderLabelRow}>
                <Text style={[styles.sliderLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                  Front End %
                </Text>
              </View>
              <CustomSlider
                value={localPlan.newFrontPct}
                min={0}
                max={30}
                step={0.5}
                onChange={(v) => update("newFrontPct", v)}
                formatLabel={(v) => `${v}%`}
              />
            </View>
            <View style={styles.sliderSection}>
              <View style={styles.sliderLabelRow}>
                <Text style={[styles.sliderLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                  Front End Cap
                </Text>
              </View>
              <CustomSlider
                value={localPlan.newFrontCap}
                min={0}
                max={15000}
                step={250}
                onChange={(v) => update("newFrontCap", v)}
                formatLabel={(v) => `$${v.toLocaleString()}`}
              />
            </View>
          </View>

          {/* Used Car Section */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
              <View style={[styles.typeBadge, { backgroundColor: "#3d2a0a" }]}>
                <Text style={[styles.typeBadgeText, { color: colors.amber, fontFamily: "Inter_600SemiBold" }]}>
                  USED
                </Text>
              </View>
              <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                Used Car
              </Text>
            </View>
            <View style={styles.sliderSection}>
              <View style={styles.sliderLabelRow}>
                <Text style={[styles.sliderLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                  Front End %
                </Text>
              </View>
              <CustomSlider
                value={localPlan.usedFrontPct}
                min={0}
                max={30}
                step={0.5}
                onChange={(v) => update("usedFrontPct", v)}
                formatLabel={(v) => `${v}%`}
              />
            </View>
            <View style={styles.sliderSection}>
              <View style={styles.sliderLabelRow}>
                <Text style={[styles.sliderLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                  Front End Cap
                </Text>
              </View>
              <CustomSlider
                value={localPlan.usedFrontCap}
                min={0}
                max={15000}
                step={250}
                onChange={(v) => update("usedFrontCap", v)}
                formatLabel={(v) => `$${v.toLocaleString()}`}
              />
            </View>
          </View>

          {/* Back End Section */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold", marginBottom: 16 }]}>
              Back End
            </Text>
            <View style={styles.sliderSection}>
              <View style={styles.sliderLabelRow}>
                <Text style={[styles.sliderLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                  Back End %
                </Text>
              </View>
              <CustomSlider
                value={localPlan.backPct}
                min={0}
                max={30}
                step={0.5}
                onChange={(v) => update("backPct", v)}
                formatLabel={(v) => `${v}%`}
              />
            </View>
          </View>

          {/* Caps Toggle */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.toggleRow}>
              <View>
                <Text style={[styles.toggleTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  Enforce Caps
                </Text>
                <Text style={[styles.toggleSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Apply front end commission caps to all deals
                </Text>
              </View>
              <Switch
                value={localPlan.enforceCaps}
                onValueChange={(v) => {
                  Haptics.selectionAsync();
                  update("enforceCaps", v);
                }}
                trackColor={{ false: colors.border, true: "#1a3d28" }}
                thumbColor={localPlan.enforceCaps ? colors.green : colors.mutedForeground}
              />
            </View>
          </View>

          {/* Monthly Goals */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold", marginBottom: 4 }]}>
              Monthly Goals
            </Text>
            <Text style={[styles.goalSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Track your progress on the Earnings screen
            </Text>
            <View style={styles.goalRow}>
              <Text style={[styles.goalLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                Unit Goal
              </Text>
              <View style={[styles.goalInput, { backgroundColor: colors.input, borderColor: colors.border }]}>
                <TextInput
                  value={localGoals.unitGoal > 0 ? String(localGoals.unitGoal) : ""}
                  onChangeText={(t) => {
                    const n = parseInt(t, 10);
                    setLocalGoals((prev) => ({ ...prev, unitGoal: isNaN(n) || n < 0 ? 0 : n }));
                    setSaved(false);
                  }}
                  keyboardType="number-pad"
                  placeholder="e.g. 20"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.goalInputText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}
                />
                <Text style={[styles.goalInputSuffix, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  units
                </Text>
              </View>
            </View>
            <View style={[styles.goalRow, { marginBottom: 0 }]}>
              <Text style={[styles.goalLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                Commission Goal
              </Text>
              <View style={[styles.goalInput, { backgroundColor: colors.input, borderColor: colors.border }]}>
                <Text style={[styles.goalInputPrefix, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  $
                </Text>
                <TextInput
                  value={localGoals.commissionGoal > 0 ? String(localGoals.commissionGoal) : ""}
                  onChangeText={(t) => {
                    const n = parseFloat(t);
                    setLocalGoals((prev) => ({ ...prev, commissionGoal: isNaN(n) || n < 0 ? 0 : n }));
                    setSaved(false);
                  }}
                  keyboardType="numeric"
                  placeholder="e.g. 8000"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.goalInputText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}
                />
              </View>
            </View>
          </View>

          {/* Reset */}
          <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
            <Text style={[styles.resetText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              Reset to Defaults
            </Text>
          </TouchableOpacity>

          {/* Export Data */}
          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleExport}
            disabled={exporting}
            activeOpacity={0.75}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={colors.green} />
            ) : (
              <Text style={[styles.exportIcon]}>📤</Text>
            )}
            <View style={styles.exportTextWrap}>
              <Text style={[styles.exportTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                Export Data
              </Text>
              <Text style={[styles.exportSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {`Save ${deals.length} deal${deals.length !== 1 ? "s" : ""} & ${spiffs.length} spiff${spiffs.length !== 1 ? "s" : ""} as CSV`}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Calculator */}
          <View style={[styles.calcCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.calcTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Deal Calculator
            </Text>
            <Text style={[styles.calcSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Preview your commission with current plan
            </Text>

            {/* Type Toggle */}
            <View style={[styles.typeToggle, { backgroundColor: colors.background }]}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  calcType === "new" && { backgroundColor: "#1d3a5c" },
                ]}
                onPress={() => setCalcType("new")}
              >
                <Text style={[styles.typeOptionText, { color: calcType === "new" ? colors.blue : colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                  New
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  calcType === "used" && { backgroundColor: "#3d2a0a" },
                ]}
                onPress={() => setCalcType("used")}
              >
                <Text style={[styles.typeOptionText, { color: calcType === "used" ? colors.amber : colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                  Used
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.calcInputs}>
              <View style={styles.calcInputWrap}>
                <Text style={[styles.calcInputLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Front Gross
                </Text>
                <View style={[styles.calcInput, { backgroundColor: colors.input, borderColor: colors.border }]}>
                  <Text style={[styles.calcInputPrefix, { color: colors.mutedForeground }]}>$</Text>
                  <TextInput
                    value={calcFrontGross}
                    onChangeText={setCalcFrontGross}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.calcInputText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}
                  />
                </View>
              </View>
              <View style={styles.calcInputWrap}>
                <Text style={[styles.calcInputLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Back Gross
                </Text>
                <View style={[styles.calcInput, { backgroundColor: colors.input, borderColor: colors.border }]}>
                  <Text style={[styles.calcInputPrefix, { color: colors.mutedForeground }]}>$</Text>
                  <TextInput
                    value={calcBackGross}
                    onChangeText={setCalcBackGross}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.calcInputText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}
                  />
                </View>
              </View>
            </View>

            <CommissionPreview
              commission={calcResult.commission}
              frontCommission={calcResult.frontCommission}
              backCommission={calcResult.backCommission}
              isCapped={calcResult.isCapped}
              split={1}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  saveBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10 },
  saveBtnText: { fontSize: 15 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeBadgeText: { fontSize: 11 },
  cardTitle: { fontSize: 16 },
  sliderSection: { marginBottom: 12 },
  sliderLabelRow: { marginBottom: 4 },
  sliderLabel: { fontSize: 14 },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleTitle: { fontSize: 16, marginBottom: 2 },
  toggleSubtitle: { fontSize: 13, maxWidth: "80%" },
  goalSubtitle: { fontSize: 12, marginBottom: 14 },
  goalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  goalLabel: { fontSize: 14, flex: 1 },
  goalInput: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 130,
  },
  goalInputPrefix: { fontSize: 15, marginRight: 4 },
  goalInputSuffix: { fontSize: 13, marginLeft: 6 },
  goalInputText: { fontSize: 15, minWidth: 60 },
  resetBtn: { alignItems: "center", paddingVertical: 4 },
  resetText: { fontSize: 14 },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  exportIcon: { fontSize: 22 },
  exportTextWrap: { flex: 1 },
  exportTitle: { fontSize: 15 },
  exportSubtitle: { fontSize: 12, marginTop: 2 },
  calcCard: { borderRadius: 14, padding: 16, borderWidth: 1, gap: 12 },
  calcTitle: { fontSize: 20 },
  calcSubtitle: { fontSize: 13, marginTop: -4 },
  typeToggle: {
    flexDirection: "row",
    borderRadius: 10,
    overflow: "hidden",
    padding: 4,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  typeOptionText: { fontSize: 14 },
  calcInputs: { flexDirection: "row", gap: 12 },
  calcInputWrap: { flex: 1 },
  calcInputLabel: { fontSize: 12, marginBottom: 6 },
  calcInput: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  calcInputPrefix: { fontSize: 16, marginRight: 4 },
  calcInputText: { flex: 1, fontSize: 16 },
});
