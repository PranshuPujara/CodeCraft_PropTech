import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Search, Heart, FileText, Users, ArrowRight } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-10">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome back.</h2>
        <p className="text-muted-foreground">Pick up where you left off with your rental search.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
        <QuickActionCard 
          href="/properties" 
          icon={<Search className="w-6 h-6 text-primary" />}
          title="Discover" 
          description="Find new properties matching your budget."
        />
        <QuickActionCard 
          href="/saved" 
          icon={<Heart className="w-6 h-6 text-rose-500" />}
          title="Saved" 
          description="You have 2 saved properties to review."
        />
        <QuickActionCard 
          href="/agreements" 
          icon={<FileText className="w-6 h-6 text-indigo-500" />}
          title="Agreements" 
          description="Analyze rental clauses before you sign."
        />
        <QuickActionCard 
          href="/roommates" 
          icon={<Users className="w-6 h-6 text-emerald-500" />}
          title="Roommates" 
          description="Check compatibility with your co-living partners."
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest property views and saves.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">No recent activity. Start searching!</p>
            <Link href="/properties">
              <Button variant="outline" className="w-full mt-2">Browse Properties</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="glass relative overflow-hidden border-primary/20">
          <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -z-10" />
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <span className="text-primary font-bold">AI Copilot</span>
            </CardTitle>
            <CardDescription>Get personalized decision support based on your shortlist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/copilot">
              <Button className="w-full justify-between mt-2">
                Ask about my affordabilty
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function QuickActionCard({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <Link href={href} className="block group">
      <Card className="h-full glass-card transition-all duration-300 hover:border-primary/50 hover:shadow-primary/10 hover:-translate-y-1">
        <CardHeader>
          <div className="mb-2 p-2 bg-secondary rounded-lg w-fit group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
