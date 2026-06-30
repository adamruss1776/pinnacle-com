export type ExtractedFields = {
  vehicleName: string;
  frontGross: string;
  backGross: string;
  date: string;
  type: "new" | "used";
  fieldsFound: number;
  lowConfidence: boolean;
};

export function cleanNumber(v: string | undefined): string {
  if (!v) return "";
  return v.replace(/[^0-9.]/g, "").replace(/\..*\./, "");
}

export function parseExtraction(raw: string): ExtractedFields {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw) as Partial<ExtractedFields>;
    const vehicleName = parsed.vehicleName ?? "";
    const frontGross = cleanNumber(parsed.frontGross as string | undefined);
    const backGross = cleanNumber(parsed.backGross as string | undefined);
    const fieldsFound = [vehicleName, frontGross, backGross].filter(Boolean).length;
    return {
      vehicleName,
      frontGross,
      backGross,
      date:
        parsed.date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date as string)
          ? (parsed.date as string)
          : new Date().toISOString().split("T")[0]!,
      type: parsed.type === "used" ? "used" : "new",
      fieldsFound,
      lowConfidence: fieldsFound === 0,
    };
  } catch {
    return {
      vehicleName: "",
      frontGross: "",
      backGross: "",
      date: new Date().toISOString().split("T")[0]!,
      type: "new",
      fieldsFound: 0,
      lowConfidence: true,
    };
  }
}
