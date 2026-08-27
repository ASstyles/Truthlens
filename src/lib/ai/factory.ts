import { GeminiProvider } from "./gemini.provider";
import { MockLLMProvider } from "./mock.provider";

export function getLLMProvider(isDemo: boolean = false): GeminiProvider | MockLLMProvider {
  if (isDemo) {
    return new MockLLMProvider();
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey.trim().length < 10) {
    throw new Error(
      "Gemini API is not configured. Add GEMINI_API_KEY to .env.local to start a real assessment."
    );
  }

  return new GeminiProvider(geminiKey, process.env.AI_MODEL || "gemini-3.6-flash");
}
