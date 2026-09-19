import { describe, it, expect } from 'vitest';
import { POST, GET } from '../../app/api/copilot/route';
import {
  loadUserCopilotContext,
  generateDeterministicGroundedResponse,
} from '../../lib/ai/copilotContext';
import { db } from '../../lib/db';
import { LEGAL_GUARDRAIL_DISCLAIMER } from '../../lib/ai/types';

describe('Phase 5: AI Rental Copilot Unit & Integration Tests', () => {
  it('loads real user context including budget, saved properties, and agreements', async () => {
    const context = await loadUserCopilotContext('demo-user-1');
    expect(context.user).toBeDefined();
    expect(context.user.budget).toBe(35000);
    expect(Array.isArray(context.savedProperties)).toBe(true);
    expect(context.savedProperties.length).toBeGreaterThan(0);
    expect(context.savedProperties[0]).toHaveProperty('costBreakdown');
  });

  // Question 1
  it('1. answers "Can I afford this apartment?" using user budget and true monthly cost', async () => {
    const context = await loadUserCopilotContext('demo-user-1');
    const res = generateDeterministicGroundedResponse('Can I afford this apartment?', context);

    expect(res.answer).toBeDefined();
    expect(res.answer.toLowerCase()).toContain('budget');
    expect(res.answer).toMatch(/35,000/);
    expect(res.contextRefs.length).toBeGreaterThan(0);
    expect(res.contextRefs.some((r) => r.type === 'property')).toBe(true);
    expect(res.contextRefs.some((r) => r.type === 'cost')).toBe(true);
  });

  // Question 2
  it('2. answers "Explain this agreement clause." referencing agreement terms with legal disclaimer', async () => {
    const context = await loadUserCopilotContext('demo-user-1');
    const res = generateDeterministicGroundedResponse('Explain this agreement clause.', context);

    expect(res.answer).toBeDefined();
    if (context.agreements.length > 0) {
      expect(res.contextRefs.some((r) => r.type === 'agreement')).toBe(true);
      expect(res.answer).toContain('not legal advice');
    } else {
      expect(res.missingDataNotice).toBeDefined();
    }
  });

  // Question 3
  it('3. answers "Compare these properties." with side-by-side trade-offs', async () => {
    const context = await loadUserCopilotContext('demo-user-1');
    const res = generateDeterministicGroundedResponse('Compare these properties.', context);

    expect(res.answer).toBeDefined();
    if (context.savedProperties.length >= 2) {
      expect(res.answer.toLowerCase()).toContain('trade-off');
      const propertyRefs = res.contextRefs.filter((r) => r.type === 'property');
      expect(propertyRefs.length).toBeGreaterThanOrEqual(2);
    } else {
      expect(res.missingDataNotice).toBeDefined();
    }
  });

  // Question 4
  it('4. answers "What is my actual monthly cost?" with itemized recurring breakdown', async () => {
    const context = await loadUserCopilotContext('demo-user-1');
    const res = generateDeterministicGroundedResponse('What is my actual monthly cost?', context);

    expect(res.answer).toBeDefined();
    expect(res.answer).toContain('Base Rent:');
    expect(res.answer).toContain('Maintenance:');
    expect(res.contextRefs.some((r) => r.type === 'cost')).toBe(true);
  });

  // Question 5
  it('5. answers "Why was this property recommended?" matching stated preferences', async () => {
    const context = await loadUserCopilotContext('demo-user-1');
    const res = generateDeterministicGroundedResponse('Why was this property recommended?', context);

    expect(res.answer).toBeDefined();
    expect(res.answer.toLowerCase()).toContain('recommended');
    expect(res.contextRefs.some((r) => r.type === 'property')).toBe(true);
  });

  // Question 6
  it('6. answers "What should I pay attention to?" with attention flags and cash requirements', async () => {
    const context = await loadUserCopilotContext('demo-user-1');
    const res = generateDeterministicGroundedResponse('What should I pay attention to?', context);

    expect(res.answer).toBeDefined();
    expect(res.answer.toLowerCase()).toContain('attention');
    expect(res.answer).toContain('not legal advice');
    expect(res.contextRefs.length).toBeGreaterThan(0);
  });

  it('handles missing data gracefully with missingDataNotice when context is empty', () => {
    const emptyContext = {
      user: { id: 'test', name: 'Test', budget: 30000, preferences: {} },
      savedProperties: [],
      agreements: [],
      roommates: [],
    };

    const res = generateDeterministicGroundedResponse('Explain this agreement clause', emptyContext);
    expect(res.missingDataNotice).toBeDefined();
    expect(res.missingDataNotice).toContain('No uploaded lease agreements');
  });

  describe('API Route: /api/copilot', () => {
    it('rejects empty query with HTTP 400', async () => {
      const req = new Request('http://localhost:3000/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '   ' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/enter a question/i);
    });

    it('rejects overly long query exceeding 1000 characters with HTTP 400', async () => {
      const longQuery = 'a'.repeat(1001);
      const req = new Request('http://localhost:3000/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: longQuery }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/too long/i);
    });

    it('processes inquiry, returns grounded response, and persists message', async () => {
      const query = 'Can I afford this apartment with my ₹35,000 budget?';
      const req = new Request('http://localhost:3000/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, userId: 'demo-user-1' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('answer');
      expect(json).toHaveProperty('contextRefs');
      expect(Array.isArray(json.contextRefs)).toBe(true);
      expect(json.contextRefs.length).toBeGreaterThan(0);

      // Verify persistence in db.chatMessage
      const savedUserMsg = await db.chatMessage.findFirst({
        where: { userId: 'demo-user-1', role: 'user', content: query },
      });
      expect(savedUserMsg).toBeDefined();

      const savedAssistantMsg = await db.chatMessage.findUnique({
        where: { id: json.id },
      });
      expect(savedAssistantMsg).toBeDefined();
      expect(savedAssistantMsg?.role).toBe('assistant');
    }, 15000);

    it('retrieves chat history via GET /api/copilot', async () => {
      const req = new Request('http://localhost:3000/api/copilot?userId=demo-user-1');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty('messages');
      expect(Array.isArray(json.messages)).toBe(true);
      expect(json.messages.length).toBeGreaterThan(0);
      expect(json.messages[0]).toHaveProperty('role');
      expect(json.messages[0]).toHaveProperty('content');
    });
  });
});
