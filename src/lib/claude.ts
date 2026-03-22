import { resolveModel, type ModelInfo } from "./models";

// ─── Shared types ─────────────────────────────────────────────────────────────

export type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type PlanItem = {
  id: string;
  label: string;
  description: string;
};

export type PlanResult = {
  summary: string;
  items: PlanItem[];
};

type StreamChunk = {
  type: "content" | "reasoning";
  text: string;
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

const PLAN_SYSTEM_PROMPT = `You are Atoms Planner. Convert the user request into a short, implementation-ready checklist.

Return strict JSON only, no markdown:
{
  "summary": "one sentence summary",
  "items": [
    {
      "id": "req-1",
      "label": "short requirement title",
      "description": "one sentence detail"
    }
  ]
}

Rules:
- 3-8 items
- Focus on user-visible outcomes and core interactions
- Keep wording clear and concise
- Do not include backend/devops work unless user asked for it
- IDs must be unique and stable in format req-N`;

function buildUserMessage(prompt: string): string {
  return `Build the following: ${prompt}

Remember: output ONLY a single self-contained HTML file inside a \`\`\`html code block. No other text.`;
}

function buildPlanUserMessage(prompt: string): string {
  return `User request: ${prompt}

Generate the checklist JSON now.`;
}

function extractJsonObject(text: string): string {
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1];

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }

  return text;
}

function normalizePlanResult(rawText: string, prompt: string): PlanResult {
  try {
    const jsonText = extractJsonObject(rawText);
    const parsed = JSON.parse(jsonText) as {
      summary?: unknown;
      items?: Array<{ id?: unknown; label?: unknown; description?: unknown }>;
    };

    const items = Array.isArray(parsed.items)
      ? parsed.items
          .map((item, index) => {
            const label = typeof item.label === "string" ? item.label.trim() : "";
            const description =
              typeof item.description === "string" ? item.description.trim() : "";
            if (!label) return null;
            return {
              id:
                typeof item.id === "string" && item.id.trim()
                  ? item.id.trim()
                  : `req-${index + 1}`,
              label,
              description: description || "Implement this requirement in the generated app.",
            } as PlanItem;
          })
          .filter((item): item is PlanItem => item !== null)
          .slice(0, 8)
      : [];

    if (items.length > 0) {
      return {
        summary:
          typeof parsed.summary === "string" && parsed.summary.trim()
            ? parsed.summary.trim()
            : `Implementation plan for: ${prompt}`,
        items,
      };
    }
  } catch {
    // fallback below
  }

  return {
    summary: `Implementation plan for: ${prompt}`,
    items: [
      {
        id: "req-1",
        label: prompt.trim() || "Build the requested app",
        description: "Use this as the primary requirement for generation.",
      },
    ],
  };
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

  // Bailian-specific: allow thinking tokens so the UI can show them live
  if (info.provider === "bailian") {
    body.extra_body = { enable_thinking: true };
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

        const choice = (parsed?.choices as Array<{
          delta?: {
            content?: string;
            reasoning?: string;
            reasoning_content?: string;
          };
        }>)?.[0];

        const contentText = choice?.delta?.content;
        const reasoningText =
          choice?.delta?.reasoning_content ?? choice?.delta?.reasoning;

        if (typeof reasoningText === "string" && reasoningText.length > 0) {
          yield { type: "reasoning", text: reasoningText };
        }

        if (typeof contentText === "string" && contentText.length > 0) {
          yield { type: "content", text: contentText };
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

      const delta = parsed?.delta as {
        type?: string;
        text?: string;
        thinking?: string;
      };

      if (
        delta?.type === "thinking_delta" &&
        typeof delta.thinking === "string" &&
        delta.thinking.length > 0
      ) {
        yield { type: "reasoning", text: delta.thinking };
      }

      if (
        delta?.type === "text_delta" &&
        typeof delta.text === "string" &&
        delta.text.length > 0
      ) {
        yield { type: "content", text: delta.text };
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

async function generatePlanWithOpenAICompatible(
  prompt: string,
  history: HistoryMessage[],
  info: ModelInfo
): Promise<PlanResult> {
  let apiKey: string;
  let baseUrl: string;

  if (info.provider === "openai") {
    apiKey = process.env.OPENAI_API_KEY || "";
    baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  } else {
    apiKey = process.env.DASHSCOPE_API_KEY || process.env.BAILIAN_API_KEY || "";
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
    { role: "system", content: PLAN_SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: buildPlanUserMessage(prompt) },
  ];

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: info.model,
      stream: false,
      temperature: 0.2,
      max_tokens: 1200,
      messages,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${info.provider} API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content ?? "";
  return normalizePlanResult(content, prompt);
}

async function generatePlanWithAnthropic(
  prompt: string,
  history: HistoryMessage[],
  info: ModelInfo
): Promise<PlanResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY || "";
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

  const baseUrl = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";

  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: buildPlanUserMessage(prompt) },
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
      max_tokens: 1200,
      stream: false,
      system: PLAN_SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const text = (data.content || [])
    .filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text as string)
    .join("\n");

  return normalizePlanResult(text, prompt);
}

export async function generatePlan(
  prompt: string,
  history: HistoryMessage[],
  modelId?: string | null
): Promise<PlanResult> {
  const info = resolveModel(modelId);
  if (info.provider === "anthropic") {
    return generatePlanWithAnthropic(prompt, history, info);
  }
  return generatePlanWithOpenAICompatible(prompt, history, info);
}
