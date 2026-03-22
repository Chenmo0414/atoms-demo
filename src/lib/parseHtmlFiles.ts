/**
 * Splits a single HTML file into virtual files for the editor file tree.
 * Extracts inline <style> → styles.css and inline <script> → script.js.
 * Provides a merge utility to reassemble them into a single HTML string.
 */

export type FileRecord = Record<string, string>;

/** Sentinel strings we inject into the skeleton HTML so we can replace them back. */
const CSS_PLACEHOLDER = '<link rel="stylesheet" href="styles.css">';
const JS_PLACEHOLDER = '<script src="script.js"></script>';

export function parseHtmlToFiles(html: string): FileRecord {
  const files: FileRecord = {};
  let skeleton = html;

  // Extract first inline <style> block
  const styleMatch = skeleton.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  if (styleMatch) {
    const css = styleMatch[1].trim();
    if (css) {
      files["styles.css"] = css;
      skeleton = skeleton.replace(styleMatch[0], CSS_PLACEHOLDER);
    }
  }

  // Extract first inline <script> block (no src attribute)
  const scriptMatch = skeleton.match(/<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/i);
  if (scriptMatch) {
    const js = scriptMatch[1].trim();
    if (js) {
      files["script.js"] = js;
      skeleton = skeleton.replace(scriptMatch[0], JS_PLACEHOLDER);
    }
  }

  files["index.html"] = skeleton;

  // Return in a predictable order
  const ordered: FileRecord = {};
  for (const key of ["index.html", "styles.css", "script.js"]) {
    if (files[key] !== undefined) ordered[key] = files[key];
  }
  return ordered;
}

export function mergeFilesToHtml(files: FileRecord): string {
  let html = files["index.html"] ?? "";

  if (files["styles.css"] !== undefined) {
    const tag = `<style>\n${files["styles.css"]}\n</style>`;
    html = html.includes(CSS_PLACEHOLDER)
      ? html.replace(CSS_PLACEHOLDER, tag)
      : html; // nothing to replace (no style was extracted)
  }

  if (files["script.js"] !== undefined) {
    const tag = `<script>\n${files["script.js"]}\n</script>`;
    html = html.includes(JS_PLACEHOLDER)
      ? html.replace(JS_PLACEHOLDER, tag)
      : html;
  }

  return html;
}

export function getLanguage(filename: string): string {
  if (filename.endsWith(".css")) return "css";
  if (filename.endsWith(".js")) return "javascript";
  return "html";
}
