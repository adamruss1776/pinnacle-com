import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PurchasesPackage } from "react-native-purchases";

import { useSubscription } from "@/lib/revenuecat";
import { useColors } from "@/hooks/useColors";

const MONTHLY_PRICE_DISPLAY = "$3.99/mo";
const ANNUAL_PRICE_DISPLAY = "$29.99/yr";

const PRO_FEATURES = [
  { icon: "trending-up-outline" as const, text: "Projected month-end commission" },
  { icon: "flag-outline" as const, text: "Goal tracking with pace alerts" },
  { icon: "camera-outline" as const, text: "OCR deal sheet photo import" },
  { icon: "time-outline" as const, text: "Full deal history — all time" },
  { icon: "bar-chart-outline" as const, text: "6-month commission trend chart" },
  { icon: "download-outline" as const, text: "CSV export" },
  { icon: "calendar-outline" as const, text: "YTD commission total" },
];

interface ConfirmModalProps {
  visible: boolean;
  packageLabel: string;
  price: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ visible, packageLabel, price, onConfirm, onCancel }: ConfirmModalProps) {
  const colors = useColors();
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.confirmOverlay}>
        <View style={[styles.confirmBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.confirmTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Confirm Purchase
          </Text>
          <Text style={[styles.confirmBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Subscribe to EarnIQ Pro {packageLabel} for {price}?
          </Text>
          <View style={styles.confirmBtns}>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
              onPress={onCancel}
            >
              <Text style={[styles.confirmBtnText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: colors.green }]}
              onPress={onConfirm}
            >
              <Text style={[styles.confirmBtnText, { color: "#080808", fontFamily: "Inter_600SemiBold" }]}>
                Subscribe
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PaywallModal({ visible, onClose }: PaywallModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { offerings, purchase, restore, isPurchasing, isRestoring } = useSubscription();

  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pendingPkg, setPendingPkg] = useState<PurchasesPackage | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [restoredMsg, setRestoredMsg] = useState<string | null>(null);

  const currentOffering = offerings?.current;
  const monthlyPkg = currentOffering?.monthly ?? null;
  const annualPkg = currentOffering?.annual ?? null;

  const activePkg = selectedPackage ?? annualPkg;

  function handleSelectPackage(pkg: PurchasesPackage) {
    setSelectedPackage(pkg);
    setErrorMsg(null);
  }

  function handlePurchasePress() {
    if (!activePkg) return;
    setErrorMsg(null);
    setPendingPkg(activePkg);
    setConfirming(true);
  }

  async function handleConfirmPurchase() {
    if (!pendingPkg) return;
    setConfirming(false);
    try {
      await purchase(pendingPkg);
      onClose();
    } catch (e: any) {
      if (e?.userCancelled) return;
      setErrorMsg(e?.message ?? "Purchase failed. Please try again.");
    }
  }

  async function handleRestore() {
    setErrorMsg(null);
    setRestoredMsg(null);
    try {
      await restore();
      setRestoredMsg("Purchases restored successfully!");
      setTimeout(() => {
        setRestoredMsg(null);
        onClose();
      }, 1500);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Restore failed. Please try again.");
    }
  }

  function getPackageLabel(pkg: PurchasesPackage | null) {
    if (!pkg) return "";
    return pkg.packageType === "ANNUAL" || pkg.identifier === "$rc_annual" ? "Annual" : "Monthly";
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: "#0a0a0a", paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
        {/* Header */}
        <View style={styles.header}>
          <View />
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Badge */}
          <View style={[styles.badge, { backgroundColor: "#0d1f14", borderColor: "#1a3d28" }]}>
            <Ionicons name="star" size={14} color="#4ade80" />
            <Text style={[styles.badgeText, { color: "#4ade80", fontFamily: "Inter_600SemiBold" }]}>
              EarnIQ Pro
            </Text>
          </View>

          <Text style={[styles.headline, { color: "#ffffff", fontFamily: "Inter_700Bold" }]}>
            Know exactly where{"\n"}you stand, every day.
          </Text>
          <Text style={[styles.subtext, { color: "#888888", fontFamily: "Inter_400Regular" }]}>
            Unlock the tools that help you hit your number.
          </Text>

          {/* Features */}
          <View style={[styles.featuresCard, { backgroundColor: "#111111", borderColor: "#222222" }]}>
            {PRO_FEATURES.map((f) => (
              <View key={f.text} style={styles.featureRow}>
                <View style={[styles.featureIconWrap, { backgroundColor: "#0d1f14" }]}>
                  <Ionicons name={f.icon} size={16} color="#4ade80" />
                </View>
                <Text style={[styles.featureText, { color: "#e5e5e5", fontFamily: "Inter_400Regular" }]}>
                  {f.text}
                </Text>
              </View>
            ))}
          </View>

          {/* Package Selection */}
          {currentOffering ? (
            <View style={styles.packages}>
              {annualPkg && (
                <TouchableOpacity
                  style={[
                    styles.packageCard,
                    {
                      backgroundColor: "#111111",
                      borderColor: activePkg?.identifier === annualPkg.identifier ? "#4ade80" : "#222222",
                      borderWidth: activePkg?.identifier === annualPkg.identifier ? 2 : 1,
                    },
                  ]}
                  onPress={() => handleSelectPackage(annualPkg)}
                  activeOpacity={0.8}
                >
                  <View style={styles.packageLeft}>
                    <View style={styles.packageLabelRow}>
                      <Text style={[styles.packageName, { color: "#ffffff", fontFamily: "Inter_600SemiBold" }]}>
                        Annual
                      </Text>
                      <View style={[styles.saveBadge, { backgroundColor: "#0d1f14" }]}>
                        <Text style={[styles.saveBadgeText, { color: "#4ade80", fontFamily: "Inter_600SemiBold" }]}>
                          Best Value
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.packageSub, { color: "#666666", fontFamily: "Inter_400Regular" }]}>
                      {ANNUAL_PRICE_DISPLAY}
                    </Text>
                  </View>
                  <View style={styles.packageRight}>
                    <View style={[
                      styles.radioCircle,
                      {
                        borderColor: activePkg?.identifier === annualPkg.identifier ? "#4ade80" : "#444444",
                        backgroundColor: activePkg?.identifier === annualPkg.identifier ? "#4ade80" : "transparent",
                      },
                    ]} />
                  </View>
                </TouchableOpacity>
              )}

              {monthlyPkg && (
                <TouchableOpacity
                  style={[
                    styles.packageCard,
                    {
                      backgroundColor: "#111111",
                      borderColor: activePkg?.identifier === monthlyPkg.identifier ? "#4ade80" : "#222222",
                      borderWidth: activePkg?.identifier === monthlyPkg.identifier ? 2 : 1,
                    },
                  ]}
                  onPress={() => handleSelectPackage(monthlyPkg)}
                  activeOpacity={0.8}
                >
                  <View style={styles.packageLeft}>
                    <Text style={[styles.packageName, { color: "#ffffff", fontFamily: "Inter_600SemiBold" }]}>
                      Monthly
                    </Text>
                    <Text style={[styles.packageSub, { color: "#666666", fontFamily: "Inter_400Regular" }]}>
                      {MONTHLY_PRICE_DISPLAY}
                    </Text>
                  </View>
                  <View style={styles.packageRight}>
                    <View style={[
                      styles.radioCircle,
                      {
                        borderColor: activePkg?.identifier === monthlyPkg.identifier ? "#4ade80" : "#444444",
                        backgroundColor: activePkg?.identifier === monthlyPkg.identifier ? "#4ade80" : "transparent",
                      },
                    ]} />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#4ade80" />
              <Text style={[styles.loadingText, { color: "#666666", fontFamily: "Inter_400Regular" }]}>
                Loading plans…
              </Text>
            </View>
          )}

          {/* Error / Success */}
          {errorMsg && (
            <View style={[styles.alertBox, { backgroundColor: "#2d1010", borderColor: "#7c2020" }]}>
              <Text style={[styles.alertText, { color: "#f87171", fontFamily: "Inter_400Regular" }]}>
                {errorMsg}
              </Text>
            </View>
          )}
          {restoredMsg && (
            <View style={[styles.alertBox, { backgroundColor: "#0d1f14", borderColor: "#1a3d28" }]}>
              <Text style={[styles.alertText, { color: "#4ade80", fontFamily: "Inter_400Regular" }]}>
                {restoredMsg}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* CTA */}
        <View style={styles.cta}>
          <TouchableOpacity
            style={[
              styles.purchaseBtn,
              { backgroundColor: "#4ade80", opacity: isPurchasing || !activePkg ? 0.7 : 1 },
            ]}
            onPress={handlePurchasePress}
            disabled={isPurchasing || !activePkg}
            activeOpacity={0.85}
          >
            {isPurchasing ? (
              <ActivityIndicator color="#080808" />
            ) : (
              <Text style={[styles.purchaseBtnText, { fontFamily: "Inter_700Bold" }]}>
                {activePkg
                  ? `Start Pro — ${getPackageLabel(activePkg) === "Annual" ? ANNUAL_PRICE_DISPLAY : MONTHLY_PRICE_DISPLAY}`
                  : "Loading…"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRestore}
            disabled={isRestoring}
            style={styles.restoreBtn}
            activeOpacity={0.7}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color="#666666" />
            ) : (
              <Text style={[styles.restoreText, { color: "#666666", fontFamily: "Inter_400Regular" }]}>
                Restore Purchases
              </Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.legalText, { color: "#444444", fontFamily: "Inter_400Regular" }]}>
            Cancel anytime. Subscription auto-renews unless cancelled at least 24 hours before the end of the current period.
          </Text>
        </View>
      </View>

      <ConfirmModal
        visible={confirming}
        packageLabel={getPackageLabel(pendingPkg)}
        price={getPackageLabel(pendingPkg) === "Annual" ? ANNUAL_PRICE_DISPLAY : MONTHLY_PRICE_DISPLAY}
        onConfirm={handleConfirmPurchase}
        onCancel={() => setConfirming(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, gap: 16, paddingBottom: 16 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: { fontSize: 13 },
  headline: { fontSize: 32, textAlign: "center", lineHeight: 40, marginTop: 4 },
  subtext: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  featuresCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: { fontSize: 14, flex: 1 },
  packages: { gap: 10 },
  packageCard: {
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  packageLeft: { gap: 4, flex: 1 },
  packageLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  packageName: { fontSize: 16 },
  packageSub: { fontSize: 13 },
  packageRight: {},
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  saveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  saveBadgeText: { fontSize: 11 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "center", paddingVertical: 20 },
  loadingText: { fontSize: 14 },
  alertBox: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  alertText: { fontSize: 13, lineHeight: 18 },
  cta: { paddingHorizontal: 24, gap: 12 },
  purchaseBtn: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
  },
  purchaseBtnText: { fontSize: 17, color: "#080808" },
  restoreBtn: { alignItems: "center", paddingVertical: 4 },
  restoreText: { fontSize: 14 },
  legalText: { fontSize: 11, textAlign: "center", lineHeight: 16 },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  confirmBox: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    width: "100%",
    gap: 16,
  },
  confirmTitle: { fontSize: 18, textAlign: "center" },
  confirmBody: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  confirmBtns: { flexDirection: "row", gap: 10 },
  confirmBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  confirmBtnText: { fontSize: 15 },
});
