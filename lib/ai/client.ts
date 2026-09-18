import Groq from 'groq-sdk';

/**
 * Shared Groq AI Client Wrapper — Rental Intelligence Platform
 * ARCHITECTURE.md §7
 * Single source of truth for all LLM calls.
 */

const apiKey = process.env.GROQ_API_KEY || 'mock-api-key';

export const groq = new Groq({
  apiKey: apiKey,
});

export const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';

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
  const model = options.model || DEFAULT_MODEL;
  const maxTokens = options.maxTokens || 1500;
  const temperature = options.temperature ?? 0.2;

  try {
    const response = await groq.chat.completions.create({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        { role: 'system', content: options.systemPrompt },
        { role: 'user', content: options.userMessage }
      ],
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error in AI completeText:', error);
    throw error;
  }
}

/**
 * Executes a completion request and parses response into structured JSON of type T.
 * Guarantees JSON response by prompting and cleaning markdown code-block wrappers if present.
 */
export async function completeStructuredJSON<T>(
  options: AICompletionOptions
): Promise<T> {
  const jsonSystemPrompt = `${options.systemPrompt}\n\nIMPORTANT: You MUST respond ONLY with valid JSON matching the requested structure. Do not include markdown code block backticks (e.g. \`\`\`json) or any conversational text before/after the JSON string.`;

  const model = options.model || DEFAULT_MODEL;
  const maxTokens = options.maxTokens || 1500;
  const temperature = options.temperature ?? 0.2;

  try {
    const response = await groq.chat.completions.create({
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
    console.error('Failed to parse AI structured JSON output:', err);
    throw new Error(`AI JSON parse failure: ${(err as Error).message}`);
  }
}
