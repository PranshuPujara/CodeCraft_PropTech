"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Disclaimer } from "@/components/ui/Disclaimer"
import { UploadCloud, FileText, AlertTriangle, Info } from "lucide-react"

export default function AgreementsPage() {
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleUpload = () => {
    setAnalyzing(true)
    setTimeout(() => {
      setResult({
        summary: "Standard 11-month lease agreement. Rent is ₹25,000/mo with a ₹1,00,000 security deposit. Notice period is 1 month.",
        extracted: {
          rent: 25000,
          deposit: 100000,
          leaseDuration: "11 Months",
          lockInPeriod: "6 Months",
          noticePeriod: "1 Month",
          rentEscalation: "Not found",
          maintenanceResponsibility: "Tenant",
        },
        flags: [
          { clause: "Late penalty of ₹1000 per day", reason: "This is unusually high and not capped." },
          { clause: "Tenant responsible for major repairs", reason: "Standard practice is for the landlord to handle structural or major repairs." }
        ]
      })
      setAnalyzing(false)
    }, 2000)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Agreement Analysis</h2>
        <p className="text-muted-foreground">Upload your draft rental agreement for an AI breakdown.</p>
      </div>

      <Disclaimer className="mb-6" />

      {!result && (
        <Card className="glass-card border-dashed">
          <CardContent className="pt-6 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <UploadCloud className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Upload Agreement PDF</h3>
            <p className="text-sm text-muted-foreground mb-6">Drag and drop or click to browse</p>
            <Button onClick={handleUpload} disabled={analyzing} className="bg-primary hover:bg-primary/90 text-white">
              {analyzing ? "Analyzing Document..." : "Select File"}
            </Button>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-6 animate-slide-up">
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <FileText className="w-5 h-5" /> Plain-language Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed">{result.summary}</p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">Extracted Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(result.extracted).map(([key, val]) => (
                  <div key={key} className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className={`font-medium ${val === "Not found" ? "text-yellow-500/80" : ""}`}>{val}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass border-rose-500/30">
              <CardHeader className="bg-rose-500/5 rounded-t-xl">
                <CardTitle className="text-lg text-rose-500 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Worth your attention
                </CardTitle>
                <CardDescription>We flagged these clauses for review.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {result.flags.map((flag: any, i: number) => (
                  <div key={i} className="bg-background/50 p-4 rounded-lg border border-rose-500/20">
                    <p className="font-medium text-foreground mb-1">"{flag.clause}"</p>
                    <p className="text-sm text-rose-400 flex items-start gap-2">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" /> {flag.reason}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center">
            <Button variant="outline" onClick={() => setResult(null)}>Upload Another Document</Button>
          </div>
        </div>
      )}
    </div>
  )
}
