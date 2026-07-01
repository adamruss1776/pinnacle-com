import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CommissionPreview } from "@/components/CommissionPreview";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { calcCommission } from "@/utils/commission";
import { readPrefillParams } from "@/utils/prefill-params";

const SPLITS = [
  { label: "None", value: 1 },
  { label: "70%", value: 0.7 },
  { label: "60%", value: 0.6 },
  { label: "50%", value: 0.5 },
];

export default function LogDealScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addDeal, updateDeal, payPlan, deals } = useData();
  const params = useLocalSearchParams<{
    editId?: string;
    prefillDate?: string;
    prefillVehicle?: string;
    prefillFront?: string;
    prefillBack?: string;
    prefillType?: string;
  }>();

  const editId = params.editId;
  const existingDeal = editId ? deals.find((d) => d.id === editId) : undefined;
  const isEdit = !!existingDeal;

  const today = new Date().toISOString().split("T")[0]!;

  const prefill = readPrefillParams(params, today);

  const [date, setDate] = useState(existingDeal?.date ?? prefill.date);
  const [vehicleName, setVehicleName] = useState(existingDeal?.vehicleName ?? prefill.vehicleName);
  const [stockNumber, setStockNumber] = useState(existingDeal?.stockNumber ?? "");
  const [type, setType] = useState<"new" | "used">(existingDeal?.type ?? prefill.type);
  const [frontGross, setFrontGross] = useState(
    existingDeal != null ? String(existingDeal.frontGross) : prefill.frontGross
  );
  const [backGross, setBackGross] = useState(
    existingDeal != null ? String(existingDeal.backGross) : prefill.backGross
  );
  const [split, setSplit] = useState(existingDeal?.split ?? 1);
  const [partnerName, setPartnerName] = useState(existingDeal?.partnerName ?? "");
  const [notes, setNotes] = useState(existingDeal?.notes ?? "");

  const front = parseFloat(frontGross) || 0;
  const back = parseFloat(backGross) || 0;

  const commResult = useMemo(
    () => calcCommission(type, front, back, split, payPlan),
    [type, front, back, split, payPlan]
  );

  function handleSave() {
    if (!vehicleName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const dealData = {
      date,
      vehicleName: vehicleName.trim(),
      stockNumber: stockNumber.trim(),
      type,
      frontGross: front,
      backGross: back,
      split,
      partnerName: partnerName.trim(),
      notes: notes.trim(),
    };
    if (isEdit && editId) {
      updateDeal(editId, dealData);
    } else {
      addDeal(dealData);
    }
    router.back();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          <Text style={[styles.backText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
            Cancel
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          {isEdit ? "Edit Deal" : "Log Deal"}
        </Text>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.green }]}
          onPress={handleSave}
        >
          <Text style={[styles.saveBtnText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>
            {isEdit ? "Update" : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Vehicle Type Toggle */}
          <View style={[styles.typeToggle, { backgroundColor: colors.input }]}>
            <TouchableOpacity
              style={[
                styles.typeOption,
                type === "new" && { backgroundColor: "#1d3a5c" },
              ]}
              onPress={() => setType("new")}
            >
              <Text
                style={[
                  styles.typeOptionText,
                  { color: type === "new" ? colors.blue : colors.mutedForeground, fontFamily: "Inter_700Bold" },
                ]}
              >
                New
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeOption,
                type === "used" && { backgroundColor: "#3d2a0a" },
              ]}
              onPress={() => setType("used")}
            >
              <Text
                style={[
                  styles.typeOptionText,
                  { color: type === "used" ? colors.amber : colors.mutedForeground, fontFamily: "Inter_700Bold" },
                ]}
              >
                Used
              </Text>
            </TouchableOpacity>
          </View>

          {/* Fields */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <FieldRow label="Date" colors={colors}>
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="e.g. 2026-07-01"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}
              />
            </FieldRow>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <FieldRow label="Vehicle" colors={colors}>
              <TextInput
                value={vehicleName}
                onChangeText={setVehicleName}
                placeholder="e.g. 2024 Toyota Camry"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}
              />
            </FieldRow>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <FieldRow label="Stock #" colors={colors}>
              <TextInput
                value={stockNumber}
                onChangeText={setStockNumber}
                placeholder="Optional"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}
              />
            </FieldRow>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <FieldRow label="Front Gross" colors={colors} prefix="$">
              <TextInput
                value={frontGross}
                onChangeText={setFrontGross}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}
              />
            </FieldRow>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <FieldRow label="Back Gross" colors={colors} prefix="$">
              <TextInput
                value={backGross}
                onChangeText={setBackGross}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}
              />
            </FieldRow>
          </View>

          {/* Split */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 10 }]}>
              Split
            </Text>
            <View style={styles.splitRow}>
              {SPLITS.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  style={[
                    styles.splitBtn,
                    {
                      backgroundColor:
                        split === s.value ? colors.green : colors.input,
                      borderColor: split === s.value ? colors.green : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSplit(s.value);
                  }}
                >
                  <Text
                    style={[
                      styles.splitBtnText,
                      {
                        color: split === s.value ? colors.primaryForeground : colors.mutedForeground,
                        fontFamily: "Inter_600SemiBold",
                      },
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {split < 1 && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border, marginTop: 12 }]} />
                <FieldRow label="Partner" colors={colors}>
                  <TextInput
                    value={partnerName}
                    onChangeText={setPartnerName}
                    placeholder="Partner name"
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.input, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}
                  />
                </FieldRow>
              </>
            )}
          </View>

          {/* Notes */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 8 }]}>
              Notes
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional notes about this deal"
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              style={[
                styles.notesInput,
                { color: colors.foreground, fontFamily: "Inter_400Regular", borderColor: colors.border },
              ]}
            />
          </View>

          {/* Live Commission Preview */}
          <CommissionPreview
            commission={commResult.commission}
            frontCommission={commResult.frontCommission}
            backCommission={commResult.backCommission}
            isCapped={commResult.isCapped}
            split={split}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function FieldRow({
  label,
  children,
  colors,
  prefix,
}: {
  label: string;
  children: React.ReactNode;
  colors: any;
  prefix?: string;
}) {
  return (
    <View style={fieldStyles.row}>
      <Text style={[fieldStyles.label, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
        {label}
      </Text>
      <View style={fieldStyles.inputWrap}>
        {prefix && (
          <Text style={[fieldStyles.prefix, { color: colors.mutedForeground }]}>{prefix}</Text>
        )}
        {children}
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  label: { fontSize: 14 },
  inputWrap: { flexDirection: "row", alignItems: "center", flex: 1, justifyContent: "flex-end" },
  prefix: { fontSize: 16, marginRight: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 2, minWidth: 70 },
  backText: { fontSize: 16 },
  headerTitle: { fontSize: 17 },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10, minWidth: 70, alignItems: "center" },
  saveBtnText: { fontSize: 15 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  typeToggle: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  typeOptionText: { fontSize: 16 },
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  divider: { height: 1 },
  fieldLabel: { fontSize: 14 },
  input: {
    fontSize: 15,
    textAlign: "right",
    flex: 1,
    minWidth: 120,
  },
  splitRow: { flexDirection: "row", gap: 8 },
  splitBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  splitBtnText: { fontSize: 13 },
  notesInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    minHeight: 72,
    textAlignVertical: "top",
  },
});
