import { describe, it, expect } from "vitest";
import { resolveOcrDate } from "./ocr-date.js";

const TODAY = "2026-06-30";

describe("resolveOcrDate — date field resolution in processImage / processPDF", () => {
  it("returns empty string when OCR reports lowConfidence:true even if today would fill it", () => {
    const data = {
      vehicleName: "",
      frontGross: "",
      backGross: "",
      lowConfidence: true,
    };

    const date = resolveOcrDate(data, TODAY);

    expect(date).toBe("");
  });

  it("returns today's date for a partial scan (vehicleName present, gross absent) with lowConfidence:false", () => {
    const data = {
      vehicleName: "2023 Ford F-150",
      frontGross: "",
      backGross: "",
      lowConfidence: false,
    };

    const date = resolveOcrDate(data, TODAY);

    expect(date).toBe(TODAY);
  });

  it("returns the extracted date when the scan has a date and is not low-confidence", () => {
    const data = {
      vehicleName: "2024 Toyota Camry",
      frontGross: "1850",
      backGross: "900",
      date: "2026-06-15",
      lowConfidence: false,
    };

    const date = resolveOcrDate(data, TODAY);

    expect(date).toBe("2026-06-15");
  });

  it("infers low-confidence from all fields empty when lowConfidence flag is absent", () => {
    const data = {
      vehicleName: "",
      frontGross: "",
      backGross: "",
    };

    const date = resolveOcrDate(data, TODAY);

    expect(date).toBe("");
  });

  describe("dateCertain field", () => {
    it("returns '' when dateCertain is false even though a date was extracted", () => {
      const data = {
        vehicleName: "2024 Toyota Camry",
        frontGross: "1850",
        backGross: "900",
        date: "2026-06-15",
        lowConfidence: false,
        dateCertain: false,
      };

      const date = resolveOcrDate(data, TODAY);

      expect(date).toBe("");
    });

    it("returns the extracted date when dateCertain is true", () => {
      const data = {
        vehicleName: "2024 Toyota Camry",
        frontGross: "1850",
        backGross: "900",
        date: "2026-06-15",
        lowConfidence: false,
        dateCertain: true,
      };

      const date = resolveOcrDate(data, TODAY);

      expect(date).toBe("2026-06-15");
    });

    it("returns '' when dateCertain is false and date is empty", () => {
      const data = {
        vehicleName: "2024 Toyota Camry",
        frontGross: "1850",
        backGross: "900",
        date: "",
        lowConfidence: false,
        dateCertain: false,
      };

      const date = resolveOcrDate(data, TODAY);

      expect(date).toBe("");
    });

    it("falls back to today when dateCertain is true but no date was extracted", () => {
      const data = {
        vehicleName: "2024 Toyota Camry",
        frontGross: "1850",
        backGross: "900",
        date: "",
        lowConfidence: false,
        dateCertain: true,
      };

      const date = resolveOcrDate(data, TODAY);

      expect(date).toBe(TODAY);
    });

    it("still returns '' when lowConfidence is true even if dateCertain is true", () => {
      const data = {
        vehicleName: "",
        frontGross: "",
        backGross: "",
        date: "2026-06-15",
        lowConfidence: true,
        dateCertain: true,
      };

      const date = resolveOcrDate(data, TODAY);

      expect(date).toBe("");
    });
  });
});
