import { Router } from "express";
import { createRequire } from "node:module";
import { openai } from "@workspace/integrations-openai-ai-server";

const _require = createRequire(import.meta.url);
type PdfParseResult = { text: string; numpages: number };
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const pdfParse: (buf: Buffer) => Promise<PdfParseResult> = _require("pdf-parse/lib/pdf-parse.js");

const ocrRouter = Router();

const EXTRACTION_SYSTEM = `You are an automotive deal sheet field extractor. 
From the provided text or image, extract deal information and return ONLY a valid JSON object with no extra text or markdown.

Fields to extract:
- vehicleName: year, make, model (e.g. "2024 Toyota Camry"). Empty string if not found.
- frontGross: front-end gross profit as a numeric string without $ or commas (e.g. "1850"). May be labeled "Front Gross", "FE Gross", "Front End", "Gross Profit". Empty string if not found.
- backGross: back-end gross profit as a numeric string without $ or commas (e.g. "900"). May be labeled "Back Gross", "BE Gross", "F&I", "Finance Gross". Empty string if not found.
- date: sale date in YYYY-MM-DD format (e.g. "2024-06-15"). Empty string if not found.
- type: "new" if this is a new vehicle deal, "used" if used vehicle deal. Default "new".

Return exactly this JSON shape (no extra keys):
{"vehicleName":"","frontGross":"","backGross":"","date":"","type":"new"}`;

type ExtractedFields = {
  vehicleName: string;
  frontGross: string;
  backGross: string;
  date: string;
  type: "new" | "used";
};

function cleanNumber(v: string | undefined): string {
  if (!v) return "";
  return v.replace(/[^0-9.]/g, "").replace(/\..*\./, "");
}

function parseExtraction(raw: string): ExtractedFields {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw) as Partial<ExtractedFields>;
    return {
      vehicleName: parsed.vehicleName ?? "",
      frontGross: cleanNumber(parsed.frontGross),
      backGross: cleanNumber(parsed.backGross),
      date:
        parsed.date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)
          ? parsed.date
          : new Date().toISOString().split("T")[0]!,
      type: parsed.type === "used" ? "used" : "new",
    };
  } catch {
    return {
      vehicleName: "",
      frontGross: "",
      backGross: "",
      date: new Date().toISOString().split("T")[0]!,
      type: "new",
    };
  }
}

ocrRouter.post("/ocr", async (req, res) => {
  const { imageBase64, mimeType } = req.body as {
    imageBase64?: string;
    mimeType?: string;
  };

  if (!imageBase64) {
    res.status(400).json({ error: "imageBase64 is required" });
    return;
  }

  const imgMime = (mimeType ?? "image/jpeg").toLowerCase();

  try {
    let raw: string;

    if (imgMime === "application/pdf") {
      const pdfBuffer = Buffer.from(imageBase64, "base64");
      const pdfData = await pdfParse(pdfBuffer);
      const pdfText = pdfData.text?.trim() || "";

      if (!pdfText) {
        res.json({
          vehicleName: "",
          frontGross: "",
          backGross: "",
          date: new Date().toISOString().split("T")[0]!,
          type: "new",
        } satisfies ExtractedFields);
        return;
      }

      const response = await openai.chat.completions.create({
        model: "gpt-5-mini",
        max_completion_tokens: 512,
        messages: [
          { role: "system", content: EXTRACTION_SYSTEM },
          {
            role: "user",
            content: `Extract deal fields from this deal sheet text:\n\n${pdfText.slice(0, 4000)}`,
          },
        ],
      });

      raw = response.choices[0]?.message?.content ?? "{}";
    } else {
      const response = await openai.chat.completions.create({
        model: "gpt-5-mini",
        max_completion_tokens: 512,
        messages: [
          { role: "system", content: EXTRACTION_SYSTEM },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${imgMime};base64,${imageBase64}`,
                  detail: "high",
                },
              },
              {
                type: "text",
                text: "Extract the deal fields from this deal sheet image.",
              },
            ],
          },
        ],
      });

      raw = response.choices[0]?.message?.content ?? "{}";
    }

    res.json(parseExtraction(raw));
  } catch (err) {
    console.error("OCR error:", err);
    res.status(500).json({ error: "OCR processing failed" });
  }
});

export default ocrRouter;
