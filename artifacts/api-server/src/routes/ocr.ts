import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const ocrRouter = Router();

ocrRouter.post("/ocr", async (req, res) => {
  const { imageBase64, mimeType } = req.body as {
    imageBase64?: string;
    mimeType?: string;
  };

  if (!imageBase64) {
    res.status(400).json({ error: "imageBase64 is required" });
    return;
  }

  const imgMime = mimeType ?? "image/jpeg";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 512,
      messages: [
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
              text: `You are an automotive deal sheet OCR parser. Extract the following fields from this deal sheet image and return ONLY a JSON object with no extra text or markdown.

Fields to extract:
- vehicleName: year, make, model of the vehicle (e.g. "2024 Toyota Camry")
- frontGross: front-end gross profit in dollars as a number string (e.g. "1850"). This may be labeled "Front Gross", "FE Gross", "Gross Profit", etc.
- backGross: back-end gross profit in dollars as a number string (e.g. "900"). This may be labeled "Back Gross", "BE Gross", "F&I Gross", etc.
- date: sale date in YYYY-MM-DD format (e.g. "2024-06-15")
- type: "new" or "used" depending on whether this is a new or used vehicle deal

Return empty string "" for any field you cannot confidently extract. Always return a valid JSON object in this exact shape:
{"vehicleName":"","frontGross":"","backGross":"","date":"","type":"new"}`,
            },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";

    let parsed: {
      vehicleName: string;
      frontGross: string;
      backGross: string;
      date: string;
      type: "new" | "used";
    };

    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      parsed = {
        vehicleName: "",
        frontGross: "",
        backGross: "",
        date: new Date().toISOString().split("T")[0]!,
        type: "new",
      };
    }

    parsed.type =
      parsed.type === "used" ? "used" : "new";

    if (!parsed.date || !/^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
      parsed.date = new Date().toISOString().split("T")[0]!;
    }

    const clean = (v: string) =>
      v.replace(/[^0-9.]/g, "").replace(/\..*\./, ".");

    parsed.frontGross = clean(parsed.frontGross ?? "");
    parsed.backGross = clean(parsed.backGross ?? "");

    res.json(parsed);
  } catch (err) {
    console.error("OCR error:", err);
    res.status(500).json({ error: "OCR processing failed" });
  }
});

export default ocrRouter;
