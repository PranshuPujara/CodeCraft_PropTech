'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Disclaimer } from '@/components/ui/disclaimer';
import { SendIcon, SparklesIcon } from '@/components/icons';
import { ContextRef } from '@/lib/ai/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  contextRefs?: ContextRef[];
  missingDataNotice?: string | null;
  hasLegalDisclaimer?: boolean;
}

const suggestedPrompts = [
  'Can I afford this apartment?',
  'Explain this agreement clause.',
  'Compare these properties.',
  'What is my actual monthly cost?',
  'Why was this property recommended?',
  'What should I pay attention to?',
];

const welcomeMessage: Message = {
  id: 'msg-welcome',
  role: 'assistant',
  content: `Hello! I'm your AI Rental Copilot, strictly grounded in your actual rental records.

I have access to your stated monthly budget (₹35,000/mo), saved properties with itemized cost models, and uploaded lease agreements.

Feel free to ask me any of the core decision questions below:`,
  timestamp: 'Just now',
  contextRefs: [
    { type: 'cost', id: 'budget', name: 'Budget: ₹35,000/mo' },
    { type: 'property', id: 'saved-all', name: 'Saved Properties' },
    { type: 'agreement', id: 'agreement-latest', name: 'Lease Agreement' },
  ],
};

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Load historical messages from DB if available
    async function loadHistory() {
      try {
        const res = await fetch('/api/copilot');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.messages) && data.messages.length > 0) {
            const mapped: Message[] = data.messages.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              contextRefs: m.contextRefs || [],
              hasLegalDisclaimer: m.content.toLowerCase().includes('not legal advice') || m.content.toLowerCase().includes('agreement'),
            }));
            setMessages(mapped);
          }
        }
      } catch {
        // Fall back to default welcome
      }
    }
    loadHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isTyping || query.length > 1000) return;

    setErrorMsg(null);
    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || 'Failed to get Copilot response');
      }

      const data = await res.json();
      const assistantMessage: Message = {
        id: data.id || `ast-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(data.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        contextRefs: data.contextRefs || [],
        missingDataNotice: data.missingDataNotice,
        hasLegalDisclaimer:
          data.answer.toLowerCase().includes('not legal advice') ||
          (data.contextRefs && data.contextRefs.some((r: ContextRef) => r.type === 'agreement')),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with AI Copilot');
    } finally {
      setIsTyping(false);
    }
  };

  const getContextRefLink = (ref: ContextRef) => {
    if (ref.type === 'property' && ref.id && ref.id !== 'saved-all') {
      return `/properties/${ref.id}`;
    }
    if (ref.type === 'agreement') {
      return `/agreements`;
    }
    if (ref.type === 'cost' || ref.id === 'saved-all') {
      return `/saved`;
    }
    if (ref.type === 'roommate') {
      return `/roommates`;
    }
    return null;
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
            Grounded strictly in your financial profile, verified properties, itemized costs, and lease agreements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone="green">Budget: ₹35,000/mo</Badge>
          <Badge tone="blue">Context Grounded</Badge>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Core Questions:
        </span>
        {suggestedPrompts.map((p) => (
          <button
            key={p}
            type="button"
            disabled={isTyping}
            onClick={() => handleSend(p)}
            className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-emerald-500 dark:hover:bg-gray-700"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Error alert banner if any */}
      {errorMsg && (
        <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900">
          {errorMsg}
        </div>
      )}

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

                {/* Missing data warning callout */}
                {m.missingDataNotice && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                    <span className="font-semibold">Notice:</span> {m.missingDataNotice}
                  </div>
                )}

                {/* ContextRefs Pills */}
                {m.contextRefs && m.contextRefs.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-gray-200/60 pt-2 text-[11px] text-gray-500 dark:border-gray-700/60 dark:text-gray-400">
                    <span className="font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      ContextRefs:
                    </span>
                    {m.contextRefs.map((ref, idx) => {
                      const link = getContextRefLink(ref);
                      const badgeContent = (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded bg-gray-200/80 px-2 py-0.5 font-medium text-gray-700 transition hover:bg-emerald-100 hover:text-emerald-800 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-300"
                        >
                          <span className="text-[9px] uppercase font-bold text-gray-500 dark:text-gray-400">
                            [{ref.type}]
                          </span>
                          {ref.name}
                        </span>
                      );

                      return link ? (
                        <Link key={idx} href={link} className="inline-block">
                          {badgeContent}
                        </Link>
                      ) : (
                        <span key={idx}>{badgeContent}</span>
                      );
                    })}
                  </div>
                )}

                {/* Mandatory legal advice guardrail disclaimer */}
                {m.hasLegalDisclaimer && (
                  <div className="mt-3">
                    <Disclaimer text="Informational clause analysis only. Not legal advice. Consult an advocate for legal determinations." />
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex h-2 w-2 animate-ping rounded-full bg-emerald-500" />
              <span>Querying saved properties, itemized costs & agreement terms...</span>
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
          maxLength={1000}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything (e.g. 'Can I afford this apartment?')..."
          disabled={isTyping}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
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
