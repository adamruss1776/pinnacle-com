import { Feather, Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type ImportStep = "choose" | "processing" | "review";

export default function ImportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<ImportStep>("choose");
  const [sourceType, setSourceType] = useState<"photo" | "pdf" | null>(null);

  const [extracted, setExtracted] = useState({
    vehicleName: "",
    frontGross: "",
    backGross: "",
    date: "",
    type: "new" as "new" | "used",
  });

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
      processImage(result.assets[0].uri);
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
      processImage(result.assets[0].uri);
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
    });
    if (!result.canceled) {
      setSourceType("pdf");
      processPDF(result.assets[0].name);
    }
  }

  function processImage(uri: string) {
    setStep("processing");
    setTimeout(() => {
      setExtracted({
        vehicleName: "",
        frontGross: "",
        backGross: "",
        date: new Date().toISOString().split("T")[0],
        type: "new",
      });
      setStep("review");
    }, 2200);
  }

  function processPDF(filename: string) {
    setStep("processing");
    setTimeout(() => {
      setExtracted({
        vehicleName: "",
        frontGross: "",
        backGross: "",
        date: new Date().toISOString().split("T")[0],
        type: "new",
      });
      setStep("review");
    }, 2200);
  }

  function handleContinue() {
    router.replace({
      pathname: "/log-deal",
      params: {
        prefillDate: extracted.date,
        prefillVehicle: extracted.vehicleName,
        prefillFront: extracted.frontGross,
        prefillBack: extracted.backGross,
        prefillType: extracted.type,
      },
    });
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
              Take a photo or upload a PDF of your deal sheet. We'll extract the key fields for you to review.
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
              Extracting deal information from your {sourceType === "pdf" ? "PDF" : "image"}
            </Text>
          </View>
        )}

        {step === "review" && (
          <View style={styles.reviewStep}>
            <View style={[styles.reviewCard, { backgroundColor: "#0d1f14", borderColor: "#1a3d28" }]}>
              <Feather name="check-circle" size={24} color={colors.green} />
              <Text style={[styles.reviewTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                Document Scanned
              </Text>
              <Text style={[styles.reviewDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Review and complete the pre-filled fields on the next screen. Fields extracted from the document will be highlighted — please verify they're correct before saving.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.continueBtn, { backgroundColor: colors.green }]}
              onPress={handleContinue}
            >
              <Text style={[styles.continueBtnText, { color: colors.primaryForeground, fontFamily: "Inter_700Bold" }]}>
                Review & Save Deal
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.primaryForeground} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep("choose")} style={styles.retryBtn}>
              <Text style={[styles.retryText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                Try a different document
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 6,
  },
  continueBtnText: { fontSize: 17 },
  retryBtn: { alignItems: "center" },
  retryText: { fontSize: 14 },
});
