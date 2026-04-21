import { anthropic, BOT_MODEL } from "@/lib/anthropic";
import { BOT_SYSTEM_PROMPT } from "./system-prompt";
import { BOT_TOOLS } from "./tools";

const MAX_TOKENS = 2048;

export async function generateBotReply(userMessage: string): Promise<string> {
  const finalMessage = await anthropic.beta.messages.toolRunner({
    model: BOT_MODEL,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: "text",
        text: BOT_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: BOT_TOOLS,
    messages: [{ role: "user", content: userMessage }],
  });

  const textParts: string[] = [];
  for (const block of finalMessage.content) {
    if (block.type === "text") {
      textParts.push(block.text);
    }
  }
  const reply = textParts.join("\n").trim();
  return (
    reply ||
    "Lo siento, no pude procesar tu mensaje. ¿Puedes intentarlo de otra forma?"
  );
}
