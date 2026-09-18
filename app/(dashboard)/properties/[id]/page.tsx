"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { mockApi } from "@/lib/mock-api"
import { Property, CostBreakdown } from "@/lib/api-types"
import { CostBreakdownView } from "@/components/features/cost/CostBreakdown"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { ArrowLeft, MapPin, Bed, Home, Heart } from "lucide-react"

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.id as string

  const [property, setProperty] = useState<Property | null>(null)
  const [cost, setCost] = useState<CostBreakdown | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      mockApi.getProperty(propertyId),
      mockApi.getPropertyCost(propertyId),
      mockApi.getSavedProperties()
    ]).then(([prop, costData, savedList]) => {
      if (prop) setProperty(prop)
      if (costData) setCost(costData)
      setIsSaved(savedList.some(s => s.propertyId === propertyId))
      setLoading(false)
    })
  }, [propertyId])

  const toggleSave = async () => {
    const newState = !isSaved
    setIsSaved(newState)
    await mockApi.toggleSavedProperty(propertyId, false)
  }

  if (loading) return <div className="p-8 text-center animate-pulse">Loading property details...</div>
  if (!property) return <div className="p-8 text-center text-destructive">Property not found.</div>

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <Button variant="ghost" className="mb-6 -ml-4 text-muted-foreground" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to discovery
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold">{property.title}</h1>
                <p className="flex items-center text-muted-foreground mt-2">
                  <MapPin className="w-4 h-4 mr-1" /> {property.location}
                </p>
              </div>
              <Button variant={isSaved ? "default" : "outline"} className="shrink-0" onClick={toggleSave}>
                <Heart className={`w-4 h-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
                {isSaved ? "Saved" : "Save Property"}
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Badge variant="secondary" className="px-3 py-1 text-sm"><Home className="w-4 h-4 mr-2"/> {property.furnishing}</Badge>
              <Badge variant="secondary" className="px-3 py-1 text-sm"><Bed className="w-4 h-4 mr-2"/> {property.bedrooms} Bedrooms</Badge>
            </div>
          </div>

          <div className="bg-card/30 border border-border rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">About this property</h3>
            <p className="text-muted-foreground leading-relaxed">{property.description}</p>
            
            <h4 className="font-semibold mt-6 mb-3">Amenities</h4>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map(a => (
                <Badge key={a} variant="outline" className="bg-background/50">{a}</Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card/50 border border-border backdrop-blur-xl rounded-xl p-6 shadow-xl sticky top-8">
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-1">Base Rent</p>
              <h2 className="text-3xl font-bold text-primary">₹{property.rent.toLocaleString()} <span className="text-base font-normal text-muted-foreground">/mo</span></h2>
            </div>
            {cost && <CostBreakdownView cost={cost} />}
            
            {cost && (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 p-4 rounded-lg text-sm">
                  <strong>Affordability Check:</strong> This property is ~{(cost.estimatedMonthlyCost / 35000 * 100).toFixed(0)}% of your stated monthly budget (₹35,000).
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
