import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

function safeParseRequestBody(body) {
  if (body === null || body === undefined) return {};
  if (typeof body === "object" && !(body instanceof Buffer)) return body;
  if (typeof body !== "string") return body;
  const trimmed = body.trim();
  if (!trimmed) return {};
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed);
    } catch (_e) {
      return body;
    }
  }
  return body;
}

// Middleware for parsing body as text or JSON (Vercel parses bodies or gives raw strings sometimes, but we'll use text for raw parsing in endpoints)
app.use(express.text({ type: "*/*" }));

// Route API requests
app.use("/api", async (req, res) => {
  try {
    const endpointPath = path.join(__dirname, "api", req.path + ".js");
    if (fs.existsSync(endpointPath)) {
      // Bust cache for hot reloading
      const moduleUrl = `file://${endpointPath}?update=${Date.now()}`;
      const module = await import(moduleUrl);
      const handler = module.default || module.handler;
      if (typeof handler === "function") {
        req.body = safeParseRequestBody(req.body);
        await handler(req, res);
      } else {
        res.status(500).send("Export default not found");
      }
    } else {
      res.status(404).send("API endpoint not found");
    }
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Vite Integration
let viteServer;
if (process.env.NODE_ENV !== "production") {
  try {
    const vite = await import("vite");
    viteServer = await vite.createServer({
      server: { middlewareMode: true },
      appType: "mpa", // Multi-Page App
    });
    // Use vite's connect instance as middleware
    app.use(viteServer.middlewares);
  } catch (e) {
    console.error("Failed to start Vite middleware:", e);
    app.use(express.static(__dirname));
  }
} else {
  // Serve static files in production from dist or root
  if (fs.existsSync(path.join(__dirname, "dist"))) {
    app.use(express.static(path.join(__dirname, "dist")));
  } else {
    app.use(express.static(__dirname));
  }
}

// Fallback for SPA/PWA routing (if needed)
app.use((req, res) => {
  const indexFile =
    process.env.NODE_ENV === "production" && fs.existsSync(path.join(__dirname, "dist"))
      ? path.join(__dirname, "dist", "index.html")
      : path.join(__dirname, "index.html");
  res.sendFile(indexFile);
});

app.listen(PORT, () => {
  console.log(`Local Development Server running at http://localhost:${PORT}`);
});
