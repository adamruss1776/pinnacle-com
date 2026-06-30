export type PrefillParams = {
  prefillDate: string;
  prefillVehicle: string;
  prefillFront: string;
  prefillBack: string;
  prefillType: "new" | "used";
};

export type OcrExtractedFields = {
  vehicleName: string;
  frontGross: string;
  backGross: string;
  date: string;
  type: "new" | "used";
};

export type PrefillFormState = {
  date: string;
  vehicleName: string;
  frontGross: string;
  backGross: string;
  type: "new" | "used";
};

export function buildPrefillParams(extracted: OcrExtractedFields): PrefillParams {
  return {
    prefillDate: extracted.date,
    prefillVehicle: extracted.vehicleName,
    prefillFront: extracted.frontGross,
    prefillBack: extracted.backGross,
    prefillType: extracted.type,
  };
}

export function readPrefillParams(
  params: Partial<Record<keyof PrefillParams, string | undefined>>,
  today: string
): PrefillFormState {
  return {
    date: params.prefillDate || today,
    vehicleName: params.prefillVehicle ?? "",
    frontGross: params.prefillFront ?? "",
    backGross: params.prefillBack ?? "",
    type: params.prefillType === "used" ? "used" : "new",
  };
}
