import { describe, it, expect } from "vitest";
import { cleanNumber, parseExtraction } from "./ocr-parse.js";

describe("cleanNumber", () => {
  it("strips dollar signs and commas", () => {
    expect(cleanNumber("$1,850.00")).toBe("1850.00");
  });

  it("strips leading dollar sign", () => {
    expect(cleanNumber("$900")).toBe("900");
  });

  it("returns empty string for undefined", () => {
    expect(cleanNumber(undefined)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(cleanNumber("")).toBe("");
  });

  it("strips commas from large numbers", () => {
    expect(cleanNumber("12,500")).toBe("12500");
  });

  it("keeps decimals intact", () => {
    expect(cleanNumber("1850.50")).toBe("1850.50");
  });

  it("removes middle section between two decimal points", () => {
    expect(cleanNumber("18.50.25")).toBe("1825");
  });
});

describe("parseExtraction", () => {
  it("parses a complete deal sheet response correctly", () => {
    const raw = JSON.stringify({
      vehicleName: "2024 Toyota Camry",
      frontGross: "1850",
      backGross: "900",
      date: "2024-06-15",
      dateCertain: true,
      type: "new",
    });

    const result = parseExtraction(raw);

    expect(result.vehicleName).toBe("2024 Toyota Camry");
    expect(result.frontGross).toBe("1850");
    expect(result.backGross).toBe("900");
    expect(result.date).toBe("2024-06-15");
    expect(result.dateCertain).toBe(true);
    expect(result.type).toBe("new");
    expect(result.fieldsFound).toBe(3);
    expect(result.lowConfidence).toBe(false);
  });

  it("parses a used vehicle deal correctly", () => {
    const raw = JSON.stringify({
      vehicleName: "2019 Honda Accord",
      frontGross: "2200",
      backGross: "750",
      date: "2024-03-10",
      dateCertain: true,
      type: "used",
    });

    const result = parseExtraction(raw);

    expect(result.type).toBe("used");
    expect(result.vehicleName).toBe("2019 Honda Accord");
  });

  it("defaults type to 'new' for unknown type values", () => {
    const raw = JSON.stringify({
      vehicleName: "2023 Ford F-150",
      frontGross: "3000",
      backGross: "1200",
      date: "2024-01-20",
      dateCertain: true,
      type: "unknown",
    });

    const result = parseExtraction(raw);
    expect(result.type).toBe("new");
  });

  it("strips currency formatting from gross values", () => {
    const raw = JSON.stringify({
      vehicleName: "2024 Chevrolet Silverado",
      frontGross: "$2,500",
      backGross: "$1,100.00",
      date: "2024-05-01",
      dateCertain: true,
      type: "new",
    });

    const result = parseExtraction(raw);
    expect(result.frontGross).toBe("2500");
    expect(result.backGross).toBe("1100.00");
  });

  it("sets lowConfidence=true and fieldsFound=0 when no fields are extracted", () => {
    const raw = JSON.stringify({
      vehicleName: "",
      frontGross: "",
      backGross: "",
      date: "",
      dateCertain: false,
      type: "new",
    });

    const result = parseExtraction(raw);
    expect(result.fieldsFound).toBe(0);
    expect(result.lowConfidence).toBe(true);
  });

  it("returns empty date and dateCertain:false when date field is malformed", () => {
    const raw = JSON.stringify({
      vehicleName: "2024 BMW 3 Series",
      frontGross: "4000",
      backGross: "1800",
      date: "not-a-date",
      type: "new",
    });

    const result = parseExtraction(raw);
    expect(result.date).toBe("");
    expect(result.dateCertain).toBe(false);
  });

  it("returns empty date and dateCertain:false when date field is empty", () => {
    const raw = JSON.stringify({
      vehicleName: "2024 BMW 3 Series",
      frontGross: "4000",
      backGross: "1800",
      date: "",
      type: "new",
    });

    const result = parseExtraction(raw);
    expect(result.date).toBe("");
    expect(result.dateCertain).toBe(false);
  });

  it("returns dateCertain:false when AI explicitly flags ambiguous date", () => {
    const raw = JSON.stringify({
      vehicleName: "2024 Toyota Camry",
      frontGross: "1850",
      backGross: "900",
      date: "2024-06-15",
      dateCertain: false,
      type: "new",
    });

    const result = parseExtraction(raw);
    expect(result.date).toBe("2024-06-15");
    expect(result.dateCertain).toBe(false);
  });

  it("defaults dateCertain to true when a valid date is present and AI omits the field", () => {
    const raw = JSON.stringify({
      vehicleName: "2024 Toyota Camry",
      frontGross: "1850",
      backGross: "900",
      date: "2024-06-15",
      type: "new",
    });

    const result = parseExtraction(raw);
    expect(result.dateCertain).toBe(true);
  });

  it("extracts JSON embedded in surrounding text (markdown code fences)", () => {
    const raw = `Here is the extracted data:\n\`\`\`json\n{"vehicleName":"2024 Kia Telluride","frontGross":"2100","backGross":"800","date":"2024-07-04","dateCertain":true,"type":"new"}\n\`\`\``;

    const result = parseExtraction(raw);
    expect(result.vehicleName).toBe("2024 Kia Telluride");
    expect(result.frontGross).toBe("2100");
    expect(result.backGross).toBe("800");
    expect(result.date).toBe("2024-07-04");
    expect(result.dateCertain).toBe(true);
  });

  it("returns a safe fallback when given completely invalid JSON", () => {
    const result = parseExtraction("this is not json at all");

    expect(result.vehicleName).toBe("");
    expect(result.frontGross).toBe("");
    expect(result.backGross).toBe("");
    expect(result.date).toBe("");
    expect(result.dateCertain).toBe(false);
    expect(result.type).toBe("new");
    expect(result.lowConfidence).toBe(true);
    expect(result.fieldsFound).toBe(0);
  });

  it("counts fieldsFound correctly for a partial result", () => {
    const raw = JSON.stringify({
      vehicleName: "2023 Nissan Altima",
      frontGross: "",
      backGross: "600",
      date: "2024-02-14",
      dateCertain: true,
      type: "new",
    });

    const result = parseExtraction(raw);
    expect(result.fieldsFound).toBe(2);
    expect(result.lowConfidence).toBe(false);
  });

  it("response shape has all required keys", () => {
    const result = parseExtraction("{}");
    expect(result).toHaveProperty("vehicleName");
    expect(result).toHaveProperty("frontGross");
    expect(result).toHaveProperty("backGross");
    expect(result).toHaveProperty("date");
    expect(result).toHaveProperty("dateCertain");
    expect(result).toHaveProperty("type");
    expect(result).toHaveProperty("fieldsFound");
    expect(result).toHaveProperty("lowConfidence");
  });
});
