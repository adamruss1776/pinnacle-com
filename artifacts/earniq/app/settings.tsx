import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { logout } from "@/lib/logout";
import { useSubscription } from "@/lib/revenuecat";

const PRIVACY_URL = "https://earniq.replit.app/privacy";
const TERMS_URL = "https://earniq.replit.app/terms";
const SUPPORT_EMAIL = "support@earniq.app";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { restore, isRestoring } = useSubscription();
  const version = Constants.expoConfig?.version ?? "1.0.0";

  async function handleRestore() {
    try {
      await restore();
      Alert.alert("Purchases Restored", "Your subscription has been restored.");
    } catch {
      Alert.alert("Restore Failed", "No previous purchases found for this account.");
    }
  }

  async function handleLogout() {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  }

  function openUrl(url: string) {
    Linking.openURL(url);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === "web" ? 67 : insets.top + 16,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
          Settings
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Account */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          Account
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingsRow
            label="Log Out"
            colors={colors}
            destructive
            onPress={handleLogout}
          />
        </View>

        {/* Subscriptions */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          Subscriptions
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingsRow
            label={isRestoring ? "Restoring…" : "Restore Purchases"}
            colors={colors}
            onPress={handleRestore}
            disabled={isRestoring}
          />
        </View>

        {/* Legal */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          Legal
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingsRow
            label="Privacy Policy"
            colors={colors}
            onPress={() => openUrl(PRIVACY_URL)}
            showChevron
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingsRow
            label="Terms of Service"
            colors={colors}
            onPress={() => openUrl(TERMS_URL)}
            showChevron
          />
        </View>

        {/* Support */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          Support
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingsRow
            label="Contact Support"
            colors={colors}
            onPress={() => openUrl(`mailto:${SUPPORT_EMAIL}`)}
            showChevron
          />
        </View>

        {/* About */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          About
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingsRow
            label="App Version"
            colors={colors}
            value={version}
          />
        </View>
      </ScrollView>
    </View>
  );
}

interface RowProps {
  label: string;
  colors: ReturnType<typeof useColors>;
  onPress?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
  value?: string;
}

function SettingsRow({ label, colors, onPress, destructive, disabled, showChevron, value }: RowProps) {
  const labelColor = destructive ? "#f87171" : disabled ? colors.mutedForeground : colors.text;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress || disabled}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <Text style={[styles.rowLabel, { color: labelColor, fontFamily: "Inter_400Regular" }]}>
        {label}
      </Text>
      {value !== undefined && (
        <Text style={[styles.rowValue, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {value}
        </Text>
      )}
      {showChevron && (
        <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4 },
  title: { flex: 1, textAlign: "center", fontSize: 17 },
  headerSpacer: { width: 32 },
  content: { paddingTop: 24, paddingHorizontal: 16, gap: 8 },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: 16,
    marginBottom: 6,
    marginLeft: 4,
  },
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },
  rowLabel: { flex: 1, fontSize: 16 },
  rowValue: { fontSize: 16, marginRight: 4 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
});
