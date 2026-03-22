/**
 * Extracts clean HTML from Claude's raw output which may include
 * markdown fencing, explanatory text, etc.
 */
export function extractHTML(raw: string): string {
  // 1. Try ```html ... ``` fenced block
  const fencedHtml = raw.match(/```html\s*([\s\S]*?)```/i);
  if (fencedHtml) return fencedHtml[1].trim();

  // 2. Try bare ``` ... ``` block
  const fencedBare = raw.match(/```\s*([\s\S]*?)```/);
  if (fencedBare) return fencedBare[1].trim();

  // 3. Try to find full HTML document
  const fullDoc = raw.match(/<!DOCTYPE\s+html[\s\S]*?<\/html>/i);
  if (fullDoc) return fullDoc[0].trim();

  // 4. Try to find any html tag
  const htmlTag = raw.match(/<html[\s\S]*?<\/html>/i);
  if (htmlTag) return htmlTag[0].trim();

  // 5. Fallback: return as-is
  return raw.trim();
}
