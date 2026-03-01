import { DFA_SYSTEM_PROMPT } from "../constants.js";

/**
 * Calls the local Express proxy (/api/generate-dfa),
 * which forwards the request to Anthropic with the API key.
 */
export async function generateDFAFromPrompt(userQuery) {
  const response = await fetch("/api/generate-dfa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: DFA_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Design a minimal, correct DFA for: ${userQuery}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Server error ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.content
    .map((block) => block.text || "")
    .join("")
    .trim();

  // Strip accidental markdown fences
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Last resort: grab first {...} block
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) parsed = JSON.parse(match[0]);
    else throw new Error("Could not parse DFA JSON from AI response.");
  }

  return parsed;
}
