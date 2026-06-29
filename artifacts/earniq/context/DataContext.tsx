import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { calcCommission, generateId, isThisMonth, isThisYear } from "@/utils/commission";

export interface Deal {
  id: string;
  date: string;
  vehicleName: string;
  stockNumber: string;
  type: "new" | "used";
  frontGross: number;
  backGross: number;
  split: number;
  partnerName: string;
  notes: string;
  commission: number;
  isCapped: boolean;
  createdAt: string;
}

export interface Spiff {
  id: string;
  date: string;
  description: string;
  amount: number;
  createdAt: string;
}

export interface PayPlan {
  newFrontPct: number;
  newFrontCap: number;
  usedFrontPct: number;
  usedFrontCap: number;
  backPct: number;
  enforceCaps: boolean;
}

export const DEFAULT_PAY_PLAN: PayPlan = {
  newFrontPct: 15,
  newFrontCap: 6000,
  usedFrontPct: 20,
  usedFrontCap: 7500,
  backPct: 10,
  enforceCaps: true,
};

interface DataContextValue {
  deals: Deal[];
  spiffs: Spiff[];
  payPlan: PayPlan;
  isLoading: boolean;
  addDeal: (deal: Omit<Deal, "id" | "createdAt" | "commission" | "isCapped">) => void;
  deleteDeal: (id: string) => void;
  addSpiff: (spiff: Omit<Spiff, "id" | "createdAt">) => void;
  deleteSpiff: (id: string) => void;
  updatePayPlan: (plan: PayPlan) => void;
  mtdCommission: number;
  ytdCommission: number;
  avgCommissionPerDeal: number;
  recentDeals: Deal[];
}

const DEALS_KEY = "@earniq_deals";
const SPIFFS_KEY = "@earniq_spiffs";
const PAYPLAN_KEY = "@earniq_payplan";

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [spiffs, setSpiffs] = useState<Spiff[]>([]);
  const [payPlan, setPayPlan] = useState<PayPlan>(DEFAULT_PAY_PLAN);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dealsRaw, spiffsRaw, planRaw] = await Promise.all([
          AsyncStorage.getItem(DEALS_KEY),
          AsyncStorage.getItem(SPIFFS_KEY),
          AsyncStorage.getItem(PAYPLAN_KEY),
        ]);
        if (dealsRaw) setDeals(JSON.parse(dealsRaw));
        if (spiffsRaw) setSpiffs(JSON.parse(spiffsRaw));
        if (planRaw) setPayPlan(JSON.parse(planRaw));
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const addDeal = useCallback(
    (dealData: Omit<Deal, "id" | "createdAt" | "commission" | "isCapped">) => {
      const result = calcCommission(
        dealData.type,
        dealData.frontGross,
        dealData.backGross,
        dealData.split,
        payPlan
      );
      const newDeal: Deal = {
        ...dealData,
        id: generateId(),
        createdAt: new Date().toISOString(),
        commission: result.commission,
        isCapped: result.isCapped,
      };
      setDeals((prev) => {
        const updated = [newDeal, ...prev];
        AsyncStorage.setItem(DEALS_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    [payPlan]
  );

  const deleteDeal = useCallback((id: string) => {
    setDeals((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      AsyncStorage.setItem(DEALS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addSpiff = useCallback(
    (spiffData: Omit<Spiff, "id" | "createdAt">) => {
      const newSpiff: Spiff = {
        ...spiffData,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      setSpiffs((prev) => {
        const updated = [newSpiff, ...prev];
        AsyncStorage.setItem(SPIFFS_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const deleteSpiff = useCallback((id: string) => {
    setSpiffs((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      AsyncStorage.setItem(SPIFFS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updatePayPlan = useCallback((plan: PayPlan) => {
    setPayPlan(plan);
    AsyncStorage.setItem(PAYPLAN_KEY, JSON.stringify(plan));
  }, []);

  const mtdDeals = deals.filter((d) => isThisMonth(d.date));
  const ytdDeals = deals.filter((d) => isThisYear(d.date));
  const mtdSpiffs = spiffs.filter((s) => isThisMonth(s.date));

  const mtdCommission =
    mtdDeals.reduce((sum, d) => sum + d.commission, 0) +
    mtdSpiffs.reduce((sum, s) => sum + s.amount, 0);

  const ytdCommission =
    ytdDeals.reduce((sum, d) => sum + d.commission, 0) +
    spiffs.filter((s) => isThisYear(s.date)).reduce((sum, s) => sum + s.amount, 0);

  const avgCommissionPerDeal =
    deals.length > 0
      ? deals.reduce((sum, d) => sum + d.commission, 0) / deals.length
      : 0;

  const recentDeals = deals.slice(0, 5);

  return (
    <DataContext.Provider
      value={{
        deals,
        spiffs,
        payPlan,
        isLoading,
        addDeal,
        deleteDeal,
        addSpiff,
        deleteSpiff,
        updatePayPlan,
        mtdCommission,
        ytdCommission,
        avgCommissionPerDeal,
        recentDeals,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
