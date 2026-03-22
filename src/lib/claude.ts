import Anthropic from "@anthropic-ai/sdk";

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

export async function generateAppStream(
  prompt: string,
  history: { role: "user" | "assistant"; content: string }[]
) {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Build messages array with history + new prompt
  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    {
      role: "user" as const,
      content: buildUserMessage(prompt),
    },
  ];

  return client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 8096,
    system: SYSTEM_PROMPT,
    messages,
  });
}
