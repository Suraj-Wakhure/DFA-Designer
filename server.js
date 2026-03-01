const express = require("express");
const cors = require("cors");
const path = require("path");
const { execSync } = require("child_process");
require("dotenv").config();

function freePort(port) {
  try {
    const result = execSync(`netstat -ano | findstr :${port}`).toString();
    const pids = new Set();
    result.trim().split("\n").forEach((line) => {
      const parts = line.trim().split(/\s+/);
      if (parts[3] === "LISTENING") pids.add(parts[4]);
    });
    pids.forEach((pid) => {
      try { execSync(`taskkill /PID ${pid} /F`); } catch {}
    });
    console.log(`♻ Freed port ${port}`);
  } catch {
    // port was already free
  }
}

const app = express();

app.use(cors());
app.use(express.json());

// Serve built frontend (local only — Vercel serves static files from dist automatically)
app.use(express.static(path.join(__dirname, "dist")));

// Proxy route for Groq API (free tier)
app.post("/api/generate-dfa", async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GROQ_API_KEY not set in environment." });
  }

  try {
    const { system, messages, max_tokens } = req.body;
    const userMessage = messages?.[0]?.content || "";

    const groqBody = {
      model: "llama-3.3-70b-versatile",
      max_tokens: max_tokens || 2000,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMessage },
      ],
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(groqBody),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "Groq API error" });
    }

    const text = data.choices?.[0]?.message?.content || "";
    res.json({ content: [{ type: "text", text }] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback to index.html for SPA routing (local only)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start server only when run directly (not when imported by Vercel)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  freePort(PORT);
  app.listen(PORT, () => {
    console.log(`\n✅ DFA Designer running at http://localhost:${PORT}\n`);
  });
}

module.exports = app;

app.use(cors());
app.use(express.json());

// Serve built frontend
app.use(express.static(path.join(__dirname, "dist")));

// Proxy route for Groq API (free tier)
app.post("/api/generate-dfa", async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GROQ_API_KEY not set in environment." });
  }

  try {
    // req.body arrives in Anthropic format: { model, max_tokens, system, messages }
    const { system, messages, max_tokens } = req.body;
    const userMessage = messages?.[0]?.content || "";

    const groqBody = {
      model: "llama-3.3-70b-versatile",
      max_tokens: max_tokens || 2000,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMessage },
      ],
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(groqBody),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "Groq API error" });
    }

    // Transform Groq response → Anthropic-compatible format so frontend works unchanged
    const text = data.choices?.[0]?.message?.content || "";
    res.json({ content: [{ type: "text", text }] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback to index.html for SPA routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});

freePort(PORT);
app.listen(PORT, () => {
  console.log(`\n✅ DFA Designer running at http://localhost:${PORT}\n`);
});
