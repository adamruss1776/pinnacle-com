import AsyncStorage from "@react-native-async-storage/async-storage";

import { DEMO_MODE_KEY } from "@/lib/demo-mode";

const DEMO_SEEDED_KEY = "@earniq_demo_seeded";
const LOGIN_DONE_KEY = "@earniq_login_done";
const ONBOARDING_KEY = "@earniq_onboarded";

let _listener: (() => void) | null = null;

export function registerLogoutListener(fn: () => void): void {
  _listener = fn;
}

export async function logout(): Promise<void> {
  await AsyncStorage.multiRemove([
    LOGIN_DONE_KEY,
    ONBOARDING_KEY,
    DEMO_MODE_KEY,
    DEMO_SEEDED_KEY,
  ]);
  _listener?.();
}
