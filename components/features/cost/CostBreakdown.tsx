import { CostBreakdown, CostItem } from "@/lib/api-types"
import { Badge } from "@/components/ui/Badge"
import { IndianRupee } from "lucide-react"

export function CostBreakdownView({ cost }: { cost: CostBreakdown }) {
  const formatCurrency = (val: number) => `₹${val.toLocaleString()}`

  const renderRow = (label: string, item: CostItem) => (
    <div className="flex justify-between items-center py-2.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {item.isEstimated && <Badge variant="estimated">Estimated</Badge>}
        <span className={`font-medium ${item.isEstimated ? "text-yellow-500/90" : "text-foreground"}`}>
          {formatCurrency(item.amount)}
        </span>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold mb-3">True Monthly Cost</h4>
        <div className="bg-card/40 rounded-lg border border-border p-4">
          {renderRow("Maintenance", cost.maintenance)}
          {renderRow("Electricity", cost.electricity)}
          {renderRow("Water", cost.water)}
          {renderRow("Internet", cost.internet)}
          {renderRow("Transportation", cost.transport)}
          {renderRow("Other Recurring", cost.otherRecurring)}
          <div className="pt-4 mt-2 border-t border-border flex justify-between items-center">
            <span className="font-semibold">Estimated Monthly Total</span>
            <span className="text-xl font-bold text-primary flex items-center">
              <IndianRupee className="w-5 h-5" /> {cost.estimatedMonthlyCost.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold mb-3">Initial Move-in Cost</h4>
        <div className="bg-card/40 rounded-lg border border-border p-4 flex justify-between items-center">
          <span className="font-semibold">Deposit + First Rent + Brokerage</span>
          <span className="text-xl font-bold text-foreground flex items-center">
            <IndianRupee className="w-5 h-5" /> {cost.initialMoveInCost.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
