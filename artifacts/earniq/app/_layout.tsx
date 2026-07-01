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
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Onboarding } from "@/components/Onboarding";
import { DataProvider } from "@/context/DataContext";

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
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setShowOnboarding(!val);
      setOnboardingChecked(true);
    });
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && onboardingChecked) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, onboardingChecked]);

  if ((!fontsLoaded && !fontError) || !onboardingChecked) return null;

  async function handleOnboardingComplete(goToPayPlan: boolean) {
    await AsyncStorage.setItem(ONBOARDING_KEY, "1");
    setShowOnboarding(false);
    if (goToPayPlan) {
      setTimeout(() => router.replace("/(tabs)/pay-plan"), 50);
    }
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <DataProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <RootLayoutNav />
              {showOnboarding && (
                <Onboarding onComplete={handleOnboardingComplete} />
              )}
            </KeyboardProvider>
          </GestureHandlerRootView>
        </DataProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
