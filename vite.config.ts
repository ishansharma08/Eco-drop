import { defineConfig, loadEnv, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { classifyWasteWithGemini } from "./server/classifyWasteHandler";

function wasteClassifierApiPlugin(): Plugin {
  return {
    name: 'waste-classifier-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/classify-waste') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 15 * 1024 * 1024) {
              res.statusCode = 413;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Image size too large. Maximum 15MB.' }));
              req.destroy();
            }
          });

          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const imageDataUrl = parsed.image;
              if (!imageDataUrl) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'No image provided in request body.' }));
                return;
              }

              const result = await classifyWasteWithGemini(imageDataUrl, parsed.apiKey);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err: any) {
              console.error('API Error in /api/classify-waste:', err);
              const isKeyMissing = err.message?.includes('GEMINI_API_KEY is not configured');
              res.statusCode = isKeyMissing ? 503 : 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                error: isKeyMissing
                  ? 'Gemini API key is not configured on the server. Please add GEMINI_API_KEY to your .env file.'
                  : 'Unable to analyze the image right now. Please try again.',
                details: err.message
              }));
            }
          });
          return;
        }

        if (req.url?.startsWith('/api/classify-waste') && req.method === 'GET') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            status: 'online',
            endpoint: '/api/classify-waste',
            keyConfigured: Boolean(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY)
          }));
          return;
        }

        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/classify-waste') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const result = await classifyWasteWithGemini(parsed.image, parsed.apiKey);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Analysis failed' }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  if (env.VITE_GEMINI_API_KEY) process.env.VITE_GEMINI_API_KEY = env.VITE_GEMINI_API_KEY;

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      wasteClassifierApiPlugin(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

