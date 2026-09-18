import Link from "next/link"
import { Property } from "@/lib/api-types"
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { MapPin, Bed, IndianRupee } from "lucide-react"

export function PropertyCard({ property }: { property: Property }) {
  return (
    <Link href={`/properties/${property.id}`} className="group block">
      <Card className="glass-card overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:-translate-y-1">
        <div className="h-48 bg-muted/30 relative overflow-hidden">
          {/* Mock image placeholder */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 font-bold text-4xl group-hover:scale-105 transition-transform duration-500">
            {property.title.charAt(0)}
          </div>
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur">
              {property.furnishing}
            </Badge>
          </div>
        </div>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="text-xl group-hover:text-primary transition-colors">{property.title}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1.5">
                <MapPin className="w-3 h-3" /> {property.location}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold flex items-center justify-end text-primary">
                <IndianRupee className="w-4 h-4" />
                {property.rent.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">/ month</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Bed className="w-3 h-3" /> {property.bedrooms} BHK
            </Badge>
            {property.amenities.slice(0, 2).map(amenity => (
              <Badge key={amenity} variant="outline" className="text-muted-foreground">
                {amenity}
              </Badge>
            ))}
            {property.amenities.length > 2 && (
              <Badge variant="outline" className="text-muted-foreground border-dashed">
                +{property.amenities.length - 2} more
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
