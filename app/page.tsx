"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-hook"
import { Button } from "@/components/ui/button"
import { RiGithubFill } from "@remixicon/react"
import { LayoutDashboard, Lock, Zap } from "lucide-react"
import { NavBar } from "@/components/ui/tubelight-navbar"
import { Footer } from "@/components/ui/footer"
import { Badge } from "@/components/ui/badge-2"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LandingPage() {
  const { login, isLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  const handleLogin = async () => {
    try {
      await login()
    } catch (error) {
      console.error("Login error:", error)
    }
  }

  const navItems = [
    { name: 'Home', url: '/', icon: LayoutDashboard },
    { name: 'About', url: '#about', icon: Zap },
    { name: 'Security', url: '#security', icon: Lock },
  ]

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <NavBar items={navItems} activeTab="Home" />

      <main className="flex-1 flex flex-col items-center justify-center p-4 pt-24 sm:pt-32 relative z-0">
        <div className="max-w-md w-full space-y-8 relative z-10">
          <div className="text-center space-y-4">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <RiGithubFill className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              GitHub Kanban Board
            </h1>
            <p className="text-muted-foreground text-lg">
              Transform your GitHub Issues into a powerful Kanban workflow.
              No backend required.
            </p>
          </div>

          <div className="bg-card border rounded-xl p-6 shadow-lg space-y-6 relative z-20">
            <div className="space-y-2 text-center font-sans">
              <h2 className="text-xl font-semibold">Connect your Account</h2>
              <p className="text-sm text-muted-foreground">
                Sign in with GitHub to access your repositories and manage issues.
                We require <code>repo</code> scope permission.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full"
              >
                <RiGithubFill
                  className="me-3 text-[#333333] dark:text-white/60"
                  size={16}
                  aria-hidden="true"
                />
                {isLoading ? "Connecting..." : "Login with GitHub"}
              </Button>
            </div>

            <div className="pt-4 border-t text-center text-xs text-muted-foreground">
              <p className="mt-2 text-[10px] opacity-70">
                By connecting, you allow this application to read and write to your repositories.
              </p>
            </div>
          </div>
          
           <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-muted/30 border border-transparent hover:border-border transition-colors">
              <div className="mx-auto w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                 <Zap className="h-4 w-4 text-blue-500"/>
              </div>
              <h3 className="text-sm font-medium">Real-time</h3>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-transparent hover:border-border transition-colors">
               <div className="mx-auto w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center mb-2">
                 <LayoutDashboard className="h-4 w-4 text-purple-500"/>
              </div>
              <h3 className="text-sm font-medium">Kanban View</h3>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-transparent hover:border-border transition-colors">
                <div className="mx-auto w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                 <Lock className="h-4 w-4 text-green-500"/>
              </div>
              <h3 className="text-sm font-medium">Secure</h3>
            </div>
          </div>
        </div>
      </main>

      <Footer
        logo={<Badge variant="outline" className="h-8 w-8 flex items-center justify-center rounded-lg border-2">KB</Badge>}
        brandName="Kanban Board"
        socialLinks={[
          { icon: <RiGithubFill className="h-5 w-5" />, href: "https://github.com", label: "GitHub" },
        ]}
        mainLinks={[]}
        legalLinks={[]}
        copyright={{
          text: "© 2024 GitHub Kanban Board",
        }}
      />
    </div>
  )
}
