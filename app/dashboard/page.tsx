"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-hook"
import { getOctokit } from "@/lib/github"
import { NavBar } from "@/components/ui/tubelight-navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LayoutDashboard, Lock, Zap, Search, Star, GitFork, ExternalLink, LogOut, Loader2 } from "lucide-react"

interface Repository {
  id: number
  name: string
  full_name: string
  description: string | null
  stargazers_count: number
  forks_count: number
  html_url: string
  owner: {
    login: string
    avatar_url: string
  }
  updated_at: string
}

export default function Dashboard() {
  const { token, user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [repos, setRepos] = useState<Repository[]>([])
  const [filteredRepos, setFilteredRepos] = useState<Repository[]>([])
  const [search, setSearch] = useState("")
  const [loadingRepos, setLoadingRepos] = useState(true)

  useEffect(() => {
    if (!isLoading && !token) {
      router.push("/")
    }
  }, [isLoading, token, router])

  useEffect(() => {
    async function fetchRepos() {
      if (!token) return
      try {
        const octokit = getOctokit(token)
        // Fetch repositories sorted by update time
        const response = await octokit.rest.repos.listForAuthenticatedUser({
          sort: "updated",
          direction: "desc",
          per_page: 100,
          type: "all"
        })
        setRepos(response.data as Repository[])
        setFilteredRepos(response.data as Repository[])
      } catch (error) {
        console.error("Failed to fetch repos", error)
      } finally {
        setLoadingRepos(false)
      }
    }

    if (token) {
      fetchRepos()
    }
  }, [token])

  useEffect(() => {
    const lower = search.toLowerCase()
    const filtered = repos.filter(repo => 
      repo.name.toLowerCase().includes(lower) || 
      (repo.description && repo.description.toLowerCase().includes(lower))
    )
    setFilteredRepos(filtered)
  }, [search, repos])

  if (isLoading || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const navItems = [
    { name: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { name: 'Profile', url: (user as any)?.html_url || '#', icon: Zap },
  ]

  return (
    <div className="min-h-screen bg-background font-sans">
      <NavBar items={navItems} activeTab="Dashboard" />

      <div className="container mx-auto pt-24 pb-12 px-4 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Repositories</h1>
            <p className="text-muted-foreground">
              Select a repository to view its Kanban board.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              Logged in as <span className="text-primary">{(user as any)?.login || user?.name}</span>
            </span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Filter repositories..." 
            className="pl-9 max-w-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loadingRepos ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 rounded-xl border bg-card animate-pulse" />
            ))}
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No repositories found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRepos.map((repo) => (
              <div 
                key={repo.id} 
                className="group relative flex flex-col justify-between rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50 cursor-pointer"
                onClick={() => router.push(`/board/${repo.owner.login}/${repo.name}`)}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold leading-none tracking-tight group-hover:text-primary transition-colors">
                      {repo.name}
                    </h3>
                    {repo.stargazers_count > 0 && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Star className="mr-1 h-3 w-3 fill-current text-yellow-500" />
                        {repo.stargazers_count}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {repo.description || "No description provided."}
                  </p>
                </div>
                
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                     <span className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5" />
                        Updated {new Date(repo.updated_at).toLocaleDateString()}
                     </span>
                  </div>
                   <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
