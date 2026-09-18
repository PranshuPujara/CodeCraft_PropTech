import Anthropic from '@anthropic-ai/sdk';

/**
 * Shared Anthropic AI Client Wrapper — Rental Intelligence Platform
 * ARCHITECTURE.md §7
 * Single source of truth for all LLM calls.
 */

const apiKey = process.env.ANTHROPIC_API_KEY || 'mock-api-key';

export const anthropic = new Anthropic({
  apiKey: apiKey,
});

export const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';

export interface AICompletionOptions {
  model?: string;
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Executes a completion request with Anthropic Claude API.
 */
export async function completeText(options: AICompletionOptions): Promise<string> {
  const model = options.model || DEFAULT_MODEL;
  const maxTokens = options.maxTokens || 1500;
  const temperature = options.temperature ?? 0.2;

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: options.systemPrompt,
      messages: [{ role: 'user', content: options.userMessage }],
    });

    const firstBlock = response.content[0];
    if (firstBlock && firstBlock.type === 'text') {
      return firstBlock.text;
    }
    return '';
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

  const rawText = await completeText({
    ...options,
    systemPrompt: jsonSystemPrompt,
  });

  try {
    // Clean codeblock formatting if the LLM outputted ```json ... ```
    const cleanedText = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    return JSON.parse(cleanedText) as T;
  } catch (err) {
    console.error('Failed to parse AI structured JSON output:', rawText, err);
    throw new Error(`AI JSON parse failure: ${(err as Error).message}`);
  }
}
