import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import crypto from "crypto";
import multer from "multer";

dotenv.config();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype.includes('csv') ||
      file.mimetype.includes('excel') ||
      file.mimetype.includes('spreadsheet') ||
      file.mimetype.includes('pdf') ||
      file.mimetype.includes('text') ||
      file.originalname.endsWith('.csv') ||
      file.originalname.endsWith('.xlsx');
    cb(null, ok);
  },
});const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype.includes('csv') ||
      file.mimetype.includes('excel') ||
      file.mimetype.includes('spreadsheet') ||
      file.mimetype.includes('pdf') ||
      file.mimetype.includes('text') ||
      file.originalname.endsWith('.csv') ||
      file.originalname.endsWith('.xlsx');
    cb(null, ok);
  },
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));
  const PORT = 3000;

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  // Google OAuth URL
  app.get("/api/auth/google/url", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(503).json({ error: "GOOGLE_CLIENT_ID not set in Secrets" });
    }
    const redirectUri = `${req.protocol}://${req.get("host")}/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });
    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  });

  // Google OAuth Callback — real token exchange
  app.get(["/auth/google/callback", "/auth/google/callback/"], async (req, res) => {
    const { code, error } = req.query as Record<string, string>;

    if (error) {
      return res.send(`<html><body><script>
        window.opener && window.opener.postMessage({ type: 'OAUTH_ERROR', error: '${error}' }, '*');
        window.close();
      </script><p>Error: ${error}</p></body></html>`);
    }

    if (!code) return res.status(400).send("Missing code");

    try {
      const redirectUri = `${req.protocol}://${req.get("host")}/auth/google/callback`;

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokens = await tokenRes.json() as any;
      if (tokens.error) throw new Error(tokens.error_description || tokens.error);

      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const gUser = await userRes.json() as any;

      const user = {
        id: gUser.id || crypto.randomUUID(),
        email: gUser.email,
        name: gUser.name || gUser.email.split("@")[0],
      };

      res.send(`<html><body><script>
        if (window.opener) {
          window.opener.postMessage({
            type: 'OAUTH_AUTH_SUCCESS',
            user: ${JSON.stringify(user)}
          }, '*');
          window.close();
        } else { window.location.href = '/'; }
      </script></body></html>`);

    } catch (err: any) {
      console.error("OAuth error:", err.message);
      res.send(`<html><body><script>
        window.opener && window.opener.postMessage({ type: 'OAUTH_ERROR', error: '${err.message}' }, '*');
        window.close();
      </script><p>Failed: ${err.message}</p></body></html>`);
    }
  });

  // File upload + AI analysis
  app.post("/api/upload-analyze", upload.single("file"), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { indicator, kpiType, description, userPrompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      fs.unlink(req.file.path, () => {});
      return res.status(503).json({ error: "GEMINI_API_KEY not set in Secrets" });
    }

    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      const fileName = req.file.originalname;
      const isPDF = req.file.mimetype === "application/pdf";

      let contentPart: any;
      if (isPDF) {
        contentPart = {
          inline_data: {
            mime_type: "application/pdf",
            data: fileBuffer.toString("base64"),
          },
        };
      } else {
        let text = fileBuffer.toString("utf-8");
        if (text.length > 8000) text = text.slice(0, 8000) + "\n...[truncated]";
        contentPart = { text: `FILE CONTENTS:\n${text}` };
      }

      const prompt = `You are a manufacturing KPI analyst. Extract the KPI value from this file.

KPI type: ${kpiType || "general"}
Indicator: ${indicator || "not specified"}
Description: ${description || "not specified"}
User request: ${userPrompt || "Extract the main KPI value"}

Respond ONLY with this JSON (no markdown, no explanation):
{
  "value": "number with unit e.g. 94.2% or $1,240 or 12.4t",
  "trend": "change vs prior period e.g. +2.4% or -1.1% or N/A",
  "insight": "one sentence on what this means for the business"
}`;

      const aiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }, contentPart] }],
            generationConfig: { maxOutputTokens: 300, temperature: 0.1 },
          }),
        }
      );

      const aiData = await aiRes.json() as any;
      const raw: string = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

      let parsed: any = {};
      try {
        parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      } catch {
        parsed = { value: "--", trend: "N/A", insight: raw.slice(0, 120) };
      }

      fs.unlink(req.file.path, () => {});

      res.json({
        value: parsed.value || "--",
        trend: parsed.trend || "N/A",
        insight: parsed.insight || "No insight available.",
        fileName,
        extractedAt: new Date().toISOString(),
      });

    } catch (err: any) {
      fs.unlink(req.file.path, () => {});
      res.status(500).json({ error: "Analysis failed: " + err.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Server on http://localhost:${PORT}`));
}

startServer();
