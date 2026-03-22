export function summarizeProjectTitle(prompt: string): string {
  const cleaned = prompt
    .replace(/\s+/g, " ")
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim();

  if (!cleaned) return "New Project";

  const firstClause = cleaned
    .split(/[.!?。！？\n]/)[0]
    .replace(/^(build|create|make|生成|创建|做一个|帮我做|请做)\s*/i, "")
    .trim();

  const base = firstClause || cleaned;
  const maxLen = 36;
  return base.length > maxLen ? `${base.slice(0, maxLen).trim()}...` : base;
}
