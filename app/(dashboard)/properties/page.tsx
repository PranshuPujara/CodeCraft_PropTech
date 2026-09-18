"use client"
import { useEffect, useState } from "react"
import { mockApi } from "@/lib/mock-api"
import { Property } from "@/lib/api-types"
import { PropertyCard } from "@/components/features/discovery/PropertyCard"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Search, SlidersHorizontal } from "lucide-react"

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    mockApi.getProperties().then(data => {
      setProperties(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Discover Properties</h2>
          <p className="text-muted-foreground">Find homes that match your budget and lifestyle.</p>
        </div>
        <div className="flex w-full md:w-auto gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9 bg-card/50" placeholder="Search by location..." />
          </div>
          <Button variant="outline" className="shrink-0 bg-card/50">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 bg-card/30 rounded-xl animate-pulse border border-border" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  )
}
