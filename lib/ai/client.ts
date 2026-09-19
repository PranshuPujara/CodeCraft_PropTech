import Groq from 'groq-sdk';

/**
 * Shared Groq AI Client Wrapper — Rental Intelligence Platform
 * ARCHITECTURE.md §7
 * Single source of truth for all LLM calls.
 */

let cachedGroq: Groq | null = null;
let lastApiKey: string | undefined = undefined;

export function getGroqClient(): Groq {
  const currentKey = process.env.GROQ_API_KEY || 'mock-api-key';
  if (!cachedGroq || lastApiKey !== currentKey) {
    cachedGroq = new Groq({ apiKey: currentKey });
    lastApiKey = currentKey;
  }
  return cachedGroq;
}

export const groq = new Proxy({} as Groq, {
  get(_target, prop) {
    const client = getGroqClient();
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});

export const DEFAULT_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const FALLBACK_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];

export interface AICompletionOptions {
  model?: string;
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Executes a completion request with Groq API.
 */
export async function completeText(options: AICompletionOptions): Promise<string> {
  const primaryModel = options.model || DEFAULT_MODEL;
  const modelsToTry = [primaryModel, ...FALLBACK_MODELS].filter(
    (m, i, arr) => arr.indexOf(m) === i
  );
  const maxTokens = options.maxTokens || 3000;
  const temperature = options.temperature ?? 0.2;

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const client = getGroqClient();
      const response = await client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          { role: 'system', content: options.systemPrompt },
          { role: 'user', content: options.userMessage }
        ],
      });

      return response.choices[0]?.message?.content || '';
    } catch (error: any) {
      lastError = error;
      console.warn(`Groq completeText with model ${model} failed, trying fallback:`, error?.message || error);
    }
  }

  console.error('Error in AI completeText:', lastError);
  throw lastError;
}

/**
 * Executes a completion request and parses response into structured JSON of type T.
 * Guarantees JSON response by prompting and cleaning markdown code-block wrappers if present.
 */
export async function completeStructuredJSON<T>(
  options: AICompletionOptions
): Promise<T> {
  const jsonSystemPrompt = `${options.systemPrompt}\n\nIMPORTANT: You MUST respond ONLY with valid JSON matching the requested structure. Do not include markdown code block backticks (e.g. \`\`\`json) or any conversational text before/after the JSON string.`;

  const primaryModel = options.model || DEFAULT_MODEL;
  const modelsToTry = [primaryModel, ...FALLBACK_MODELS].filter(
    (m, i, arr) => arr.indexOf(m) === i
  );
  const maxTokens = options.maxTokens || 3000;
  const temperature = options.temperature ?? 0.2;

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const client = getGroqClient();
      const response = await client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          { role: 'system', content: jsonSystemPrompt },
          { role: 'user', content: options.userMessage }
        ],
        response_format: { type: 'json_object' }
      });

      const rawText = response.choices[0]?.message?.content || '';

      // Clean codeblock formatting if the LLM outputted ```json ... ```
      const cleanedText = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      return JSON.parse(cleanedText) as T;
    } catch (err: any) {
      lastError = err;
      console.warn(`Groq completeStructuredJSON with model ${model} failed, trying fallback:`, err?.message || err);
    }
  }

  console.error('Failed to parse AI structured JSON output:', lastError);
  throw new Error(`AI JSON parse failure: ${(lastError as Error)?.message || 'Unknown error'}`);
}
