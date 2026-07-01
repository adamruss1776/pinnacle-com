import AsyncStorage from "@react-native-async-storage/async-storage";

export const DEMO_MODE_KEY = "@earniq_demo_mode";
const DEMO_SEEDED_KEY = "@earniq_demo_seeded";
const DEMO_EMAIL = process.env.EXPO_PUBLIC_DEMO_EMAIL ?? "";
const DEMO_PASSCODE = process.env.EXPO_PUBLIC_DEMO_PASSCODE ?? "";

export function isDemoCredentials(email: string, passcode: string): boolean {
  if (!DEMO_EMAIL || !DEMO_PASSCODE) return false;
  return (
    email.trim().toLowerCase() === DEMO_EMAIL.toLowerCase() &&
    passcode.trim() === DEMO_PASSCODE
  );
}

export async function activateDemoMode(): Promise<void> {
  await AsyncStorage.setItem(DEMO_MODE_KEY, "1");
  await seedDemoDataIfNeeded();
}

export async function isDemoModeActive(): Promise<boolean> {
  const val = await AsyncStorage.getItem(DEMO_MODE_KEY);
  return val === "1";
}

async function seedDemoDataIfNeeded(): Promise<void> {
  const already = await AsyncStorage.getItem(DEMO_SEEDED_KEY);
  if (already === "1") return;

  const payPlan = {
    newFrontPct: 15,
    newFrontCap: 6000,
    usedFrontPct: 20,
    usedFrontCap: 7500,
    backPct: 10,
    enforceCaps: true,
  };
  const goals = { unitGoal: 12, commissionGoal: 8000 };

  const deals = [
    {
      id: "demo-d1",
      date: "2026-07-02",
      vehicleName: "2024 Toyota Camry XSE",
      stockNumber: "TC-4821",
      type: "new",
      frontGross: 4200,
      backGross: 1100,
      split: 100,
      partnerName: "",
      notes: "",
      commission: 740,
      isCapped: false,
      createdAt: "2026-07-02T09:15:00.000Z",
    },
    {
      id: "demo-d2",
      date: "2026-07-08",
      vehicleName: "2022 Honda Accord Sport",
      stockNumber: "HA-2931",
      type: "used",
      frontGross: 3500,
      backGross: 950,
      split: 100,
      partnerName: "",
      notes: "",
      commission: 795,
      isCapped: false,
      createdAt: "2026-07-08T14:22:00.000Z",
    },
    {
      id: "demo-d3",
      date: "2026-07-14",
      vehicleName: "2024 Ford F-150 XLT",
      stockNumber: "FF-7392",
      type: "new",
      frontGross: 5500,
      backGross: 1300,
      split: 100,
      partnerName: "",
      notes: "",
      commission: 955,
      isCapped: false,
      createdAt: "2026-07-14T11:08:00.000Z",
    },
    {
      id: "demo-d4",
      date: "2026-07-19",
      vehicleName: "2021 Chevrolet Silverado LT",
      stockNumber: "CS-8810",
      type: "used",
      frontGross: 2800,
      backGross: 750,
      split: 100,
      partnerName: "",
      notes: "",
      commission: 635,
      isCapped: false,
      createdAt: "2026-07-19T16:45:00.000Z",
    },
    {
      id: "demo-d5",
      date: "2026-07-25",
      vehicleName: "2025 Hyundai Tucson SEL",
      stockNumber: "HT-1192",
      type: "new",
      frontGross: 6200,
      backGross: 1000,
      split: 100,
      partnerName: "",
      notes: "",
      commission: 1030,
      isCapped: false,
      createdAt: "2026-07-25T10:30:00.000Z",
    },
    {
      id: "demo-d6",
      date: "2026-06-12",
      vehicleName: "2022 RAM 1500 Big Horn",
      stockNumber: "RB-3920",
      type: "used",
      frontGross: 4000,
      backGross: 1200,
      split: 100,
      partnerName: "",
      notes: "",
      commission: 920,
      isCapped: false,
      createdAt: "2026-06-12T13:10:00.000Z",
    },
    {
      id: "demo-d7",
      date: "2026-06-27",
      vehicleName: "2023 Nissan Altima SR",
      stockNumber: "NA-5511",
      type: "new",
      frontGross: 3800,
      backGross: 900,
      split: 100,
      partnerName: "",
      notes: "",
      commission: 660,
      isCapped: false,
      createdAt: "2026-06-27T09:55:00.000Z",
    },
  ];

  const spiffs = [
    {
      id: "demo-s1",
      date: "2026-07-18",
      description: "Weekend Sales Contest",
      amount: 200,
      createdAt: "2026-07-18T17:00:00.000Z",
    },
    {
      id: "demo-s2",
      date: "2026-06-15",
      description: "Customer Satisfaction Bonus",
      amount: 150,
      createdAt: "2026-06-15T12:00:00.000Z",
    },
  ];

  await Promise.all([
    AsyncStorage.setItem("@earniq_deals", JSON.stringify(deals)),
    AsyncStorage.setItem("@earniq_spiffs", JSON.stringify(spiffs)),
    AsyncStorage.setItem("@earniq_payplan", JSON.stringify(payPlan)),
    AsyncStorage.setItem("@earniq_goals", JSON.stringify(goals)),
    AsyncStorage.setItem("@earniq_onboarded", "1"),
    AsyncStorage.setItem(DEMO_SEEDED_KEY, "1"),
  ]);
}
