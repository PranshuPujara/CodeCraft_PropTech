import Link from "next/link"
import { Home, Search, Heart, GitCompare, FileText, Users, MessageSquare } from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/30 backdrop-blur-xl flex flex-col hidden md:flex">
        <div className="p-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
            RentalIntel
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem href="/" icon={<Home className="w-5 h-5" />} label="Dashboard" />
          <NavItem href="/properties" icon={<Search className="w-5 h-5" />} label="Discover" />
          <NavItem href="/saved" icon={<Heart className="w-5 h-5" />} label="Saved & Shortlist" />
          <NavItem href="/compare" icon={<GitCompare className="w-5 h-5" />} label="Compare" />
          <NavItem href="/agreements" icon={<FileText className="w-5 h-5" />} label="Agreements" />
          <NavItem href="/roommates" icon={<Users className="w-5 h-5" />} label="Roommates" />
          <div className="pt-8 pb-2">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Support</p>
          </div>
          <NavItem href="/copilot" icon={<MessageSquare className="w-5 h-5" />} label="Copilot" />
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              D
            </div>
            <div className="text-sm">
              <p className="font-medium">Demo User</p>
              <p className="text-muted-foreground text-xs">Budget: ₹35k/mo</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link 
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all hover:bg-secondary hover:text-foreground text-muted-foreground"
    >
      {icon}
      {label}
    </Link>
  )
}
