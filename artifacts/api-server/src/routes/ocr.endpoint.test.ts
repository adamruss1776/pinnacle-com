import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("@workspace/integrations-openai-ai-server", () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
}));

vi.mock("node:module", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:module")>();
  return {
    ...actual,
    createRequire: () => () => async () => ({ text: "", numpages: 0 }),
  };
});

const FIXTURE_JPEG_BASE64 =
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U" +
  "HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA" +
  "Ax8A/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEA" +
  "AT8AEf/Z";

describe("POST /api/ocr", () => {
  let app: import("express").Express;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { default: a } = await import("../app.js");
    app = a;
  });

  it("returns 400 when imageBase64 is missing", async () => {
    const res = await request(app).post("/api/ocr").send({}).set("Content-Type", "application/json");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when body is empty", async () => {
    const res = await request(app).post("/api/ocr").send("").set("Content-Type", "application/json");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns correct JSON shape when OpenAI extracts deal fields", async () => {
    const { openai } = await import("@workspace/integrations-openai-ai-server");
    const mockCreate = openai.chat.completions.create as ReturnType<typeof vi.fn>;
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              vehicleName: "2024 Toyota Camry",
              frontGross: "1850",
              backGross: "900",
              date: "2024-06-15",
              type: "new",
            }),
          },
        },
      ],
    });

    const res = await request(app)
      .post("/api/ocr")
      .send({ imageBase64: FIXTURE_JPEG_BASE64, mimeType: "image/jpeg" })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      vehicleName: "2024 Toyota Camry",
      frontGross: "1850",
      backGross: "900",
      date: "2024-06-15",
      type: "new",
      fieldsFound: 3,
      lowConfidence: false,
    });
  });

  it("returns low-confidence response when OpenAI finds nothing", async () => {
    const { openai } = await import("@workspace/integrations-openai-ai-server");
    const mockCreate = openai.chat.completions.create as ReturnType<typeof vi.fn>;
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              vehicleName: "",
              frontGross: "",
              backGross: "",
              date: "",
              type: "new",
            }),
          },
        },
      ],
    });

    const res = await request(app)
      .post("/api/ocr")
      .send({ imageBase64: FIXTURE_JPEG_BASE64, mimeType: "image/jpeg" })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    expect(res.body.lowConfidence).toBe(true);
    expect(res.body.fieldsFound).toBe(0);
  });

  it("response always contains all required fields", async () => {
    const { openai } = await import("@workspace/integrations-openai-ai-server");
    const mockCreate = openai.chat.completions.create as ReturnType<typeof vi.fn>;
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "{}" } }],
    });

    const res = await request(app)
      .post("/api/ocr")
      .send({ imageBase64: FIXTURE_JPEG_BASE64, mimeType: "image/jpeg" })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    const body = res.body as object;
    expect(body).toHaveProperty("vehicleName");
    expect(body).toHaveProperty("frontGross");
    expect(body).toHaveProperty("backGross");
    expect(body).toHaveProperty("date");
    expect(body).toHaveProperty("type");
    expect(body).toHaveProperty("fieldsFound");
    expect(body).toHaveProperty("lowConfidence");
  });
});
