"use client"
import { useState } from "react"
import { Property } from "@/lib/api-types"
import { mockApi } from "@/lib/mock-api"
import { PropertyCard } from "@/components/features/discovery/PropertyCard"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Card, CardContent } from "@/components/ui/Card"
import { Sparkles, MapPin, IndianRupee } from "lucide-react"

export default function RecommendationsPage() {
  const [loading, setLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<{property: Property, reason: string}[]>([])
  
  const generateRecommendations = async () => {
    setLoading(true)
    // Simulate AI generation time
    const props = await mockApi.getProperties()
    setTimeout(() => {
      setRecommendations([
        { 
          property: props[1], 
          reason: "Matches your budget of ₹30k and requires only 1 bedroom. It is located in Indiranagar which is close to your specified commute point." 
        },
        { 
          property: props[0], 
          reason: "Slightly over your budget but offers 2 bedrooms and full furnishing, which aligns with your preference for 'move-in ready' spaces." 
        }
      ])
      setLoading(false)
    }, 1500)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Personalized Recommendations</h2>
        <p className="text-muted-foreground">Tell us what you're looking for, and we'll rank the best matches.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="glass-card">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Max Monthly Budget</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input type="number" placeholder="30000" className="pl-9" defaultValue="30000" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preferred Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Indiranagar" className="pl-9" defaultValue="Indiranagar" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Bedrooms</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option className="bg-background">1 BHK</option>
                  <option className="bg-background">2 BHK</option>
                  <option className="bg-background">3 BHK</option>
                </select>
              </div>
              <Button onClick={generateRecommendations} disabled={loading} className="w-full mt-4 bg-primary hover:bg-primary/90 text-white">
                <Sparkles className="w-4 h-4 mr-2" />
                {loading ? "Analyzing matches..." : "Get Recommendations"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {recommendations.length > 0 ? (
            <div className="space-y-6">
              {recommendations.map((rec, idx) => (
                <div key={rec.property.id} className="relative animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold z-10 shadow-lg">
                    #{idx + 1}
                  </div>
                  <PropertyCard property={rec.property} />
                  <div className="mt-2 bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <p className="text-sm text-primary-foreground/90"><strong className="text-primary">Why this matches:</strong> {rec.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-card/20 rounded-xl border border-dashed border-border p-8 min-h-[300px]">
              <Sparkles className="w-12 h-12 mb-4 text-muted-foreground/30" />
              <p>Set your preferences and hit generate to see AI-powered matches.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
