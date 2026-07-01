export type ExtractedFields = {
  vehicleName: string;
  frontGross: string;
  backGross: string;
  date: string;
  type: "new" | "used";
  fieldsFound: number;
  lowConfidence: boolean;
  dateCertain: boolean;
};

export function cleanNumber(v: string | undefined): string {
  if (!v) return "";
  return v.replace(/[^0-9.]/g, "").replace(/\..*\./, "");
}

export function parseExtraction(raw: string): ExtractedFields {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw) as Partial<ExtractedFields> & { dateCertain?: boolean };
    const vehicleName = parsed.vehicleName ?? "";
    const frontGross = cleanNumber(parsed.frontGross as string | undefined);
    const backGross = cleanNumber(parsed.backGross as string | undefined);
    const fieldsFound = [vehicleName, frontGross, backGross].filter(Boolean).length;
    const rawDate = parsed.date as string | undefined;
    const validDate = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : "";
    const dateCertain = validDate ? (parsed.dateCertain !== false) : false;
    return {
      vehicleName,
      frontGross,
      backGross,
      date: validDate,
      type: parsed.type === "used" ? "used" : "new",
      fieldsFound,
      lowConfidence: fieldsFound === 0,
      dateCertain,
    };
  } catch {
    return {
      vehicleName: "",
      frontGross: "",
      backGross: "",
      date: "",
      type: "new",
      fieldsFound: 0,
      lowConfidence: true,
      dateCertain: false,
    };
  }
}
