import type { PayPlan } from "@/context/DataContext";

export interface CommissionResult {
  commission: number;
  frontCommission: number;
  backCommission: number;
  isCapped: boolean;
}

export function calcCommission(
  type: "new" | "used",
  frontGross: number,
  backGross: number,
  split: number,
  payPlan: PayPlan
): CommissionResult {
  const frontPct =
    type === "new" ? payPlan.newFrontPct / 100 : payPlan.usedFrontPct / 100;
  const frontCap =
    type === "new" ? payPlan.newFrontCap : payPlan.usedFrontCap;
  const backPct = payPlan.backPct / 100;

  const rawFront = frontGross * frontPct;
  const frontCommission =
    payPlan.enforceCaps ? Math.min(rawFront, frontCap) : rawFront;
  const isCapped = payPlan.enforceCaps && rawFront > frontCap;

  const backCommission = backGross * backPct;
  const total = (frontCommission + backCommission) * split;

  return {
    commission: total,
    frontCommission,
    backCommission,
    isCapped,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return dateStr;
  const [y, m, d] = parts;
  return `${m}-${d}-${y}`;
}

export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

export function isThisMonth(dateStr: string): boolean {
  const date = parseDateLocal(dateStr);
  const now = new Date();
  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

export function isThisYear(dateStr: string): boolean {
  const date = parseDateLocal(dateStr);
  const now = new Date();
  return date.getFullYear() === now.getFullYear();
}
