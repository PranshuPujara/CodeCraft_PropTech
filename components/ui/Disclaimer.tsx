import * as React from "react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function Disclaimer({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-200/80", className)}>
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500/80" />
      <div className="flex-1 leading-relaxed">
        <strong>Informational Only.</strong> {children || "This analysis is not legal advice. Do not rely on it as a substitute for professional legal review."}
      </div>
    </div>
  )
}
