import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
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

import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

export default function LogSpiffScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addSpiff, updateSpiff, spiffs } = useData();
  const params = useLocalSearchParams<{ editId?: string }>();

  const editId = params.editId;
  const existingSpiff = editId ? spiffs.find((s) => s.id === editId) : undefined;
  const isEdit = !!existingSpiff;

  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(existingSpiff?.date ?? today);
  const [description, setDescription] = useState(existingSpiff?.description ?? "");
  const [amount, setAmount] = useState(
    existingSpiff != null ? String(existingSpiff.amount) : ""
  );

  function handleSave() {
    const amt = parseFloat(amount);
    if (!description.trim() || isNaN(amt) || amt <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const spiffData = {
      date,
      description: description.trim(),
      amount: amt,
    };
    if (isEdit && editId) {
      updateSpiff(editId, spiffData);
    } else {
      addSpiff(spiffData);
    }
    router.back();
  }

  const amt = parseFloat(amount) || 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          {isEdit ? "Edit Spiff" : "Log Spiff"}
        </Text>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.amber }]}
          onPress={handleSave}
        >
          <Text style={[styles.saveBtnText, { color: "#080808", fontFamily: "Inter_600SemiBold" }]}>
            {isEdit ? "Update" : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Date
              </Text>
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Description
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Volume bonus"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Amount
              </Text>
              <View style={styles.amountWrap}>
                <Text style={[styles.prefix, { color: colors.mutedForeground }]}>$</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}
                />
              </View>
            </View>
          </View>

          {/* Preview */}
          {amt > 0 && (
            <View style={[styles.previewCard, { backgroundColor: "#1a0f00", borderColor: "#3d2a0a" }]}>
              <Text style={[styles.previewLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Spiff Amount
              </Text>
              <Text style={[styles.previewAmount, { color: colors.amber, fontFamily: "Inter_700Bold" }]}>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(amt)}
              </Text>
              {description.trim() && (
                <Text style={[styles.previewDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {description}
                </Text>
              )}
            </View>
          )}
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
  card: { borderRadius: 14, padding: 16, borderWidth: 1 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  label: { fontSize: 14 },
  divider: { height: 1 },
  input: { fontSize: 15, textAlign: "right", flex: 1 },
  amountWrap: { flexDirection: "row", alignItems: "center", flex: 1, justifyContent: "flex-end" },
  prefix: { fontSize: 16, marginRight: 2 },
  previewCard: { borderRadius: 14, padding: 20, borderWidth: 1, alignItems: "center", gap: 4 },
  previewLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8 },
  previewAmount: { fontSize: 48 },
  previewDesc: { fontSize: 14 },
});
