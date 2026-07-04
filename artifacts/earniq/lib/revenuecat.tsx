import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import Purchases from "react-native-purchases";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";

import { DEMO_MODE_KEY } from "@/lib/demo-mode";

const REVENUECAT_TEST_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
const REVENUECAT_IOS_API_KEY =
  (Constants.expoConfig?.extra?.revenueCatIosApiKey as string | undefined) ||
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ||
  "appl_WoycQNRYhGaBZJuLbCNEtnsIPOA";
const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

export const REVENUECAT_ENTITLEMENT_IDENTIFIER = "pro";

// Module-level flag so query functions know whether configure() has run.
let _rcReady = false;

function getRevenueCatApiKey() {
  if (__DEV__ || Platform.OS === "web") {
    return REVENUECAT_TEST_API_KEY;
  }

  if (Platform.OS === "ios") {
    return REVENUECAT_IOS_API_KEY;
  }

  if (Platform.OS === "android") {
    return REVENUECAT_ANDROID_API_KEY;
  }

  return REVENUECAT_TEST_API_KEY;
}

export function initializeRevenueCat() {
  if (_rcReady) return; // already configured
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) throw new Error("RevenueCat Public API Key not found");

  Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey });
  _rcReady = true;
}

function useSubscriptionContext() {
  const queryClient = useQueryClient();

  const customerInfoQuery = useQuery({
    queryKey: ["revenuecat", "customer-info"],
    queryFn: async () => {
      if (!_rcReady) return null;
      try {
        const info = await Purchases.getCustomerInfo();
        return info;
      } catch {
        return null;
      }
    },
    staleTime: 60 * 1000,
    retry: 2,
  });

  const offeringsQuery = useQuery({
    queryKey: ["revenuecat", "offerings"],
    queryFn: async () => {
      if (!_rcReady) return null;
      try {
        const offerings = await Purchases.getOfferings();
        return offerings;
      } catch {
        return null;
      }
    },
    staleTime: 300 * 1000,
    retry: 2,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (packageToPurchase: any) => {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return customerInfo;
    },
    onSuccess: (customerInfo) => {
      queryClient.setQueryData(["revenuecat", "customer-info"], customerInfo);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      return Purchases.restorePurchases();
    },
    onSuccess: (customerInfo) => {
      queryClient.setQueryData(["revenuecat", "customer-info"], customerInfo);
    },
  });

  const rcSubscribed =
    customerInfoQuery.data?.entitlements.active?.[REVENUECAT_ENTITLEMENT_IDENTIFIER] !== undefined;

  return {
    customerInfo: customerInfoQuery.data,
    offerings: offeringsQuery.data,
    rcSubscribed,
    isLoading: customerInfoQuery.isLoading || offeringsQuery.isLoading,
    purchase: purchaseMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
    purchaseError: purchaseMutation.error,
  };
}

type SubscriptionContextValue = ReturnType<typeof useSubscriptionContext> & {
  isSubscribed: boolean;
};
const Context = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const value = useSubscriptionContext();
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Initialize RC inside a useEffect so any native crash here does NOT
  // kill the process before the React tree has rendered.
  useEffect(() => {
    try {
      initializeRevenueCat();
    } catch (err: any) {
      console.warn("[RC] init failed:", err?.message);
    }
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(DEMO_MODE_KEY).then((val) => {
      setIsDemoMode(val === "1");
    });
  }, []);

  const combined: SubscriptionContextValue = {
    ...value,
    isSubscribed: isDemoMode || value.rcSubscribed,
  };

  return <Context.Provider value={combined}>{children}</Context.Provider>;
}

export function useSubscription() {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return ctx;
}
