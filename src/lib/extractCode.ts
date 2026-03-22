/**
 * Extracts clean HTML from Claude's raw output which may include
 * markdown fencing, explanatory text, etc.
 */
export function extractHTML(raw: string): string {
  const text = raw.trim();
  if (!text) return "";

  // 0. Handle opening fenced block even when closing fence hasn't streamed yet.
  const openingFenceAtStart = text.match(/^```(?:html)?\s*\n?/i);
  if (openingFenceAtStart) {
    const body = text.slice(openingFenceAtStart[0].length);
    const closingIdx = body.lastIndexOf("```");
    return (closingIdx >= 0 ? body.slice(0, closingIdx) : body).trim();
  }

  // 1. Try ```html ... ``` fenced block
  const fencedHtml = text.match(/```html\s*([\s\S]*?)```/i);
  if (fencedHtml) return fencedHtml[1].trim();

  // 2. Try bare ``` ... ``` block
  const fencedBare = text.match(/```\s*([\s\S]*?)```/);
  if (fencedBare) return fencedBare[1].trim();

  // 3. Try unclosed fenced block that appears later in the output
  const unclosedFence = text.match(/```(?:html)?\s*([\s\S]*)$/i);
  if (unclosedFence) return unclosedFence[1].trim();

  // 3. Try to find full HTML document
  const fullDoc = text.match(/<!DOCTYPE\s+html[\s\S]*?<\/html>/i);
  if (fullDoc) return fullDoc[0].trim();

  // 4. Try to find any html tag
  const htmlTag = text.match(/<html[\s\S]*?<\/html>/i);
  if (htmlTag) return htmlTag[0].trim();

  // 5. Fallback: return as-is
  return text;
}
