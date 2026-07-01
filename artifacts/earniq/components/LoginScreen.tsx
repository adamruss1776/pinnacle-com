import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { activateDemoMode, isDemoCredentials } from "@/lib/demo-mode";

interface Props {
  onComplete: () => void;
}

export function LoginScreen({ onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  async function handleSignIn() {
    setError(null);
    const trimEmail = email.trim();
    const trimPass = password.trim();

    if (!trimEmail || !trimPass) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      if (isDemoCredentials(trimEmail, trimPass)) {
        await activateDemoMode();
        onComplete();
      } else {
        setError('Account sign-in is coming in a future update.\nTap "Continue without account" to get started.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: "#080808" }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View
        style={[
          styles.inner,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 },
        ]}
      >
        {/* Brand */}
        <View style={styles.brand}>
          <Image
            source={require("@/assets/images/logo.jpeg")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Your commission, always on track.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(null); }}
              placeholder="you@example.com"
              placeholderTextColor="#444"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              ref={passwordRef}
              style={styles.input}
              value={password}
              onChangeText={(v) => { setPassword(v); setError(null); }}
              placeholder="••••••••"
              placeholderTextColor="#444"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
            />
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={14} color="#f87171" style={{ marginTop: 1 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
            onPress={handleSignIn}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#080808" size="small" />
            ) : (
              <Text style={styles.signInBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Guest path */}
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity
          style={styles.guestBtn}
          onPress={onComplete}
          activeOpacity={0.7}
        >
          <Text style={styles.guestText}>Continue without account</Text>
          <Ionicons name="arrow-forward" size={14} color="#666" />
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://earniq.replit.app/privacy")}
            activeOpacity={0.7}
          >
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
    gap: 0,
  },
  brand: {
    alignItems: "center",
    marginBottom: 44,
    gap: 12,
  },
  logo: {
    width: 200,
    height: 200,
    borderRadius: 36,
  },
  tagline: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#666",
    textAlign: "center",
  },
  form: { gap: 14 },
  fieldGroup: { gap: 6 },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#888",
    marginLeft: 2,
  },
  input: {
    height: 50,
    borderRadius: 12,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#222",
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#fff",
  },
  errorBox: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
    paddingHorizontal: 2,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#f87171",
    flex: 1,
    lineHeight: 18,
  },
  signInBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#4ade80",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  signInBtnDisabled: { opacity: 0.7 },
  signInBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#080808",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 24,
  },
  divider: { flex: 1, height: 1, backgroundColor: "#1a1a1a" },
  dividerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#444",
  },
  guestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  guestText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#666",
  },
  footer: {
    alignItems: "center",
    marginTop: 36,
  },
  footerLink: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#333",
    textDecorationLine: "underline",
  },
});
