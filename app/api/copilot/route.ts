import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getAuthUser } from '../../../lib/auth-session';
import { z } from 'zod';
import { generateCopilotResponse } from '../../../lib/ai/prompts/copilot';
import {
  loadUserCopilotContext,
  generateDeterministicGroundedResponse,
} from '../../../lib/ai/copilotContext';

export const dynamic = 'force-dynamic';

const ContextRefSchema = z.object({
  type: z.enum(['property', 'agreement', 'cost', 'roommate']).optional(),
  entityType: z.enum(['property', 'cost', 'agreement', 'userPreference']).optional(),
  entityId: z.string().optional(),
  id: z.string().optional(),
  label: z.string().optional(),
  name: z.string().optional(),
  snippet: z.string().optional(),
});

const CopilotResponseSchema = z.object({
  answer: z.string().min(1),
  contextRefs: z.array(ContextRefSchema).default([]),
  missingDataNotice: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    const body = await request.json().catch(() => ({}));
    const query = typeof body.query === 'string' ? body.query.trim() : '';
    const userId = authUser?.id || (typeof body.userId === 'string' && body.userId ? body.userId : 'demo-user-1');

    // Input validation
    if (!query) {
      return NextResponse.json(
        { error: 'Please enter a question to ask the Copilot.' },
        { status: 400 }
      );
    }

    if (query.length > 1000) {
      return NextResponse.json(
        { error: 'Question is too long. Please limit to 1,000 characters.' },
        { status: 400 }
      );
    }

    // 1. Gather all user context
    const userContext = await loadUserCopilotContext(userId);

    // 2. Generate grounded response via Groq AI with deterministic fallback
    const copilotResult = await generateCopilotResponse(query, userContext);

    // 3. Schema validation & fallback
    const validated = CopilotResponseSchema.safeParse(copilotResult);
    const finalResult = validated.success
      ? validated.data
      : generateDeterministicGroundedResponse(query, userContext);

    // 4. Persist conversation in database
    try {
      await db.chatMessage.create({
        data: {
          userId,
          role: 'user',
          content: query,
        },
      });

      const assistantMessage = await db.chatMessage.create({
        data: {
          userId,
          role: 'assistant',
          content: finalResult.answer,
          contextRefs: JSON.stringify(finalResult.contextRefs),
        },
      });

      return NextResponse.json({
        id: assistantMessage.id,
        answer: finalResult.answer,
        contextRefs: finalResult.contextRefs,
        missingDataNotice: finalResult.missingDataNotice || null,
        createdAt: assistantMessage.createdAt,
      });
    } catch (dbErr) {
      console.error('Failed to persist chat message:', dbErr);
      return NextResponse.json({
        id: `msg-${Date.now()}`,
        answer: finalResult.answer,
        contextRefs: finalResult.contextRefs,
        missingDataNotice: finalResult.missingDataNotice || null,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error processing Copilot request:', error);
    return NextResponse.json(
      { error: 'Failed to process inquiry. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser();
    const { searchParams } = new URL(request.url);
    const userId = authUser?.id || searchParams.get('userId') || 'demo-user-1';

    const messages = await db.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    const parsed = messages.map((m) => {
      let contextRefs = [];
      try {
        contextRefs = m.contextRefs ? JSON.parse(m.contextRefs) : [];
      } catch {
        contextRefs = [];
      }
      return {
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        contextRefs,
        createdAt: m.createdAt,
      };
    });

    return NextResponse.json({ messages: parsed });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation history.' },
      { status: 500 }
    );
  }
}
