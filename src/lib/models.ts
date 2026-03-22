export type Provider = "anthropic" | "openai" | "bailian";

export interface ModelInfo {
  id: string; // "provider:model-name"
  provider: Provider;
  model: string;
  displayName: string;
  vendor: string;
  capabilities: string[];
  defaultFor?: boolean; // marks env-default for provider
}

export const MODELS: ModelInfo[] = [
  // ── Anthropic ─────────────────────────────────────────────────────────────
  {
    id: "anthropic:claude-sonnet-4-6",
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    displayName: "Claude Sonnet 4.6",
    vendor: "Anthropic",
    capabilities: ["文本生成"],
    defaultFor: true,
  },
  {
    id: "anthropic:claude-opus-4-6",
    provider: "anthropic",
    model: "claude-opus-4-6",
    displayName: "Claude Opus 4.6",
    vendor: "Anthropic",
    capabilities: ["文本生成"],
  },
  {
    id: "anthropic:claude-haiku-4-5-20251001",
    provider: "anthropic",
    model: "claude-haiku-4-5-20251001",
    displayName: "Claude Haiku 4.5",
    vendor: "Anthropic",
    capabilities: ["文本生成"],
  },

  // ── OpenAI ────────────────────────────────────────────────────────────────
  {
    id: "openai:gpt-5.4",
    provider: "openai",
    model: "gpt-5.4",
    displayName: "GPT-5.4",
    vendor: "OpenAI",
    capabilities: ["text", "reasoning", "vision"],
    defaultFor: true,
  },
  {
    id: "openai:gpt-5.4-mini",
    provider: "openai",
    model: "gpt-5.4-mini",
    displayName: "GPT-5.4-Mini",
    vendor: "OpenAI",
    capabilities: ["text"],
  },
  {
    id: "openai:gpt-5.3-codex",
    provider: "openai",
    model: "gpt-5.3-codex",
    displayName: "GPT-5.3-Codex",
    vendor: "OpenAI",
    capabilities: ["text", "reasoning"],
  },
  {
    id: "openai:gpt-5.2-codex",
    provider: "openai",
    model: "gpt-5.2-codex",
    displayName: "GPT-5.2-Codex",
    vendor: "OpenAI",
    capabilities: ["text", "reasoning"],
  },
  {
    id: "openai:gpt-5.2",
    provider: "openai",
    model: "gpt-5.2",
    displayName: "GPT-5.2",
    vendor: "OpenAI",
    capabilities: ["text", "reasoning"],
  },
  {
    id: "openai:gpt-5.1-codex-max",
    provider: "openai",
    model: "gpt-5.1-codex-max",
    displayName: "GPT-5.1-Codex-Max",
    vendor: "OpenAI",
    capabilities: ["text", "reasoning"],
  },
  {
    id: "openai:gpt-5.1-codex-mini",
    provider: "openai",
    model: "gpt-5.1-codex-mini",
    displayName: "GPT-5.1-Codex-Mini",
    vendor: "OpenAI",
    capabilities: ["text", "reasoning"],
  },

  // ── 百炼 · 千问 ────────────────────────────────────────────────────────────
  {
    id: "bailian:qwen3.5-plus",
    provider: "bailian",
    model: "qwen3.5-plus",
    displayName: "Qwen3.5 Plus",
    vendor: "千问",
    capabilities: ["文本生成", "深度思考", "视觉理解"],
    defaultFor: true,
  },
  {
    id: "bailian:qwen3-max-2026-01-23",
    provider: "bailian",
    model: "qwen3-max-2026-01-23",
    displayName: "Qwen3 Max",
    vendor: "千问",
    capabilities: ["文本生成", "深度思考"],
  },
  {
    id: "bailian:qwen3-coder-next",
    provider: "bailian",
    model: "qwen3-coder-next",
    displayName: "Qwen3 Coder Next",
    vendor: "千问",
    capabilities: ["文本生成"],
  },
  {
    id: "bailian:qwen3-coder-plus",
    provider: "bailian",
    model: "qwen3-coder-plus",
    displayName: "Qwen3 Coder Plus",
    vendor: "千问",
    capabilities: ["文本生成"],
  },

  // ── 百炼 · 智谱 ────────────────────────────────────────────────────────────
  {
    id: "bailian:glm-5",
    provider: "bailian",
    model: "glm-5",
    displayName: "GLM-5",
    vendor: "智谱",
    capabilities: ["文本生成", "深度思考"],
  },
  {
    id: "bailian:glm-4.7",
    provider: "bailian",
    model: "glm-4.7",
    displayName: "GLM-4.7",
    vendor: "智谱",
    capabilities: ["文本生成", "深度思考"],
  },

  // ── 百炼 · Kimi ────────────────────────────────────────────────────────────
  {
    id: "bailian:kimi-k2.5",
    provider: "bailian",
    model: "kimi-k2.5",
    displayName: "Kimi K2.5",
    vendor: "Kimi",
    capabilities: ["文本生成", "深度思考", "视觉理解"],
  },

  // ── 百炼 · MiniMax ─────────────────────────────────────────────────────────
  {
    id: "bailian:MiniMax-M2.5",
    provider: "bailian",
    model: "MiniMax-M2.5",
    displayName: "MiniMax M2.5",
    vendor: "MiniMax",
    capabilities: ["文本生成", "深度思考"],
  },
];

/** Resolve model by id, falling back to the env-configured default. */
export function resolveModel(modelId?: string | null): ModelInfo {
  if (modelId) {
    const found = MODELS.find((m) => m.id === modelId);
    if (found) return found;
  }

  // Read env-configured defaults
  const envProvider = (process.env.AI_PROVIDER || "bailian") as Provider;
  const envModel = process.env.AI_MODEL || process.env.BAILIAN_MODEL || process.env.DASHSCOPE_MODEL;

  if (envModel) {
    const byEnvModel = MODELS.find(
      (m) => m.provider === envProvider && m.model === envModel
    );
    if (byEnvModel) return byEnvModel;
  }

  // Default per provider
  const providerDefault = MODELS.find(
    (m) => m.provider === envProvider && m.defaultFor
  );
  if (providerDefault) return providerDefault;

  // Final fallback
  return MODELS[0];
}

/** Group models by vendor for display. */
export function groupModelsByVendor(): Record<string, ModelInfo[]> {
  const groups: Record<string, ModelInfo[]> = {};
  for (const m of MODELS) {
    if (!groups[m.vendor]) groups[m.vendor] = [];
    groups[m.vendor].push(m);
  }
  return groups;
}
