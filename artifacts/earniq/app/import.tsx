import { Feather, Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { buildPrefillParams } from "@/utils/prefill-params";
import { resolveOcrDate } from "@/utils/ocr-date";

type ImportStep = "choose" | "processing" | "review";

type ExtractedFields = {
  vehicleName: string;
  frontGross: string;
  backGross: string;
  date: string;
  type: "new" | "used";
  lowConfidence?: boolean;
  fieldsFound?: number;
  dateCertain?: boolean;
};

type EditableField = "vehicleName" | "frontGross" | "backGross" | "date" | "type";

type Colors = ReturnType<typeof useColors>;

function FieldStatus({
  label,
  value,
  prefix = "",
  colors,
  onEdit,
}: {
  label: string;
  value: string;
  prefix?: string;
  colors: Colors;
  onEdit?: () => void;
}) {
  const found = !!value;
  return (
    <TouchableOpacity
      style={fieldStatusStyles.row}
      onPress={() => {
        Haptics.selectionAsync();
        onEdit?.();
      }}
      activeOpacity={0.6}
      disabled={!onEdit}
    >
      <Feather
        name={found ? "check" : "minus-circle"}
        size={14}
        color={found ? colors.green : colors.amber}
        style={{ marginTop: 1 }}
      />
      <Text style={[fieldStatusStyles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
        {label}:
      </Text>
      <Text
        style={[
          fieldStatusStyles.value,
          { color: found ? colors.foreground : colors.amber, fontFamily: "Inter_400Regular" },
        ]}
      >
        {found ? `${prefix}${value}` : "needs entry"}
      </Text>
      {onEdit && (
        <Feather
          name="edit-2"
          size={12}
          color={found ? colors.mutedForeground : colors.amber}
          style={{ marginLeft: 2 }}
        />
      )}
    </TouchableOpacity>
  );
}

const fieldStatusStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 },
  label: { fontSize: 13 },
  value: { fontSize: 13, flex: 1 },
});

function getOcrEndpoint(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) {
    return `https://${domain}/api/ocr`;
  }
  return "http://localhost:8080/api/ocr";
}

const FIELD_LABELS: Record<EditableField, string> = {
  vehicleName: "Vehicle",
  frontGross: "Front Gross",
  backGross: "Back Gross",
  date: "Date",
  type: "Deal Type",
};

const FIELD_KEYBOARD: Record<EditableField, "default" | "numeric" | "numbers-and-punctuation"> = {
  vehicleName: "default",
  frontGross: "numeric",
  backGross: "numeric",
  date: "numbers-and-punctuation",
  type: "default",
};

const FIELD_PLACEHOLDER: Record<EditableField, string> = {
  vehicleName: "e.g. 2023 Toyota Camry",
  frontGross: "e.g. 1500",
  backGross: "e.g. 800",
  date: "YYYY-MM-DD",
  type: "",
};

export default function ImportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<ImportStep>("choose");
  const [sourceType, setSourceType] = useState<"photo" | "pdf" | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrErrorType, setOcrErrorType] = useState<"timeout" | "server" | null>(null);
  const [lowConfidence, setLowConfidence] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastScanRef = useRef<{ kind: "image"; uri: string; mimeType: string } | { kind: "pdf"; uri: string } | null>(null);

  const [extracted, setExtracted] = useState<ExtractedFields>({
    vehicleName: "",
    frontGross: "",
    backGross: "",
    date: new Date().toISOString().split("T")[0]!,
    type: "new",
  });

  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editValue, setEditValue] = useState("");

  function openEdit(field: EditableField) {
    setEditValue(field === "type" ? extracted.type : (extracted[field] as string));
    setEditingField(field);
  }

  function commitEdit() {
    if (!editingField) return;
    if (editingField === "type") {
      setExtracted((prev) => ({ ...prev, type: editValue === "used" ? "used" : "new" }));
    } else {
      setExtracted((prev) => ({ ...prev, [editingField]: editValue.trim() }));
    }
    setEditingField(null);
  }

  function dismissEdit() {
    setEditingField(null);
  }

  async function handleCamera() {
    Haptics.selectionAsync();
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Camera Access Required", "Please allow camera access in settings.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled) {
      setSourceType("photo");
      await processImage(result.assets[0]!.uri, result.assets[0]!.mimeType ?? "image/jpeg");
    }
  }

  async function handleGallery() {
    Haptics.selectionAsync();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled) {
      setSourceType("photo");
      await processImage(result.assets[0]!.uri, result.assets[0]!.mimeType ?? "image/jpeg");
    }
  }

  async function handlePDF() {
    Haptics.selectionAsync();
    if (Platform.OS === "web") {
      Alert.alert("PDF Import", "PDF import is available on mobile devices only.");
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });
    if (!result.canceled) {
      setSourceType("pdf");
      await processPDF(result.assets[0]!.uri);
    }
  }

  const userCancelledRef = useRef(false);

  function handleCancel() {
    userCancelledRef.current = true;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setStep("choose");
  }

  async function processImage(uri: string, mimeType: string) {
    setStep("processing");
    setOcrError(null);
    setOcrErrorType(null);
    setLowConfidence(false);
    userCancelledRef.current = false;
    lastScanRef.current = { kind: "image", uri, mimeType };
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 30_000);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });

      const response = await fetch(getOcrEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = (await response.json()) as ExtractedFields;
      clearTimeout(timeoutId);
      const isLow = data.lowConfidence ?? (!data.vehicleName && !data.frontGross && !data.backGross);
      setLowConfidence(isLow);
      setExtracted({
        vehicleName: data.vehicleName ?? "",
        frontGross: data.frontGross ?? "",
        backGross: data.backGross ?? "",
        date: resolveOcrDate(data, new Date().toISOString().split("T")[0]!),
        type: data.type === "used" ? "used" : "new",
      });
      setStep("review");
    } catch (err) {
      clearTimeout(timeoutId);
      if (userCancelledRef.current) return;
      const isTimeout = err instanceof Error && err.name === "AbortError";
      console.error("OCR failed:", err);
      setOcrErrorType(isTimeout ? "timeout" : "server");
      setOcrError(
        isTimeout
          ? "Scan timed out — the server took too long to respond."
          : "Couldn't reach the server. Check your connection and try again."
      );
      setLowConfidence(false);
      setExtracted({
        vehicleName: "",
        frontGross: "",
        backGross: "",
        date: new Date().toISOString().split("T")[0]!,
        type: "new",
      });
      setStep("review");
    }
  }

  async function processPDF(uri: string) {
    setStep("processing");
    setOcrError(null);
    setOcrErrorType(null);
    setLowConfidence(false);
    userCancelledRef.current = false;
    lastScanRef.current = { kind: "pdf", uri };
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 30_000);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });

      const response = await fetch(getOcrEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: "application/pdf" }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = (await response.json()) as ExtractedFields;
      clearTimeout(timeoutId);
      const isLow = data.lowConfidence ?? (!data.vehicleName && !data.frontGross && !data.backGross);
      setLowConfidence(isLow);
      setExtracted({
        vehicleName: data.vehicleName ?? "",
        frontGross: data.frontGross ?? "",
        backGross: data.backGross ?? "",
        date: resolveOcrDate(data, new Date().toISOString().split("T")[0]!),
        type: data.type === "used" ? "used" : "new",
      });
      setStep("review");
    } catch (err) {
      clearTimeout(timeoutId);
      if (userCancelledRef.current) return;
      const isTimeout = err instanceof Error && err.name === "AbortError";
      console.error("PDF OCR failed:", err);
      setOcrErrorType(isTimeout ? "timeout" : "server");
      setOcrError(
        isTimeout
          ? "Scan timed out — the server took too long to respond."
          : "Couldn't reach the server. Check your connection and try again."
      );
      setLowConfidence(false);
      setExtracted({
        vehicleName: "",
        frontGross: "",
        backGross: "",
        date: new Date().toISOString().split("T")[0]!,
        type: "new",
      });
      setStep("review");
    }
  }

  const missingCriticalCount = [extracted.vehicleName, extracted.frontGross].filter((v) => !v).length;

  function handleContinue() {
    router.replace({
      pathname: "/log-deal",
      params: buildPrefillParams(extracted),
    });
  }

  async function handleRetry() {
    Haptics.selectionAsync();
    const last = lastScanRef.current;
    if (!last) return;
    if (last.kind === "image") {
      await processImage(last.uri, last.mimeType);
    } else {
      await processPDF(last.uri);
    }
  }

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
            Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Import Deal Sheet
        </Text>
        <View style={{ minWidth: 70 }} />
      </View>

      <View style={styles.body}>
        {step === "choose" && (
          <View style={styles.chooseStep}>
            <View style={[styles.iconCircle, { backgroundColor: "#0d1f14" }]}>
              <Feather name="upload" size={32} color={colors.green} />
            </View>
            <Text style={[styles.chooseTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Import a Deal Sheet
            </Text>
            <Text style={[styles.chooseSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Take a photo or upload a PDF of your deal sheet. AI will extract the key fields for you to review.
            </Text>

            <View style={styles.options}>
              <TouchableOpacity
                style={[styles.optionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={handleCamera}
              >
                <View style={[styles.optionIcon, { backgroundColor: "#0d1f14" }]}>
                  <Ionicons name="camera-outline" size={24} color={colors.green} />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                    Take Photo
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    Use your camera to capture the deal sheet
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={handleGallery}
              >
                <View style={[styles.optionIcon, { backgroundColor: "#0d1f14" }]}>
                  <Ionicons name="images-outline" size={24} color={colors.green} />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                    Choose from Gallery
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    Select an existing photo from your library
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={handlePDF}
              >
                <View style={[styles.optionIcon, { backgroundColor: "#0d1f14" }]}>
                  <Feather name="file-text" size={24} color={colors.green} />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                    PDF from Files
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    Import a PDF deal sheet from your device
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === "processing" && (
          <View style={styles.processingStep}>
            <ActivityIndicator size="large" color={colors.green} />
            <Text style={[styles.processingTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Scanning Document...
            </Text>
            <Text style={[styles.processingDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              AI is extracting deal information from your {sourceType === "pdf" ? "PDF" : "image"}
            </Text>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={handleCancel}
            >
              <Text style={[styles.cancelBtnText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {step === "review" && (
          <View style={styles.reviewStep}>
            {ocrError ? (
              <View style={[styles.reviewCard, { backgroundColor: "#1f1200", borderColor: "#3d2800" }]}>
                <Feather name="alert-circle" size={24} color={colors.amber} />
                <Text style={[styles.reviewTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  {ocrErrorType === "timeout" ? "Scan Timed Out" : "Scan Failed"}
                </Text>
                <Text style={[styles.reviewDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {ocrError}
                </Text>
                <TouchableOpacity
                  style={[styles.tryAgainBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={handleRetry}
                >
                  <Feather name="refresh-cw" size={15} color={colors.foreground} />
                  <Text style={[styles.tryAgainText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                    Try Again
                  </Text>
                </TouchableOpacity>
                <View style={styles.fieldStatusList}>
                  <FieldStatus label="Vehicle" value={extracted.vehicleName} colors={colors} onEdit={() => openEdit("vehicleName")} />
                  <FieldStatus label="Front Gross" value={extracted.frontGross} prefix="$" colors={colors} onEdit={() => openEdit("frontGross")} />
                  <FieldStatus label="Back Gross" value={extracted.backGross} prefix="$" colors={colors} onEdit={() => openEdit("backGross")} />
                  <FieldStatus label="Date" value={extracted.date} colors={colors} onEdit={() => openEdit("date")} />
                </View>
              </View>
            ) : lowConfidence ? (
              <View style={[styles.reviewCard, { backgroundColor: "#1f1200", borderColor: "#3d2800" }]}>
                <Feather name="alert-triangle" size={24} color={colors.amber} />
                <Text style={[styles.reviewTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  Low Quality Scan
                </Text>
                <Text style={[styles.reviewDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  No deal information could be read from this image. Try retaking the photo with better lighting, from a closer angle, or make sure the deal sheet is flat and fully in frame.
                </Text>
                <View style={styles.fieldStatusList}>
                  <FieldStatus label="Vehicle" value={extracted.vehicleName} colors={colors} onEdit={() => openEdit("vehicleName")} />
                  <FieldStatus label="Front Gross" value={extracted.frontGross} prefix="$" colors={colors} onEdit={() => openEdit("frontGross")} />
                  <FieldStatus label="Back Gross" value={extracted.backGross} prefix="$" colors={colors} onEdit={() => openEdit("backGross")} />
                  <FieldStatus label="Date" value={extracted.date} colors={colors} onEdit={() => openEdit("date")} />
                </View>
              </View>
            ) : (
              <View style={[styles.reviewCard, { backgroundColor: "#0d1f14", borderColor: "#1a3d28" }]}>
                <Feather name="check-circle" size={24} color={colors.green} />
                <Text style={[styles.reviewTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  Document Scanned
                </Text>
                <View style={styles.fieldStatusList}>
                  <FieldStatus label="Vehicle" value={extracted.vehicleName} colors={colors} onEdit={() => openEdit("vehicleName")} />
                  <FieldStatus label="Front Gross" value={extracted.frontGross} prefix="$" colors={colors} onEdit={() => openEdit("frontGross")} />
                  <FieldStatus label="Back Gross" value={extracted.backGross} prefix="$" colors={colors} onEdit={() => openEdit("backGross")} />
                  <FieldStatus label="Date" value={extracted.date} colors={colors} onEdit={() => openEdit("date")} />
                </View>
              </View>
            )}

            {lowConfidence && !ocrError && (
              <TouchableOpacity
                style={[styles.retakeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setStep("choose")}
              >
                <Ionicons name="camera-outline" size={18} color={colors.foreground} />
                <Text style={[styles.retakeBtnText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  Retake Photo
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.continueBtn,
                { backgroundColor: colors.green },
                missingCriticalCount > 0 && { opacity: 0.8 },
              ]}
              onPress={handleContinue}
            >
              <View style={styles.continueBtnInner}>
                <View style={styles.continueBtnRow}>
                  <Text style={[styles.continueBtnText, { color: colors.primaryForeground, fontFamily: "Inter_700Bold" }]}>
                    {lowConfidence || ocrError ? "Fill In Manually" : "Review & Save Deal"}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.primaryForeground} />
                </View>
                {missingCriticalCount > 0 && (
                  <Text style={[styles.continueBtnSubtitle, { color: colors.primaryForeground, fontFamily: "Inter_400Regular" }]}>
                    {missingCriticalCount} required {missingCriticalCount === 1 ? "field" : "fields"} still need entry
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {(!lowConfidence && !ocrError) && (
              <TouchableOpacity onPress={() => setStep("choose")} style={styles.retryBtn}>
                <Text style={[styles.retryText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                  Try a different document
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <Modal
        visible={editingField !== null}
        transparent
        animationType="fade"
        onRequestClose={dismissEdit}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={dismissEdit} />
          <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              {editingField ? FIELD_LABELS[editingField] : ""}
            </Text>

            {editingField === "type" ? (
              <View style={styles.typeToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.typeToggleBtn,
                    { borderColor: colors.border },
                    editValue === "new" && { backgroundColor: colors.green, borderColor: colors.green },
                  ]}
                  onPress={() => setEditValue("new")}
                >
                  <Text
                    style={[
                      styles.typeToggleText,
                      { color: editValue === "new" ? colors.primaryForeground : colors.foreground, fontFamily: "Inter_600SemiBold" },
                    ]}
                  >
                    New
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeToggleBtn,
                    { borderColor: colors.border },
                    editValue === "used" && { backgroundColor: colors.green, borderColor: colors.green },
                  ]}
                  onPress={() => setEditValue("used")}
                >
                  <Text
                    style={[
                      styles.typeToggleText,
                      { color: editValue === "used" ? colors.primaryForeground : colors.foreground, fontFamily: "Inter_600SemiBold" },
                    ]}
                  >
                    Used
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    color: colors.foreground,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    fontFamily: "Inter_400Regular",
                  },
                ]}
                value={editValue}
                onChangeText={setEditValue}
                placeholder={editingField ? FIELD_PLACEHOLDER[editingField] : ""}
                placeholderTextColor={colors.mutedForeground}
                keyboardType={editingField ? FIELD_KEYBOARD[editingField] : "default"}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={commitEdit}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={dismissEdit}
              >
                <Text style={[styles.modalCancelText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: colors.green }]}
                onPress={commitEdit}
              >
                <Text style={[styles.modalSaveText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  body: { flex: 1, justifyContent: "center" },
  chooseStep: { paddingHorizontal: 24, alignItems: "center", gap: 12 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  chooseTitle: { fontSize: 24, textAlign: "center" },
  chooseSubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 8 },
  options: { width: "100%", gap: 10 },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 15 },
  optionDesc: { fontSize: 13, marginTop: 2 },
  processingStep: { alignItems: "center", gap: 16, paddingHorizontal: 40 },
  processingTitle: { fontSize: 20 },
  processingDesc: { fontSize: 14, textAlign: "center" },
  cancelBtn: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 28, borderRadius: 8, borderWidth: 1 },
  cancelBtnText: { fontSize: 15 },
  reviewStep: { paddingHorizontal: 24, gap: 16 },
  reviewCard: {
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    alignItems: "center",
    gap: 10,
  },
  reviewTitle: { fontSize: 18 },
  reviewDesc: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  previewFields: { gap: 4, alignSelf: "stretch" },
  fieldRow: { fontSize: 14, lineHeight: 22 },
  fieldStatusList: { gap: 2, alignSelf: "stretch", marginTop: 4 },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  retakeBtnText: { fontSize: 15 },
  tryAgainBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    alignSelf: "stretch",
  },
  tryAgainText: { fontSize: 14 },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 6,
  },
  continueBtnInner: { alignItems: "center", gap: 2 },
  continueBtnRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  continueBtnText: { fontSize: 17 },
  continueBtnSubtitle: { fontSize: 12, opacity: 0.85 },
  retryBtn: { alignItems: "center" },
  retryText: { fontSize: 14 },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 24,
    gap: 16,
  },
  modalLabel: {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  typeToggleRow: {
    flexDirection: "row",
    gap: 10,
  },
  typeToggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  typeToggleText: { fontSize: 15 },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  modalCancelText: { fontSize: 15 },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
  },
  modalSaveText: { fontSize: 15 },
});
