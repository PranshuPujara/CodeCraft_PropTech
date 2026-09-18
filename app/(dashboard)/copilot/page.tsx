'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Disclaimer } from '@/components/ui/disclaimer';
import { SendIcon, SparklesIcon } from '@/components/icons';
import { demoProperties } from '@/lib/demo-data';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  groundingSources?: string[];
  hasLegalDisclaimer?: boolean;
}

const suggestedPrompts = [
  'Can I afford the Indiranagar 2BHK?',
  'What is my actual monthly cost for Koramangala?',
  'Explain the lock-in clause in my agreement',
  'Compare Indiranagar vs Koramangala on trade-offs',
  'What should I pay attention to before signing?',
  'Why was Jayanagar 2BHK recommended?',
];

const initialMessages: Message[] = [
  {
    id: 'msg-1',
    role: 'assistant',
    content: `Hello! I'm your Rental Intelligence Copilot. I analyze your rental options using your actual budget (₹35,000/mo), commute targets, property cost breakdowns, and uploaded agreements.

Ask me anything about affordability, hidden costs, agreement terms, or trade-offs.`,
    timestamp: 'Just now',
    groundingSources: ['User Profile (₹35k/mo)', '4 Properties', '1 Rental Agreement'],
  },
];

function generateAssistantResponse(userPrompt: string): { content: string; groundingSources: string[]; hasLegalDisclaimer: boolean } {
  const query = userPrompt.toLowerCase();

  if (query.includes('afford') || query.includes('indiranagar')) {
    return {
      content: `**Affordability Analysis for Modern 2BHK in Indiranagar:**

- **Base Rent:** ₹32,000/mo
- **Estimated True Monthly Cost:** ≈ ₹40,500/mo *(includes maintenance ₹3,000, electricity ₹1,500, water ₹500, internet ₹1,000, transport ₹2,000, other recurring ₹500)*
- **Stated Budget:** ₹35,000/mo
- **Assessment:** This property is **₹5,500 (15.7%) over** your monthly budget target when accounting for true recurring expenses.
- **Move-in Cash Required:** ₹1,98,000 *(Deposit: ₹1,50,000 + Brokerage: ₹16,000 + First month rent: ₹32,000)*.

**Recommendation with explanation:** It is feasible if you can trim personal discretionary spend or split recurring utility bills with a co-tenant.`,
      groundingSources: ['Indiranagar 2BHK Cost Model', 'User Budget: ₹35,000'],
      hasLegalDisclaimer: false,
    };
  }

  if (query.includes('monthly cost') || query.includes('koramangala')) {
    return {
      content: `**Actual Monthly Cost Breakdown for Koramangala Loft:**

- **Listed Rent:** ₹38,000/mo
- **Estimated Total Monthly Cost:** ≈ ₹47,200/mo *(134.9% of your ₹35,000 budget)*
- **Itemized Breakdown:**
  - Maintenance: ₹3,200 (society dues)
  - Utilities: Electricity ≈ ₹2,200, Water ₹600, Fibre Internet ₹1,500
  - Commute: ₹1,200 (only 9 min travel distance to Koramangala Tech Park)
  - Other recurring: ₹500
- **Total Initial Move-in:** ₹2,47,000 *(Security deposit: ₹1,90,000 + Brokerage: ₹19,000 + 1st month rent: ₹38,000)*.

*Note: All utility amounts marked with ≈ are estimates based on local Bangalore average tenant consumption.*`,
      groundingSources: ['Koramangala Loft Itemized Model', 'Bangalore BESCOM Utility Estimates'],
      hasLegalDisclaimer: false,
    };
  }

  if (query.includes('lock-in') || query.includes('agreement') || query.includes('clause') || query.includes('attention') || query.includes('signing')) {
    return {
      content: `**Agreement Clause Intelligence (Indiranagar Agreement):**

1. **Six-Month Lock-In Period (High Attention):**
   - *Clause:* Tenant cannot terminate the tenancy within the first 6 months.
   - *Explanation:* Vacating before month 6 typically forfeits the deposit or requires paying rent for the remaining lock-in period. Clarify exit terms before executing.

2. **5% Rent Escalation at Renewal (Medium Attention):**
   - *Clause:* Rent increases by 5% upon 11-month renewal.
   - *Explanation:* Year 2 rent would rise from ₹32,000 to ₹33,600/month (annual rent increase of ₹19,200).

3. **Society Maintenance & Utilities:**
   - *Clause:* Tenant bears monthly society maintenance (₹3,000) and metered utilities.

*Check for missing terms: No explicit clause on early termination penalty outside the lock-in period.*`,
      groundingSources: ['Indiranagar-rental-agreement.pdf', 'Clauses 4, 8, and 12'],
      hasLegalDisclaimer: true,
    };
  }

  if (query.includes('compare') || query.includes('trade-off')) {
    return {
      content: `**Trade-off Comparison: Indiranagar vs Koramangala:**

- **Monthly Cost:** Indiranagar is **₹6,700/mo cheaper** (≈ ₹40,500/mo vs ≈ ₹47,200/mo). That saves ₹80,400 per year.
- **Commute:** Koramangala is **13 minutes faster each way** (9 min vs 22 min to Koramangala Tech Park).
- **Move-in Cash:** Indiranagar requires ₹1,98,000 upfront vs ₹2,47,000 for Koramangala (saves ₹49,000 day one).
- **Furnishing:** Koramangala is fully furnished with ready dual workstations; Indiranagar is semi-furnished.

**Synthesis:** Choose Indiranagar if staying closer to your ₹35,000 budget is your top priority. Choose Koramangala only if daily commute time and a turn-key remote workspace justify a 35% budget overshoot.`,
      groundingSources: ['demoProperties[0]', 'demoProperties[1]', 'Calculated Cost Delta'],
      hasLegalDisclaimer: false,
    };
  }

  if (query.includes('jayanagar') || query.includes('recommend')) {
    return {
      content: `**Why Jayanagar 2BHK is Recommended:**

- **Budget Match:** Base rent is ₹30,000/mo and estimated true monthly cost is ≈ ₹36,400/mo — the closest 2BHK to your ₹35,000 target.
- **Transit Access:** 5-minute walk to Jayanagar Green Line Metro station, providing reliable non-traffic commute.
- **Upfront Savings:** Lower deposit requirement (₹1,50,000) compared to Koramangala (₹1,90,000).
- **Key Trade-off:** Commute to Koramangala Tech Park is 31 min (longer by road than Indiranagar's 22 min).`,
      groundingSources: ['demoProperties[2]', 'Bangalore Metro Proximity Map'],
      hasLegalDisclaimer: false,
    };
  }

  return {
    content: `I analyzed your question against your 4 tracked properties and agreement record:

- **Monthly Budget Context:** ₹35,000/month.
- **Current Shortlist:** Indiranagar 2BHK (₹40,500/mo true cost) and Koramangala Loft (₹47,200/mo true cost).
- **Lowest Cost Option:** HSR Studio at ≈ ₹27,200/mo true cost.
- **Agreement Status:** 1 agreement uploaded with 2 flagged clauses requiring attention.

Would you like me to run a detailed affordability test, calculate move-in cash requirements, or review specific agreement clauses?`,
    groundingSources: ['Rental Intelligence Knowledge Base', '4 Properties Data'],
    hasLegalDisclaimer: false,
  };
}

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isTyping) return;

    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI grounded response (or can integrate with /api/copilot when online)
    setTimeout(() => {
      const resp = generateAssistantResponse(query);
      const assistantMessage: Message = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: resp.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundingSources: resp.groundingSources,
        hasLegalDisclaimer: resp.hasLegalDisclaimer,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <SparklesIcon className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              AI Rental Copilot
            </h1>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Grounded in your financial profile, verified listings, and uploaded lease agreements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone="green">Budget: ₹35,000/mo</Badge>
          <Badge tone="blue">{demoProperties.length} Properties in Scope</Badge>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Suggested:
        </span>
        {suggestedPrompts.slice(0, 4).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => handleSend(p)}
            className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-emerald-500 dark:hover:bg-gray-700"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <Card className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="space-y-6">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {m.role === 'user' ? 'You' : 'Rentwise Intelligence'}
                </span>
                <span>•</span>
                <span>{m.timestamp}</span>
              </div>

              <div
                className={`mt-1.5 max-w-3xl rounded-2xl p-4 text-sm leading-6 ${
                  m.role === 'user'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-50 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="whitespace-pre-line">{m.content}</div>

                {m.groundingSources && m.groundingSources.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-gray-200/60 pt-2 text-[11px] text-gray-500 dark:border-gray-700/60 dark:text-gray-400">
                    <span className="font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Grounded in:
                    </span>
                    {m.groundingSources.map((source, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-gray-200/70 px-1.5 py-0.5 font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                )}

                {m.hasLegalDisclaimer && (
                  <div className="mt-3">
                    <Disclaimer text="Informational analysis only. Not legal advice. Consult an advocate for legal representation." />
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex h-2 w-2 animate-ping rounded-full bg-emerald-500" />
              <span>Analyzing property models & agreement clauses...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </Card>

      {/* Message Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything (e.g. 'Can I afford Indiranagar with a ₹35k budget?')..."
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
        >
          <SendIcon className="h-4 w-4" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
