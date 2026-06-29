import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Deal, PayPlan, Spiff } from "@/context/DataContext";

function escapeCsv(value: string | number | boolean): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(...fields: (string | number | boolean)[]): string {
  return fields.map(escapeCsv).join(",");
}

export async function exportDataAsCsv(
  deals: Deal[],
  spiffs: Spiff[],
  payPlan: PayPlan
): Promise<void> {
  const lines: string[] = [];

  lines.push("EARNIQ DATA EXPORT");
  lines.push(`Exported: ${new Date().toLocaleString()}`);
  lines.push("");

  lines.push("=== DEALS ===");
  lines.push(
    row(
      "Date",
      "Vehicle",
      "Stock #",
      "Type",
      "Front Gross",
      "Back Gross",
      "Split",
      "Partner",
      "Commission",
      "Capped",
      "Notes"
    )
  );
  for (const d of deals) {
    lines.push(
      row(
        d.date,
        d.vehicleName,
        d.stockNumber,
        d.type,
        d.frontGross,
        d.backGross,
        d.split,
        d.partnerName,
        d.commission,
        d.isCapped ? "Yes" : "No",
        d.notes
      )
    );
  }

  lines.push("");
  lines.push("=== SPIFFS ===");
  lines.push(row("Date", "Description", "Amount"));
  for (const s of spiffs) {
    lines.push(row(s.date, s.description, s.amount));
  }

  lines.push("");
  lines.push("=== PAY PLAN ===");
  lines.push(row("Setting", "Value"));
  lines.push(row("New Front %", payPlan.newFrontPct));
  lines.push(row("New Front Cap", payPlan.newFrontCap));
  lines.push(row("Used Front %", payPlan.usedFrontPct));
  lines.push(row("Used Front Cap", payPlan.usedFrontCap));
  lines.push(row("Back End %", payPlan.backPct));
  lines.push(row("Enforce Caps", payPlan.enforceCaps ? "Yes" : "No"));

  const csvContent = lines.join("\n");

  const dateStamp = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  const fileName = `earniq_backup_${dateStamp}.csv`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error("Sharing is not available on this device.");
  }

  await Sharing.shareAsync(filePath, {
    mimeType: "text/csv",
    dialogTitle: "Export EarnIQ Data",
    UTI: "public.comma-separated-values-text",
  });
}
