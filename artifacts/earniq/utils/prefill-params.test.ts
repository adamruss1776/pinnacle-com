import { describe, it, expect } from "vitest";
import { applyFieldEdit, buildPrefillParams, readPrefillParams } from "./prefill-params.js";
import type { OcrExtractedFields, PrefillParams } from "./prefill-params.js";

const TODAY = "2026-06-30";

describe("buildPrefillParams — import.tsx handleContinue()", () => {
  it("maps every OCR field to the correct router param name", () => {
    const ocr: OcrExtractedFields = {
      vehicleName: "2024 Toyota Camry",
      frontGross: "1850",
      backGross: "900",
      date: "2024-06-15",
      type: "new",
    };

    const params = buildPrefillParams(ocr);

    expect(params.prefillVehicle).toBe("2024 Toyota Camry");
    expect(params.prefillFront).toBe("1850");
    expect(params.prefillBack).toBe("900");
    expect(params.prefillDate).toBe("2024-06-15");
    expect(params.prefillType).toBe("new");
  });

  it("preserves 'used' type correctly", () => {
    const ocr: OcrExtractedFields = {
      vehicleName: "2019 Honda Accord",
      frontGross: "2200",
      backGross: "750",
      date: "2024-03-10",
      type: "used",
    };

    const params = buildPrefillParams(ocr);
    expect(params.prefillType).toBe("used");
  });

  it("passes through empty strings for missing OCR fields", () => {
    const ocr: OcrExtractedFields = {
      vehicleName: "",
      frontGross: "",
      backGross: "",
      date: TODAY,
      type: "new",
    };

    const params = buildPrefillParams(ocr);
    expect(params.prefillVehicle).toBe("");
    expect(params.prefillFront).toBe("");
    expect(params.prefillBack).toBe("");
  });

  it("output object has exactly the param keys log-deal.tsx reads", () => {
    const ocr: OcrExtractedFields = {
      vehicleName: "2024 BMW 3 Series",
      frontGross: "4000",
      backGross: "1800",
      date: TODAY,
      type: "new",
    };

    const params = buildPrefillParams(ocr);
    const keys = Object.keys(params).sort();
    expect(keys).toEqual(
      ["prefillBack", "prefillDate", "prefillFront", "prefillType", "prefillVehicle"]
    );
  });
});

describe("readPrefillParams — log-deal.tsx initial state", () => {
  it("maps every router param to the correct form field", () => {
    const routerParams: PrefillParams = {
      prefillDate: "2024-06-15",
      prefillVehicle: "2024 Toyota Camry",
      prefillFront: "1850",
      prefillBack: "900",
      prefillType: "new",
    };

    const state = readPrefillParams(routerParams, TODAY);

    expect(state.date).toBe("2024-06-15");
    expect(state.vehicleName).toBe("2024 Toyota Camry");
    expect(state.frontGross).toBe("1850");
    expect(state.backGross).toBe("900");
    expect(state.type).toBe("new");
  });

  it("defaults to today when prefillDate is missing", () => {
    const state = readPrefillParams({}, TODAY);
    expect(state.date).toBe(TODAY);
  });

  it("defaults vehicleName to empty string when prefillVehicle is missing", () => {
    const state = readPrefillParams({}, TODAY);
    expect(state.vehicleName).toBe("");
  });

  it("defaults frontGross and backGross to empty string when missing", () => {
    const state = readPrefillParams({}, TODAY);
    expect(state.frontGross).toBe("");
    expect(state.backGross).toBe("");
  });

  it("defaults type to 'new' when prefillType is missing", () => {
    const state = readPrefillParams({}, TODAY);
    expect(state.type).toBe("new");
  });

  it("defaults type to 'new' for unrecognised prefillType values", () => {
    const state = readPrefillParams({ prefillType: "electric" as "new" | "used" }, TODAY);
    expect(state.type).toBe("new");
  });

  it("reads 'used' type correctly", () => {
    const state = readPrefillParams({ prefillType: "used" }, TODAY);
    expect(state.type).toBe("used");
  });
});

describe("inline edit → buildPrefillParams → readPrefillParams (import review screen)", () => {
  it("vehicle edit: empty → filled value carries through to log-deal form", () => {
    const initial: OcrExtractedFields = {
      vehicleName: "",
      frontGross: "1500",
      backGross: "",
      date: TODAY,
      type: "new",
    };

    const afterEdit = applyFieldEdit(initial, "vehicleName", "2023 Toyota Camry");
    const routerParams = buildPrefillParams(afterEdit);
    const formState = readPrefillParams(routerParams, TODAY);

    expect(formState.vehicleName).toBe("2023 Toyota Camry");
    expect(formState.frontGross).toBe("1500");
  });

  it("frontGross edit: empty → filled value carries through to log-deal form", () => {
    const initial: OcrExtractedFields = {
      vehicleName: "2023 Honda Civic",
      frontGross: "",
      backGross: "",
      date: TODAY,
      type: "new",
    };

    const afterEdit = applyFieldEdit(initial, "frontGross", "2000");
    const routerParams = buildPrefillParams(afterEdit);
    const formState = readPrefillParams(routerParams, TODAY);

    expect(formState.frontGross).toBe("2000");
    expect(formState.vehicleName).toBe("2023 Honda Civic");
  });

  it("editing both required fields when both are empty carries both values through", () => {
    const initial: OcrExtractedFields = {
      vehicleName: "",
      frontGross: "",
      backGross: "",
      date: TODAY,
      type: "new",
    };

    const afterVehicle = applyFieldEdit(initial, "vehicleName", "2024 Ford F-150");
    const afterFront = applyFieldEdit(afterVehicle, "frontGross", "3200");
    const routerParams = buildPrefillParams(afterFront);
    const formState = readPrefillParams(routerParams, TODAY);

    expect(formState.vehicleName).toBe("2024 Ford F-150");
    expect(formState.frontGross).toBe("3200");
    expect(formState.backGross).toBe("");
  });

  it("applyFieldEdit trims whitespace from entered vehicle name before it reaches the form", () => {
    const initial: OcrExtractedFields = {
      vehicleName: "",
      frontGross: "",
      backGross: "",
      date: TODAY,
      type: "new",
    };

    const afterEdit = applyFieldEdit(initial, "vehicleName", "  2023 BMW 3 Series  ");
    const routerParams = buildPrefillParams(afterEdit);
    const formState = readPrefillParams(routerParams, TODAY);

    expect(formState.vehicleName).toBe("2023 BMW 3 Series");
  });

  it("applyFieldEdit trims whitespace from entered frontGross before it reaches the form", () => {
    const initial: OcrExtractedFields = {
      vehicleName: "2022 Chevy Silverado",
      frontGross: "",
      backGross: "",
      date: TODAY,
      type: "new",
    };

    const afterEdit = applyFieldEdit(initial, "frontGross", "  1750  ");
    const routerParams = buildPrefillParams(afterEdit);
    const formState = readPrefillParams(routerParams, TODAY);

    expect(formState.frontGross).toBe("1750");
  });

  it("editing a field does not corrupt other already-extracted fields", () => {
    const initial: OcrExtractedFields = {
      vehicleName: "",
      frontGross: "2500",
      backGross: "800",
      date: "2026-05-01",
      type: "used",
    };

    const afterEdit = applyFieldEdit(initial, "vehicleName", "2021 Kia Telluride");
    const routerParams = buildPrefillParams(afterEdit);
    const formState = readPrefillParams(routerParams, TODAY);

    expect(formState.vehicleName).toBe("2021 Kia Telluride");
    expect(formState.frontGross).toBe("2500");
    expect(formState.backGross).toBe("800");
    expect(formState.date).toBe("2026-05-01");
    expect(formState.type).toBe("used");
  });

  it("multiple sequential edits: last write wins without losing earlier edits", () => {
    let extracted: OcrExtractedFields = {
      vehicleName: "",
      frontGross: "",
      backGross: "",
      date: TODAY,
      type: "new",
    };

    extracted = applyFieldEdit(extracted, "vehicleName", "2022 Ram 1500");
    extracted = applyFieldEdit(extracted, "frontGross", "1800");
    extracted = applyFieldEdit(extracted, "backGross", "600");
    extracted = applyFieldEdit(extracted, "vehicleName", "2022 Ram 1500 TRX");

    const formState = readPrefillParams(buildPrefillParams(extracted), TODAY);

    expect(formState.vehicleName).toBe("2022 Ram 1500 TRX");
    expect(formState.frontGross).toBe("1800");
    expect(formState.backGross).toBe("600");
  });
});

describe("buildPrefillParams → readPrefillParams roundtrip", () => {
  it("OCR output survives the full import → log-deal param journey", () => {
    const ocr: OcrExtractedFields = {
      vehicleName: "2024 Ford Mustang",
      frontGross: "3500",
      backGross: "1200",
      date: "2024-07-04",
      type: "used",
    };

    const routerParams = buildPrefillParams(ocr);
    const formState = readPrefillParams(routerParams, TODAY);

    expect(formState.vehicleName).toBe(ocr.vehicleName);
    expect(formState.frontGross).toBe(ocr.frontGross);
    expect(formState.backGross).toBe(ocr.backGross);
    expect(formState.date).toBe(ocr.date);
    expect(formState.type).toBe(ocr.type);
  });

  it("empty OCR result roundtrips without errors and produces safe defaults", () => {
    const ocr: OcrExtractedFields = {
      vehicleName: "",
      frontGross: "",
      backGross: "",
      date: TODAY,
      type: "new",
    };

    const routerParams = buildPrefillParams(ocr);
    const formState = readPrefillParams(routerParams, TODAY);

    expect(formState.vehicleName).toBe("");
    expect(formState.frontGross).toBe("");
    expect(formState.backGross).toBe("");
    expect(formState.date).toBe(TODAY);
    expect(formState.type).toBe("new");
  });
});
