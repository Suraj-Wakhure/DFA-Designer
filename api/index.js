// Vercel Serverless Function — fully self-contained, no Windows dependencies
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

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

module.exports = app;
