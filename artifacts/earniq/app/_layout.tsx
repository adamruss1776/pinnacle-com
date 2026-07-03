import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoginScreen } from "@/components/LoginScreen";
import { Onboarding } from "@/components/Onboarding";
import { DataProvider } from "@/context/DataContext";
import { DEMO_MODE_KEY } from "@/lib/demo-mode";
import { registerLogoutListener } from "@/lib/logout";
import { initializeRevenueCat, SubscriptionProvider } from "@/lib/revenuecat";

const queryClient = new QueryClient();

const LOGIN_DONE_KEY = "@earniq_login_done";
const ONBOARDING_KEY = "@earniq_onboarded";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="log-deal"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="log-spiff"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="import"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="settings"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}

function MainAppLayout() {
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(ONBOARDING_KEY),
      AsyncStorage.getItem(DEMO_MODE_KEY),
    ]).then(([onboarded, demo]) => {
      setShowOnboarding(!onboarded && demo !== "1");
      setOnboardingChecked(true);
    });
  }, []);

  if (!onboardingChecked) return null;

  async function handleOnboardingComplete(goToPayPlan: boolean) {
    await AsyncStorage.setItem(ONBOARDING_KEY, "1");
    setShowOnboarding(false);
    if (goToPayPlan) {
      setTimeout(() => router.replace("/(tabs)/pay-plan"), 50);
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <DataProvider>
            <SubscriptionProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <RootLayoutNav />
                {showOnboarding && (
                  <Onboarding onComplete={handleOnboardingComplete} />
                )}
              </GestureHandlerRootView>
            </SubscriptionProvider>
          </DataProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [loginDone, setLoginDone] = useState<boolean | null>(null);

  // Initialize RevenueCat after first render so a native crash here
  // doesn't kill the process before the UI tree is mounted.
  useEffect(() => {
    try {
      initializeRevenueCat();
    } catch (err: any) {
      Alert.alert("RevenueCat Unavailable", err?.message ?? "Unknown error");
    }
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(LOGIN_DONE_KEY).then((val) => {
      setLoginDone(!!val);
    });
  }, []);

  useEffect(() => {
    registerLogoutListener(() => setLoginDone(false));
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && loginDone !== null) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, loginDone]);

  if ((!fontsLoaded && !fontError) || loginDone === null) return null;

  if (!loginDone) {
    return (
      <SafeAreaProvider>
        <LoginScreen
          onComplete={async () => {
            await AsyncStorage.setItem(LOGIN_DONE_KEY, "1");
            setLoginDone(true);
          }}
        />
      </SafeAreaProvider>
    );
  }

  return <MainAppLayout />;
}
