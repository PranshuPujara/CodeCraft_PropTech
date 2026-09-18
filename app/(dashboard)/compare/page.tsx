"use client"
import { useEffect, useState } from "react"
import { mockApi } from "@/lib/mock-api"
import { Property, CostBreakdown } from "@/lib/api-types"
import { Card, CardContent } from "@/components/ui/Card"
import { Check, Minus, IndianRupee } from "lucide-react"

export default function ComparePage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [costs, setCosts] = useState<Record<string, CostBreakdown>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // For demo purposes, we automatically compare the first two properties
    Promise.all([
      mockApi.getProperties(),
      mockApi.getPropertyCost("prop-1"),
      mockApi.getPropertyCost("prop-2")
    ]).then(([props, cost1, cost2]) => {
      setProperties([props[0], props[1]])
      if (cost1 && cost2) {
        setCosts({ "prop-1": cost1, "prop-2": cost2 })
      }
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="p-8 text-center animate-pulse">Loading comparison data...</div>

  const p1 = properties[0]
  const p2 = properties[1]
  const c1 = costs[p1.id]
  const c2 = costs[p2.id]

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Property Comparison</h2>
        <p className="text-muted-foreground">Evaluating your shortlisted properties side-by-side.</p>
      </div>

      {/* Trade-offs summary */}
      <Card className="mb-8 border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-lg mb-4 text-primary">Key Trade-offs (AI Synthesis)</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <p><strong>{p2.title}</strong> is ₹{Math.abs((c2?.estimatedMonthlyCost||0) - (c1?.estimatedMonthlyCost||0)).toLocaleString()} cheaper per month than <strong>{p1.title}</strong>.</p>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <p><strong>{p1.title}</strong> offers {p1.bedrooms} bedrooms and is Fully Furnished, whereas <strong>{p2.title}</strong> is only Semi Furnished with {p2.bedrooms} bedroom.</p>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <p>Initial move-in cost for <strong>{p1.title}</strong> is significantly higher (₹{c1?.initialMoveInCost.toLocaleString()}) compared to <strong>{p2.title}</strong> (₹{c2?.initialMoveInCost.toLocaleString()}).</p>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card/40 backdrop-blur-xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase">
            <tr>
              <th className="px-6 py-4 rounded-tl-xl w-1/3">Feature</th>
              <th className="px-6 py-4 w-1/3 text-foreground font-semibold">{p1.title}</th>
              <th className="px-6 py-4 rounded-tr-xl w-1/3 text-foreground font-semibold">{p2.title}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            <tr className="hover:bg-muted/20">
              <td className="px-6 py-4 font-medium">Location</td>
              <td className="px-6 py-4">{p1.location}</td>
              <td className="px-6 py-4">{p2.location}</td>
            </tr>
            <tr className="hover:bg-muted/20">
              <td className="px-6 py-4 font-medium">Base Rent</td>
              <td className="px-6 py-4">₹{p1.rent.toLocaleString()}</td>
              <td className="px-6 py-4 text-emerald-400">₹{p2.rent.toLocaleString()}</td>
            </tr>
            <tr className="hover:bg-muted/20">
              <td className="px-6 py-4 font-medium">True Monthly Cost</td>
              <td className="px-6 py-4 font-bold">₹{c1?.estimatedMonthlyCost.toLocaleString()}</td>
              <td className="px-6 py-4 font-bold text-emerald-400">₹{c2?.estimatedMonthlyCost.toLocaleString()}</td>
            </tr>
            <tr className="hover:bg-muted/20">
              <td className="px-6 py-4 font-medium">Initial Move-in Cost</td>
              <td className="px-6 py-4">₹{c1?.initialMoveInCost.toLocaleString()}</td>
              <td className="px-6 py-4 text-emerald-400">₹{c2?.initialMoveInCost.toLocaleString()}</td>
            </tr>
            <tr className="hover:bg-muted/20">
              <td className="px-6 py-4 font-medium">Furnishing</td>
              <td className="px-6 py-4">{p1.furnishing}</td>
              <td className="px-6 py-4 text-muted-foreground">{p2.furnishing}</td>
            </tr>
            <tr className="hover:bg-muted/20">
              <td className="px-6 py-4 font-medium">Bedrooms</td>
              <td className="px-6 py-4 text-emerald-400">{p1.bedrooms}</td>
              <td className="px-6 py-4">{p2.bedrooms}</td>
            </tr>
            <tr className="hover:bg-muted/20">
              <td className="px-6 py-4 font-medium">Gym / Pool</td>
              <td className="px-6 py-4"><Check className="w-5 h-5 text-emerald-500" /></td>
              <td className="px-6 py-4"><Minus className="w-5 h-5 text-muted-foreground" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
