export interface ParsedAssistantMessage {
  reasoning: string;
  response: string;
}

const THINKING_START = "<atoms-thinking>";
const THINKING_END = "</atoms-thinking>";
const RESPONSE_START = "<atoms-response>";
const RESPONSE_END = "</atoms-response>";

export function serializeAssistantMessage(
  reasoning: string,
  response: string
): string {
  if (!reasoning.trim()) {
    return response;
  }

  return [
    THINKING_START,
    reasoning.trim(),
    THINKING_END,
    RESPONSE_START,
    response,
    RESPONSE_END,
  ].join("\n");
}

export function parseAssistantMessage(content: string): ParsedAssistantMessage {
  const thinkingMatch = content.match(
    /<atoms-thinking>\s*([\s\S]*?)\s*<\/atoms-thinking>/i
  );
  const responseMatch = content.match(
    /<atoms-response>\s*([\s\S]*?)\s*<\/atoms-response>/i
  );

  if (!thinkingMatch && !responseMatch) {
    return { reasoning: "", response: content };
  }

  return {
    reasoning: thinkingMatch?.[1]?.trim() ?? "",
    response: responseMatch?.[1]?.trim() ?? "",
  };
}
