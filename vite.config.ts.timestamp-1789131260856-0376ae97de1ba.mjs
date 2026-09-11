// vite.config.ts
import { defineConfig, loadEnv } from "file:///C:/Users/Nitro%20V/OneDrive/Desktop/eco-drop-j/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Nitro%20V/OneDrive/Desktop/eco-drop-j/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";

// server/classifyWasteHandler.ts
import { GoogleGenerativeAI } from "file:///C:/Users/Nitro%20V/OneDrive/Desktop/eco-drop-j/node_modules/@google/generative-ai/dist/index.mjs";
var FALLBACK_UNKNOWN = {
  item: "Unknown",
  material: "Unknown",
  category: "Unknown",
  bin: "Unknown",
  confidence: 0,
  explanation: "The object is not clearly visible enough to classify."
};
var CLASSIFICATION_PROMPT = `You are an expert waste classification and materials recycling vision assistant.
Examine the image provided and identify the primary waste item shown.

You MUST return ONLY a JSON object with this exact structure:
{
  "item": "Specific name of the object (e.g. Plastic water bottle, Banana peel, Aluminum soda can, Used paper tissue, Smartphone)",
  "material": "Specific material composition (e.g. PET plastic, Organic fruit peel, Aluminum alloy, Soiled paper fiber, E-waste electronics)",
  "category": "One of: Recyclable | Organic / Compostable | General Waste | Hazardous Waste | E-Waste | Glass | Metal | Unknown",
  "bin": "One of: Recycling | Compost | General Waste | Hazardous Waste | E-Waste Collection | Glass Bin | Metal Bin | Unknown",
  "confidence": float between 0.0 and 1.0,
  "explanation": "Concise 1-2 sentence explanation of what is shown and why."
}

Special rules:
1. If the image is blurry, empty, unidentifiable, or the object is not clearly visible, return:
{
  "item": "Unknown",
  "material": "Unknown",
  "category": "Unknown",
  "bin": "Unknown",
  "confidence": 0.0,
  "explanation": "The object is not clearly visible enough to classify."
}
2. Focus primarily on objective item and material identification.
3. Return ONLY the raw JSON object. Do not wrap in markdown or backticks. No conversational filler.`;
function extractBase64FromDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") {
    throw new Error("Invalid image data provided.");
  }
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], base64Data: match[2] };
  }
  return { mimeType: "image/jpeg", base64Data: dataUrl };
}
function parseGeminiJson(rawText) {
  try {
    const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) {
      return FALLBACK_UNKNOWN;
    }
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    return {
      item: String(parsed.item || "Unknown"),
      material: String(parsed.material || "Unknown"),
      category: String(parsed.category || "Unknown"),
      bin: String(parsed.bin || "Unknown"),
      confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
      explanation: String(parsed.explanation || "Analyzed with Google Gemini Vision.")
    };
  } catch (err) {
    console.error("Failed to parse Gemini JSON output:", rawText, err);
    return FALLBACK_UNKNOWN;
  }
}
async function classifyWasteWithGemini(imageDataUrl, apiKey) {
  const resolvedKey = apiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!resolvedKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server. Please add GEMINI_API_KEY to your .env file.");
  }
  const { mimeType, base64Data } = extractBase64FromDataUrl(imageDataUrl);
  if (!base64Data || base64Data.length < 50) {
    throw new Error("Image data is empty or invalid.");
  }
  const genAI = new GoogleGenerativeAI(resolvedKey);
  const modelCandidates = ["gemini-2.0-flash", "gemini-1.5-flash"];
  let lastError = null;
  for (const modelName of modelCandidates) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      });
      const response = await model.generateContent([
        CLASSIFICATION_PROMPT,
        {
          inlineData: {
            mimeType,
            data: base64Data
          }
        }
      ]);
      const text = response.response.text();
      if (!text) {
        return FALLBACK_UNKNOWN;
      }
      return parseGeminiJson(text);
    } catch (err) {
      lastError = err;
      console.warn(`Attempt with ${modelName} encountered:`, err.message || err);
      if (err.status === 404 || err.message?.includes("not found")) {
        continue;
      }
      break;
    }
  }
  throw lastError || new Error("Unable to analyze the image right now. Please try again.");
}

// vite.config.ts
var __vite_injected_original_dirname = "C:\\Users\\Nitro V\\OneDrive\\Desktop\\eco-drop-j";
function wasteClassifierApiPlugin() {
  return {
    name: "waste-classifier-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith("/api/classify-waste") && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
            if (body.length > 15 * 1024 * 1024) {
              res.statusCode = 413;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Image size too large. Maximum 15MB." }));
              req.destroy();
            }
          });
          req.on("end", async () => {
            try {
              const parsed = JSON.parse(body || "{}");
              const imageDataUrl = parsed.image;
              if (!imageDataUrl) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "No image provided in request body." }));
                return;
              }
              const result = await classifyWasteWithGemini(imageDataUrl, parsed.apiKey);
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } catch (err) {
              console.error("API Error in /api/classify-waste:", err);
              const isKeyMissing = err.message?.includes("GEMINI_API_KEY is not configured");
              res.statusCode = isKeyMissing ? 503 : 502;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({
                error: isKeyMissing ? "Gemini API key is not configured on the server. Please add GEMINI_API_KEY to your .env file." : "Unable to analyze the image right now. Please try again.",
                details: err.message
              }));
            }
          });
          return;
        }
        if (req.url?.startsWith("/api/classify-waste") && req.method === "GET") {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            status: "online",
            endpoint: "/api/classify-waste",
            keyConfigured: Boolean(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY)
          }));
          return;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith("/api/classify-waste") && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const parsed = JSON.parse(body || "{}");
              const result = await classifyWasteWithGemini(parsed.image, parsed.apiKey);
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 502;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: err.message || "Analysis failed" }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  if (env.VITE_GEMINI_API_KEY) process.env.VITE_GEMINI_API_KEY = env.VITE_GEMINI_API_KEY;
  return {
    server: {
      host: "::",
      port: 8080
    },
    plugins: [
      react(),
      wasteClassifierApiPlugin()
    ],
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAic2VydmVyL2NsYXNzaWZ5V2FzdGVIYW5kbGVyLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcTml0cm8gVlxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXGVjby1kcm9wLWpcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXE5pdHJvIFZcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxlY28tZHJvcC1qXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9OaXRybyUyMFYvT25lRHJpdmUvRGVza3RvcC9lY28tZHJvcC1qL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52LCBQbHVnaW4gfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyBjbGFzc2lmeVdhc3RlV2l0aEdlbWluaSB9IGZyb20gXCIuL3NlcnZlci9jbGFzc2lmeVdhc3RlSGFuZGxlclwiO1xyXG5cclxuZnVuY3Rpb24gd2FzdGVDbGFzc2lmaWVyQXBpUGx1Z2luKCk6IFBsdWdpbiB7XHJcbiAgcmV0dXJuIHtcclxuICAgIG5hbWU6ICd3YXN0ZS1jbGFzc2lmaWVyLWFwaScsXHJcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XHJcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoYXN5bmMgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XHJcbiAgICAgICAgaWYgKHJlcS51cmw/LnN0YXJ0c1dpdGgoJy9hcGkvY2xhc3NpZnktd2FzdGUnKSAmJiByZXEubWV0aG9kID09PSAnUE9TVCcpIHtcclxuICAgICAgICAgIGxldCBib2R5ID0gJyc7XHJcbiAgICAgICAgICByZXEub24oJ2RhdGEnLCAoY2h1bmspID0+IHtcclxuICAgICAgICAgICAgYm9keSArPSBjaHVuaztcclxuICAgICAgICAgICAgaWYgKGJvZHkubGVuZ3RoID4gMTUgKiAxMDI0ICogMTAyNCkge1xyXG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDEzO1xyXG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XHJcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnSW1hZ2Ugc2l6ZSB0b28gbGFyZ2UuIE1heGltdW0gMTVNQi4nIH0pKTtcclxuICAgICAgICAgICAgICByZXEuZGVzdHJveSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICByZXEub24oJ2VuZCcsIGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGJvZHkgfHwgJ3t9Jyk7XHJcbiAgICAgICAgICAgICAgY29uc3QgaW1hZ2VEYXRhVXJsID0gcGFyc2VkLmltYWdlO1xyXG4gICAgICAgICAgICAgIGlmICghaW1hZ2VEYXRhVXJsKSB7XHJcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMDtcclxuICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdObyBpbWFnZSBwcm92aWRlZCBpbiByZXF1ZXN0IGJvZHkuJyB9KSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjbGFzc2lmeVdhc3RlV2l0aEdlbWluaShpbWFnZURhdGFVcmwsIHBhcnNlZC5hcGlLZXkpO1xyXG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwO1xyXG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XHJcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShyZXN1bHQpKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdBUEkgRXJyb3IgaW4gL2FwaS9jbGFzc2lmeS13YXN0ZTonLCBlcnIpO1xyXG4gICAgICAgICAgICAgIGNvbnN0IGlzS2V5TWlzc2luZyA9IGVyci5tZXNzYWdlPy5pbmNsdWRlcygnR0VNSU5JX0FQSV9LRVkgaXMgbm90IGNvbmZpZ3VyZWQnKTtcclxuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IGlzS2V5TWlzc2luZyA/IDUwMyA6IDUwMjtcclxuICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xyXG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGlzS2V5TWlzc2luZ1xyXG4gICAgICAgICAgICAgICAgICA/ICdHZW1pbmkgQVBJIGtleSBpcyBub3QgY29uZmlndXJlZCBvbiB0aGUgc2VydmVyLiBQbGVhc2UgYWRkIEdFTUlOSV9BUElfS0VZIHRvIHlvdXIgLmVudiBmaWxlLidcclxuICAgICAgICAgICAgICAgICAgOiAnVW5hYmxlIHRvIGFuYWx5emUgdGhlIGltYWdlIHJpZ2h0IG5vdy4gUGxlYXNlIHRyeSBhZ2Fpbi4nLFxyXG4gICAgICAgICAgICAgICAgZGV0YWlsczogZXJyLm1lc3NhZ2VcclxuICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHJlcS51cmw/LnN0YXJ0c1dpdGgoJy9hcGkvY2xhc3NpZnktd2FzdGUnKSAmJiByZXEubWV0aG9kID09PSAnR0VUJykge1xyXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDA7XHJcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xyXG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgIHN0YXR1czogJ29ubGluZScsXHJcbiAgICAgICAgICAgIGVuZHBvaW50OiAnL2FwaS9jbGFzc2lmeS13YXN0ZScsXHJcbiAgICAgICAgICAgIGtleUNvbmZpZ3VyZWQ6IEJvb2xlYW4ocHJvY2Vzcy5lbnYuR0VNSU5JX0FQSV9LRVkgfHwgcHJvY2Vzcy5lbnYuVklURV9HRU1JTklfQVBJX0tFWSlcclxuICAgICAgICAgIH0pKTtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG5leHQoKTtcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgY29uZmlndXJlUHJldmlld1NlcnZlcihzZXJ2ZXIpIHtcclxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShhc3luYyAocmVxLCByZXMsIG5leHQpID0+IHtcclxuICAgICAgICBpZiAocmVxLnVybD8uc3RhcnRzV2l0aCgnL2FwaS9jbGFzc2lmeS13YXN0ZScpICYmIHJlcS5tZXRob2QgPT09ICdQT1NUJykge1xyXG4gICAgICAgICAgbGV0IGJvZHkgPSAnJztcclxuICAgICAgICAgIHJlcS5vbignZGF0YScsIChjaHVuaykgPT4geyBib2R5ICs9IGNodW5rOyB9KTtcclxuICAgICAgICAgIHJlcS5vbignZW5kJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoYm9keSB8fCAne30nKTtcclxuICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjbGFzc2lmeVdhc3RlV2l0aEdlbWluaShwYXJzZWQuaW1hZ2UsIHBhcnNlZC5hcGlLZXkpO1xyXG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwO1xyXG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XHJcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShyZXN1bHQpKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcclxuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMjtcclxuICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xyXG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyLm1lc3NhZ2UgfHwgJ0FuYWx5c2lzIGZhaWxlZCcgfSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgbmV4dCgpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9O1xyXG59XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XHJcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJyk7XHJcbiAgaWYgKGVudi5HRU1JTklfQVBJX0tFWSkgcHJvY2Vzcy5lbnYuR0VNSU5JX0FQSV9LRVkgPSBlbnYuR0VNSU5JX0FQSV9LRVk7XHJcbiAgaWYgKGVudi5WSVRFX0dFTUlOSV9BUElfS0VZKSBwcm9jZXNzLmVudi5WSVRFX0dFTUlOSV9BUElfS0VZID0gZW52LlZJVEVfR0VNSU5JX0FQSV9LRVk7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgaG9zdDogXCI6OlwiLFxyXG4gICAgICBwb3J0OiA4MDgwLFxyXG4gICAgfSxcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgcmVhY3QoKSxcclxuICAgICAgd2FzdGVDbGFzc2lmaWVyQXBpUGx1Z2luKCksXHJcbiAgICBdLFxyXG4gICAgcmVzb2x2ZToge1xyXG4gICAgICBhbGlhczoge1xyXG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9O1xyXG59KTtcclxuXHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcTml0cm8gVlxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXGVjby1kcm9wLWpcXFxcc2VydmVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxOaXRybyBWXFxcXE9uZURyaXZlXFxcXERlc2t0b3BcXFxcZWNvLWRyb3AtalxcXFxzZXJ2ZXJcXFxcY2xhc3NpZnlXYXN0ZUhhbmRsZXIudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL05pdHJvJTIwVi9PbmVEcml2ZS9EZXNrdG9wL2Vjby1kcm9wLWovc2VydmVyL2NsYXNzaWZ5V2FzdGVIYW5kbGVyLnRzXCI7aW1wb3J0IHsgR29vZ2xlR2VuZXJhdGl2ZUFJIH0gZnJvbSAnQGdvb2dsZS9nZW5lcmF0aXZlLWFpJztcblxuZXhwb3J0IGludGVyZmFjZSBHZW1pbmlDbGFzc2lmaWNhdGlvblJhdyB7XG4gIGl0ZW06IHN0cmluZztcbiAgbWF0ZXJpYWw6IHN0cmluZztcbiAgY2F0ZWdvcnk6IHN0cmluZztcbiAgYmluOiBzdHJpbmc7XG4gIGNvbmZpZGVuY2U6IG51bWJlcjtcbiAgZXhwbGFuYXRpb246IHN0cmluZztcbn1cblxuY29uc3QgRkFMTEJBQ0tfVU5LTk9XTjogR2VtaW5pQ2xhc3NpZmljYXRpb25SYXcgPSB7XG4gIGl0ZW06ICdVbmtub3duJyxcbiAgbWF0ZXJpYWw6ICdVbmtub3duJyxcbiAgY2F0ZWdvcnk6ICdVbmtub3duJyxcbiAgYmluOiAnVW5rbm93bicsXG4gIGNvbmZpZGVuY2U6IDAsXG4gIGV4cGxhbmF0aW9uOiAnVGhlIG9iamVjdCBpcyBub3QgY2xlYXJseSB2aXNpYmxlIGVub3VnaCB0byBjbGFzc2lmeS4nXG59O1xuXG5jb25zdCBDTEFTU0lGSUNBVElPTl9QUk9NUFQgPSBgWW91IGFyZSBhbiBleHBlcnQgd2FzdGUgY2xhc3NpZmljYXRpb24gYW5kIG1hdGVyaWFscyByZWN5Y2xpbmcgdmlzaW9uIGFzc2lzdGFudC5cbkV4YW1pbmUgdGhlIGltYWdlIHByb3ZpZGVkIGFuZCBpZGVudGlmeSB0aGUgcHJpbWFyeSB3YXN0ZSBpdGVtIHNob3duLlxuXG5Zb3UgTVVTVCByZXR1cm4gT05MWSBhIEpTT04gb2JqZWN0IHdpdGggdGhpcyBleGFjdCBzdHJ1Y3R1cmU6XG57XG4gIFwiaXRlbVwiOiBcIlNwZWNpZmljIG5hbWUgb2YgdGhlIG9iamVjdCAoZS5nLiBQbGFzdGljIHdhdGVyIGJvdHRsZSwgQmFuYW5hIHBlZWwsIEFsdW1pbnVtIHNvZGEgY2FuLCBVc2VkIHBhcGVyIHRpc3N1ZSwgU21hcnRwaG9uZSlcIixcbiAgXCJtYXRlcmlhbFwiOiBcIlNwZWNpZmljIG1hdGVyaWFsIGNvbXBvc2l0aW9uIChlLmcuIFBFVCBwbGFzdGljLCBPcmdhbmljIGZydWl0IHBlZWwsIEFsdW1pbnVtIGFsbG95LCBTb2lsZWQgcGFwZXIgZmliZXIsIEUtd2FzdGUgZWxlY3Ryb25pY3MpXCIsXG4gIFwiY2F0ZWdvcnlcIjogXCJPbmUgb2Y6IFJlY3ljbGFibGUgfCBPcmdhbmljIC8gQ29tcG9zdGFibGUgfCBHZW5lcmFsIFdhc3RlIHwgSGF6YXJkb3VzIFdhc3RlIHwgRS1XYXN0ZSB8IEdsYXNzIHwgTWV0YWwgfCBVbmtub3duXCIsXG4gIFwiYmluXCI6IFwiT25lIG9mOiBSZWN5Y2xpbmcgfCBDb21wb3N0IHwgR2VuZXJhbCBXYXN0ZSB8IEhhemFyZG91cyBXYXN0ZSB8IEUtV2FzdGUgQ29sbGVjdGlvbiB8IEdsYXNzIEJpbiB8IE1ldGFsIEJpbiB8IFVua25vd25cIixcbiAgXCJjb25maWRlbmNlXCI6IGZsb2F0IGJldHdlZW4gMC4wIGFuZCAxLjAsXG4gIFwiZXhwbGFuYXRpb25cIjogXCJDb25jaXNlIDEtMiBzZW50ZW5jZSBleHBsYW5hdGlvbiBvZiB3aGF0IGlzIHNob3duIGFuZCB3aHkuXCJcbn1cblxuU3BlY2lhbCBydWxlczpcbjEuIElmIHRoZSBpbWFnZSBpcyBibHVycnksIGVtcHR5LCB1bmlkZW50aWZpYWJsZSwgb3IgdGhlIG9iamVjdCBpcyBub3QgY2xlYXJseSB2aXNpYmxlLCByZXR1cm46XG57XG4gIFwiaXRlbVwiOiBcIlVua25vd25cIixcbiAgXCJtYXRlcmlhbFwiOiBcIlVua25vd25cIixcbiAgXCJjYXRlZ29yeVwiOiBcIlVua25vd25cIixcbiAgXCJiaW5cIjogXCJVbmtub3duXCIsXG4gIFwiY29uZmlkZW5jZVwiOiAwLjAsXG4gIFwiZXhwbGFuYXRpb25cIjogXCJUaGUgb2JqZWN0IGlzIG5vdCBjbGVhcmx5IHZpc2libGUgZW5vdWdoIHRvIGNsYXNzaWZ5LlwiXG59XG4yLiBGb2N1cyBwcmltYXJpbHkgb24gb2JqZWN0aXZlIGl0ZW0gYW5kIG1hdGVyaWFsIGlkZW50aWZpY2F0aW9uLlxuMy4gUmV0dXJuIE9OTFkgdGhlIHJhdyBKU09OIG9iamVjdC4gRG8gbm90IHdyYXAgaW4gbWFya2Rvd24gb3IgYmFja3RpY2tzLiBObyBjb252ZXJzYXRpb25hbCBmaWxsZXIuYDtcblxuLyoqXG4gKiBTdHJpcHMgZGF0YSBVUkwgc2NoZW1lIGFuZCBleHRyYWN0cyBtaW1lVHlwZSArIHJhdyBiYXNlNjQgZGF0YVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEJhc2U2NEZyb21EYXRhVXJsKGRhdGFVcmw6IHN0cmluZyk6IHsgbWltZVR5cGU6IHN0cmluZzsgYmFzZTY0RGF0YTogc3RyaW5nIH0ge1xuICBpZiAoIWRhdGFVcmwgfHwgdHlwZW9mIGRhdGFVcmwgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGltYWdlIGRhdGEgcHJvdmlkZWQuJyk7XG4gIH1cblxuICBjb25zdCBtYXRjaCA9IGRhdGFVcmwubWF0Y2goL15kYXRhOihbXjtdKyk7YmFzZTY0LCguKykkLyk7XG4gIGlmIChtYXRjaCkge1xuICAgIHJldHVybiB7IG1pbWVUeXBlOiBtYXRjaFsxXSwgYmFzZTY0RGF0YTogbWF0Y2hbMl0gfTtcbiAgfVxuXG4gIC8vIFJhdyBiYXNlNjQgZmFsbGJhY2tcbiAgcmV0dXJuIHsgbWltZVR5cGU6ICdpbWFnZS9qcGVnJywgYmFzZTY0RGF0YTogZGF0YVVybCB9O1xufVxuXG4vKipcbiAqIFBhcnNlcyBKU09OIG91dHB1dCBmcm9tIEdlbWluaSBzYWZlbHksIGhhbmRsaW5nIHBvdGVudGlhbCBjb2RlIGJsb2Nrc1xuICovXG5mdW5jdGlvbiBwYXJzZUdlbWluaUpzb24ocmF3VGV4dDogc3RyaW5nKTogR2VtaW5pQ2xhc3NpZmljYXRpb25SYXcge1xuICB0cnkge1xuICAgIGNvbnN0IGNsZWFuZWQgPSByYXdUZXh0XG4gICAgICAucmVwbGFjZSgvYGBganNvbi9naSwgJycpXG4gICAgICAucmVwbGFjZSgvYGBgL2csICcnKVxuICAgICAgLnRyaW0oKTtcblxuICAgIGNvbnN0IHN0YXJ0ID0gY2xlYW5lZC5pbmRleE9mKCd7Jyk7XG4gICAgY29uc3QgZW5kID0gY2xlYW5lZC5sYXN0SW5kZXhPZignfScpO1xuICAgIGlmIChzdGFydCA9PT0gLTEgfHwgZW5kID09PSAtMSkge1xuICAgICAgcmV0dXJuIEZBTExCQUNLX1VOS05PV047XG4gICAgfVxuXG4gICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShjbGVhbmVkLnNsaWNlKHN0YXJ0LCBlbmQgKyAxKSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgaXRlbTogU3RyaW5nKHBhcnNlZC5pdGVtIHx8ICdVbmtub3duJyksXG4gICAgICBtYXRlcmlhbDogU3RyaW5nKHBhcnNlZC5tYXRlcmlhbCB8fCAnVW5rbm93bicpLFxuICAgICAgY2F0ZWdvcnk6IFN0cmluZyhwYXJzZWQuY2F0ZWdvcnkgfHwgJ1Vua25vd24nKSxcbiAgICAgIGJpbjogU3RyaW5nKHBhcnNlZC5iaW4gfHwgJ1Vua25vd24nKSxcbiAgICAgIGNvbmZpZGVuY2U6IHR5cGVvZiBwYXJzZWQuY29uZmlkZW5jZSA9PT0gJ251bWJlcidcbiAgICAgICAgPyBNYXRoLm1pbigxLCBNYXRoLm1heCgwLCBwYXJzZWQuY29uZmlkZW5jZSkpXG4gICAgICAgIDogMC41LFxuICAgICAgZXhwbGFuYXRpb246IFN0cmluZyhwYXJzZWQuZXhwbGFuYXRpb24gfHwgJ0FuYWx5emVkIHdpdGggR29vZ2xlIEdlbWluaSBWaXNpb24uJylcbiAgICB9O1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gcGFyc2UgR2VtaW5pIEpTT04gb3V0cHV0OicsIHJhd1RleHQsIGVycik7XG4gICAgcmV0dXJuIEZBTExCQUNLX1VOS05PV047XG4gIH1cbn1cblxuLyoqXG4gKiBDbGFzc2lmaWVzIGFuIGltYWdlIHVzaW5nIEdvb2dsZSBHZW1pbmkgVmlzaW9uIEFQSSB2aWEgdGhlIG9mZmljaWFsIFNES1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2xhc3NpZnlXYXN0ZVdpdGhHZW1pbmkoXG4gIGltYWdlRGF0YVVybDogc3RyaW5nLFxuICBhcGlLZXk/OiBzdHJpbmdcbik6IFByb21pc2U8R2VtaW5pQ2xhc3NpZmljYXRpb25SYXc+IHtcbiAgY29uc3QgcmVzb2x2ZWRLZXkgPSBhcGlLZXkgfHwgcHJvY2Vzcy5lbnYuR0VNSU5JX0FQSV9LRVkgfHwgcHJvY2Vzcy5lbnYuVklURV9HRU1JTklfQVBJX0tFWTtcblxuICBpZiAoIXJlc29sdmVkS2V5KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdHRU1JTklfQVBJX0tFWSBpcyBub3QgY29uZmlndXJlZCBvbiB0aGUgc2VydmVyLiBQbGVhc2UgYWRkIEdFTUlOSV9BUElfS0VZIHRvIHlvdXIgLmVudiBmaWxlLicpO1xuICB9XG5cbiAgY29uc3QgeyBtaW1lVHlwZSwgYmFzZTY0RGF0YSB9ID0gZXh0cmFjdEJhc2U2NEZyb21EYXRhVXJsKGltYWdlRGF0YVVybCk7XG5cbiAgaWYgKCFiYXNlNjREYXRhIHx8IGJhc2U2NERhdGEubGVuZ3RoIDwgNTApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ltYWdlIGRhdGEgaXMgZW1wdHkgb3IgaW52YWxpZC4nKTtcbiAgfVxuXG4gIGNvbnN0IGdlbkFJID0gbmV3IEdvb2dsZUdlbmVyYXRpdmVBSShyZXNvbHZlZEtleSk7XG5cbiAgLy8gQ2FuZGlkYXRlIG1vZGVscyBpbiBwcmVmZXJlbmNlIG9yZGVyXG4gIGNvbnN0IG1vZGVsQ2FuZGlkYXRlcyA9IFsnZ2VtaW5pLTIuMC1mbGFzaCcsICdnZW1pbmktMS41LWZsYXNoJ107XG5cbiAgbGV0IGxhc3RFcnJvcjogRXJyb3IgfCBudWxsID0gbnVsbDtcblxuICBmb3IgKGNvbnN0IG1vZGVsTmFtZSBvZiBtb2RlbENhbmRpZGF0ZXMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgbW9kZWwgPSBnZW5BSS5nZXRHZW5lcmF0aXZlTW9kZWwoe1xuICAgICAgICBtb2RlbDogbW9kZWxOYW1lLFxuICAgICAgICBnZW5lcmF0aW9uQ29uZmlnOiB7XG4gICAgICAgICAgdGVtcGVyYXR1cmU6IDAuMSxcbiAgICAgICAgICByZXNwb25zZU1pbWVUeXBlOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgbW9kZWwuZ2VuZXJhdGVDb250ZW50KFtcbiAgICAgICAgQ0xBU1NJRklDQVRJT05fUFJPTVBULFxuICAgICAgICB7XG4gICAgICAgICAgaW5saW5lRGF0YToge1xuICAgICAgICAgICAgbWltZVR5cGUsXG4gICAgICAgICAgICBkYXRhOiBiYXNlNjREYXRhXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICBdKTtcblxuICAgICAgY29uc3QgdGV4dCA9IHJlc3BvbnNlLnJlc3BvbnNlLnRleHQoKTtcbiAgICAgIGlmICghdGV4dCkge1xuICAgICAgICByZXR1cm4gRkFMTEJBQ0tfVU5LTk9XTjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHBhcnNlR2VtaW5pSnNvbih0ZXh0KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgbGFzdEVycm9yID0gZXJyO1xuICAgICAgY29uc29sZS53YXJuKGBBdHRlbXB0IHdpdGggJHttb2RlbE5hbWV9IGVuY291bnRlcmVkOmAsIGVyci5tZXNzYWdlIHx8IGVycik7XG4gICAgICAvLyBUcnkgbmV4dCBtb2RlbCBpZiA0MDQgb3IgbW9kZWwgbm90IGZvdW5kXG4gICAgICBpZiAoZXJyLnN0YXR1cyA9PT0gNDA0IHx8IGVyci5tZXNzYWdlPy5pbmNsdWRlcygnbm90IGZvdW5kJykpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvLyBGb3IgcmF0ZSBsaW1pdHMgKDQyOSkgb3Igb3RoZXIgZXJyb3JzLCBicmVhayBhbmQgcmVwb3J0XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICB0aHJvdyBsYXN0RXJyb3IgfHwgbmV3IEVycm9yKCdVbmFibGUgdG8gYW5hbHl6ZSB0aGUgaW1hZ2UgcmlnaHQgbm93LiBQbGVh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
