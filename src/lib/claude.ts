import { resolveModel, type ModelInfo } from "./models";

// ─── Shared types ─────────────────────────────────────────────────────────────

export type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

type StreamChunk = {
  type: "content_block_delta";
  delta: { type: "text_delta"; text: string };
};

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Atoms, an AI agent that generates complete, self-contained web applications.

CRITICAL RULES:
1. Respond with a SINGLE complete HTML file. Nothing else outside the code block.
2. All CSS must be inside <style> tags. All JavaScript inside <script> tags.
3. No external dependencies or imports that require a network connection.
   Exception: you MAY use one CDN link for a popular UI library (e.g., Tailwind CDN, Font Awesome) if appropriate.
4. The app must be immediately runnable in a sandboxed iframe with no build step.
5. Make the UI beautiful by default: cohesive color palette, proper spacing, responsive design.
6. Include realistic placeholder data when appropriate.
7. All interactions must work (buttons, forms, toggles, modals) using vanilla JavaScript.
8. Wrap your entire output in a markdown code block: \`\`\`html ... \`\`\`
9. Do NOT include any explanation, markdown text, or commentary outside the code block.

QUALITY STANDARDS:
- Professional, modern visual design (never bare unstyled HTML)
- Mobile-responsive using CSS flexbox/grid
- Smooth transitions and hover states
- Accessible: semantic HTML, appropriate ARIA labels
- Handle empty states and loading states gracefully

When iterating on an existing app, preserve the existing functionality. Only modify what the user asks to change. Re-output the COMPLETE updated HTML file.`;

function buildUserMessage(prompt: string): string {
  return `Build the following: ${prompt}

Remember: output ONLY a single self-contained HTML file inside a \`\`\`html code block. No other text.`;
}

// ─── OpenAI-compatible streaming (OpenAI + Bailian/DashScope) ─────────────────

async function* streamOpenAICompatible(
  prompt: string,
  history: HistoryMessage[],
  info: ModelInfo
): AsyncGenerator<StreamChunk> {
  let apiKey: string;
  let baseUrl: string;

  if (info.provider === "openai") {
    apiKey = process.env.OPENAI_API_KEY || "";
    baseUrl =
      process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  } else {
    // bailian / DashScope
    apiKey =
      process.env.DASHSCOPE_API_KEY ||
      process.env.BAILIAN_API_KEY ||
      "";
    baseUrl =
      process.env.DASHSCOPE_BASE_URL ||
      process.env.BAILIAN_BASE_URL ||
      "https://dashscope.aliyuncs.com/compatible-mode/v1";
  }

  if (!apiKey) {
    throw new Error(
      info.provider === "openai"
        ? "Missing OPENAI_API_KEY"
        : "Missing DASHSCOPE_API_KEY (or BAILIAN_API_KEY)"
    );
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: buildUserMessage(prompt) },
  ];

  const body: Record<string, unknown> = {
    model: info.model,
    stream: true,
    temperature: 0.7,
    max_tokens: 8192,
    messages,
  };

  // Bailian-specific: disable thinking tokens to keep output clean
  if (info.provider === "bailian") {
    body.extra_body = { enable_thinking: false };
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${info.provider} API error ${response.status}: ${text}`);
  }

  if (!response.body) throw new Error("Empty response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const event of events) {
      for (const line of event.split("\n").map((l) => l.trim()).filter(Boolean)) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;

        let parsed: Record<string, unknown>;
        try {
          parsed = JSON.parse(data);
        } catch {
          continue;
        }

        const choices = parsed?.choices as Array<{ delta?: { content?: string } }>;
        const text = choices?.[0]?.delta?.content;
        if (typeof text === "string" && text.length > 0) {
          yield { type: "content_block_delta", delta: { type: "text_delta", text } };
        }
      }
    }
  }
}

// ─── Anthropic streaming (direct HTTP, no SDK) ────────────────────────────────

async function* streamAnthropic(
  prompt: string,
  history: HistoryMessage[],
  info: ModelInfo
): AsyncGenerator<StreamChunk> {
  const apiKey = process.env.ANTHROPIC_API_KEY || "";
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

  const baseUrl =
    process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";

  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: buildUserMessage(prompt) },
  ];

  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: info.model,
      max_tokens: 8096,
      stream: true,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${text}`);
  }

  if (!response.body) throw new Error("Empty response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const event of events) {
      // Anthropic SSE: "event: <type>\ndata: <json>"
      let eventType = "";
      let dataLine = "";

      for (const line of event.split("\n").map((l) => l.trim()).filter(Boolean)) {
        if (line.startsWith("event:")) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataLine = line.slice(5).trim();
        }
      }

      if (eventType !== "content_block_delta" || !dataLine) continue;

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(dataLine);
      } catch {
        continue;
      }

      const delta = parsed?.delta as { type?: string; text?: string };
      if (delta?.type === "text_delta" && typeof delta.text === "string" && delta.text.length > 0) {
        yield { type: "content_block_delta", delta: { type: "text_delta", text: delta.text } };
      }
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate an app stream using the specified model (or env default).
 * Returns an AsyncGenerator yielding StreamChunk objects.
 */
export async function generateAppStream(
  prompt: string,
  history: HistoryMessage[],
  modelId?: string | null
): Promise<AsyncGenerator<StreamChunk>> {
  const info = resolveModel(modelId);

  if (info.provider === "anthropic") {
    return streamAnthropic(prompt, history, info);
  } else {
    return streamOpenAICompatible(prompt, history, info);
  }
}
