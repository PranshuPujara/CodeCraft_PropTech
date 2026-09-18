"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Users, CheckCircle2, AlertOctagon } from "lucide-react"

export default function RoommatesPage() {
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleAnalyze = () => {
    setAnalyzing(true)
    setTimeout(() => {
      setResult({
        score: 82,
        explanation: "You both have similar budgets and cleanliness habits, making co-living generally smooth.",
        common: ["Similar budget (~₹15k/head)", "Both prefer quiet after 11 PM", "Both keep common areas clean"],
        conflicts: ["You prefer cooking at home, they prefer eating out", "They have a pet, you indicated no pets preferred"]
      })
      setAnalyzing(false)
    }, 1500)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Roommate Compatibility</h2>
        <p className="text-muted-foreground">Compare lifestyle preferences to predict co-living friction.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Your preferences are saved in settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Sleep Schedule</span>
              <span>Night Owl (1AM - 9AM)</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Cleanliness</span>
              <span>Very Clean</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Pets</span>
              <span>No Pets</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Invite a Roommate</CardTitle>
            <CardDescription>Enter their email or share a link to their profile.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="roommate@example.com" defaultValue="alex@example.com" />
            </div>
            <div className="pt-4 border-t border-border mt-4">
              <p className="text-sm text-muted-foreground mb-4">Or run a quick mock analysis for demonstration:</p>
              <Button className="w-full" onClick={handleAnalyze} disabled={analyzing}>
                <Users className="w-4 h-4 mr-2" />
                {analyzing ? "Analyzing Profiles..." : "Run Compatibility Check"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {result && (
        <div className="animate-slide-up space-y-6">
          <Card className="glass border-primary/20 bg-primary/5">
            <CardContent className="pt-6 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0 relative w-32 h-32 rounded-full border-4 border-primary flex items-center justify-center bg-background shadow-lg shadow-primary/20">
                <div className="text-4xl font-bold text-primary">{result.score}<span className="text-xl">%</span></div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Good Match!</h3>
                <p className="text-foreground/80 leading-relaxed">{result.explanation}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="glass border-emerald-500/20">
              <CardHeader>
                <CardTitle className="text-emerald-500 flex items-center gap-2 text-lg">
                  <CheckCircle2 className="w-5 h-5" /> Areas of Alignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.common.map((c: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="glass border-rose-500/20">
              <CardHeader>
                <CardTitle className="text-rose-500 flex items-center gap-2 text-lg">
                  <AlertOctagon className="w-5 h-5" /> Potential Friction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.conflicts.map((c: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
