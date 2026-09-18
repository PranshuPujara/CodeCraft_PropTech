"use client"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { MessageSquare, Send, Sparkles, User } from "lucide-react"

export default function CopilotPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your Rental Copilot. I can analyze your saved properties, check affordability, or explain lease clauses. How can I help you today?" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMsg = input
    setMessages(prev => [...prev, { role: "user", content: userMsg }])
    setInput("")
    setLoading(true)

    // Simulate AI response grounded in data
    setTimeout(() => {
      let aiMsg = "I can help with that! However, this is a demo environment, so my responses are limited. Try asking 'Can I afford the Koramangala property?' or 'Compare my saved properties'."
      
      const lower = userMsg.toLowerCase()
      if (lower.includes("afford") || lower.includes("koramangala")) {
        aiMsg = "The Modern 2BHK in Koramangala has an estimated monthly cost of ₹44,500. This represents roughly 127% of your stated budget of ₹35,000, which means it is out of your target affordability range. The high maintenance (₹3,500) and upfront move-in cost (₹2,20,000) also make it expensive. I'd recommend looking at your saved 1BHK in Indiranagar instead."
      } else if (lower.includes("compare") || lower.includes("saved")) {
        aiMsg = "You have 2 saved properties. The Koramangala 2BHK is ₹44,500/mo (estimated) but fully furnished with 2 bedrooms. The Indiranagar 1BHK is much more affordable at ₹32,300/mo (estimated) but only semi-furnished. If budget is your priority, the Indiranagar option is a better fit."
      } else if (lower.includes("clause") || lower.includes("agreement")) {
        aiMsg = "Looking at your recently uploaded agreement, there is a late penalty clause of ₹1000 per day. This is unusually high and not capped. I recommend negotiating a reasonable cap (e.g., maximum 5% of rent) before signing."
      }

      setMessages(prev => [...prev, { role: "assistant", content: aiMsg }])
      setLoading(false)
    }, 1200)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in h-[calc(100vh-2rem)] flex flex-col">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight mb-2">AI Rental Copilot</h2>
        <p className="text-muted-foreground">Context-aware assistant grounded in your property data.</p>
      </div>

      <Card className="flex-1 flex flex-col glass-card border-primary/20 overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-4 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
              )}
              
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                m.role === "user" 
                  ? "bg-primary text-primary-foreground rounded-tr-sm" 
                  : "bg-muted/50 border border-border text-foreground rounded-tl-sm"
              }`}>
                <p className="leading-relaxed text-sm">{m.content}</p>
              </div>

              {m.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-4 justify-start animate-pulse">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted/50 border border-border rounded-2xl rounded-tl-sm px-5 py-4">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce delay-75" />
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce delay-150" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-card border-t border-border">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder="Ask about affordability, comparisons, or clauses..." 
              className="flex-1 bg-background"
              disabled={loading}
            />
            <Button type="submit" disabled={!input.trim() || loading} className="shrink-0 bg-primary hover:bg-primary/90 text-white">
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-xs text-center text-muted-foreground mt-3 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" /> Copilot uses your saved properties and preferences to provide personalized answers.
          </p>
        </div>
      </Card>
    </div>
  )
}
