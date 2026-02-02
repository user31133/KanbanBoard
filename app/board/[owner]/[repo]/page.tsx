"use client"

import { useEffect, useState, use, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-hook"
import { getOctokit } from "@/lib/github"
import { NavBar } from "@/components/ui/tubelight-navbar"
import { Loader2, ArrowLeft, LayoutDashboard, Plus, Filter, X, Tag, Calendar, Settings, Building2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NewIssueDialog } from "@/components/new-issue-dialog"
import { IssueDetailDialog } from "@/components/issue-detail-dialog"
import { LabelManagementDialog } from "@/components/label-management-dialog"
import { MilestoneManagementDialog } from "@/components/milestone-management-dialog"
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanColumnHandle,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
} from '@/components/ui/kanban'
import { Badge } from '@/components/ui/badge-2'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { GripVertical } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// --- Types ---
interface Issue {
  id: number
  number: number
  title: string
  state: string
  html_url: string
  body: string | null
  user: {
    login: string
    avatar_url: string
  }
  labels: {
    id: number
    name: string
    color: string
  }[]
  assignees: {
    login: string
    avatar_url: string
  }[]
  milestone: {
    title: string
    number: number
    due_on: string | null
  } | null
  created_at: string
  updated_at: string
}

interface Column {
  id: string
  title: string
  issues: Issue[]
}

const COLUMN_IDS = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  DONE: 'done'
}

const COLUMN_TITLES: Record<string, string> = {
  [COLUMN_IDS.TODO]: 'To Do',
  [COLUMN_IDS.IN_PROGRESS]: 'In Progress',
  [COLUMN_IDS.DONE]: 'Done',
}

// --- Helper Components ---

function IssueCard({ issue, asHandle, onClick, onAuthorClick, onAssigneeClick }: {
  issue: Issue;
  asHandle?: boolean;
  onClick?: () => void;
  onAuthorClick?: (author: string) => void;
  onAssigneeClick?: (assignee: string) => void;
}) {
  const priorityLabel = issue.labels.find(l => l.name.toLowerCase().includes('priority'))

  const content = (
    <div
      className="rounded-md border bg-card p-3 shadow-xs hover:border-primary/50 transition-colors group cursor-pointer"
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation()
          onClick()
        }
      }}
    >
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium text-sm leading-tight text-foreground/90 group-hover:text-primary transition-colors">
            {issue.title}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono shrink-0">
            #{issue.number}
          </span>
        </div>

        {/* Labels & Department */}
        <div className="flex flex-col gap-2">
          {/* Department Badge */}
          {issue.labels.find(l => l.name.startsWith('dept:')) && (
            <div className="flex items-center">
              {(() => {
                const dept = issue.labels.find(l => l.name.startsWith('dept:'))!;
                return (
                  <div
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border"
                    style={{
                      backgroundColor: `#${dept.color}15`,
                      color: `#${dept.color}`,
                      borderColor: `#${dept.color}40`
                    }}
                  >
                    <Building2 className="size-3" />
                    <span className="uppercase tracking-wider">
                      {dept.name.replace('dept:', '')}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Other Labels */}
          <div className="flex flex-wrap gap-1">
            {issue.labels
              .filter(l => !l.name.startsWith('status:') && !l.name.startsWith('dept:'))
              .slice(0, 3)
              .map(label => (
                <span
                  key={label.id}
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: `#${label.color}20`,
                    color: `#${label.color}`,
                    border: `1px solid #${label.color}40`
                  }}
                >
                  {label.name}
                </span>
              ))}
            {issue.labels.filter(l => !l.name.startsWith('status:') && !l.name.startsWith('dept:')).length > 3 && (
              <span className="text-[10px] px-1.5 py-0.5 text-muted-foreground">
                +{issue.labels.filter(l => !l.name.startsWith('status:') && !l.name.startsWith('dept:')).length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Milestone */}
        {issue.milestone && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>{issue.milestone.title}</span>
          </div>
        )}

        {/* Assignees */}
        <div className="flex items-center justify-between text-muted-foreground text-xs pt-1">
          {issue.assignees.length === 0 ? (
            <div
              className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                if (onClick) {
                  onClick()
                }
              }}
            >
              <Avatar className="size-4 opacity-50">
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <span className="text-[10px]">Unassigned</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                if (onAssigneeClick) {
                  onAssigneeClick(issue.assignees[0].login)
                }
              }}
            >
              {issue.assignees.length === 1 ? (
                <>
                  <Avatar className="size-4">
                    <AvatarImage src={issue.assignees[0].avatar_url} />
                    <AvatarFallback>{issue.assignees[0].login.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-[10px]">{issue.assignees[0].login}</span>
                </>
              ) : (
                <>
                  <div className="flex -space-x-2">
                    {issue.assignees.slice(0, 3).map((assignee, idx) => (
                      <Avatar key={assignee.login} className="size-4 border-2 border-card">
                        <AvatarImage src={assignee.avatar_url} />
                        <AvatarFallback>{assignee.login.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-[10px]">
                    {issue.assignees.length > 3 ? `${issue.assignees.length} assignees` : issue.assignees.map(a => a.login).join(', ')}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <KanbanItem value={issue.id.toString()}>
       {asHandle ? <KanbanItemHandle>{content}</KanbanItemHandle> : content}
    </KanbanItem>
  )
}

function BoardColumn({ value, issues, isOverlay, onIssueClick, onAuthorClick, onAssigneeClick, onAddItem }: {
  value: string;
  issues: Issue[];
  isOverlay?: boolean;
  onIssueClick?: (issue: Issue) => void;
  onAuthorClick?: (author: string) => void;
  onAssigneeClick?: (assignee: string) => void;
  onAddItem?: () => void;
}) {
  return (
    <KanbanColumn value={value} className="rounded-xl border bg-muted/40 p-3 shadow-sm h-full flex flex-col gap-3 min-w-[300px]">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            value === COLUMN_IDS.DONE ? 'bg-green-500' :
            value === COLUMN_IDS.IN_PROGRESS ? 'bg-blue-500' : 'bg-slate-500'
          }`} />
          <span className="font-semibold text-sm">{COLUMN_TITLES[value]}</span>
          <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">{issues.length}</Badge>
        </div>
        <KanbanColumnHandle asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-background/50">
            <GripVertical className="h-3 w-3" />
          </Button>
        </KanbanColumnHandle>
      </div>
      <KanbanColumnContent value={value} className="flex flex-col gap-2.5 flex-1 min-h-[100px]">
        {issues.map(issue => (
          <IssueCard
            key={issue.id}
            issue={issue}
            asHandle={!isOverlay}
            onClick={onIssueClick ? () => onIssueClick(issue) : undefined}
            onAuthorClick={onAuthorClick}
            onAssigneeClick={onAssigneeClick}
          />
        ))}
      </KanbanColumnContent>
       <Button
         variant="ghost"
         className="w-full justify-start text-muted-foreground hover:text-foreground text-xs h-8"
         onClick={onAddItem}
       >
        <Plus className="mr-2 h-3 w-3" />
        Add Item
      </Button>
    </KanbanColumn>
  )
}


export default function BoardPage({ params }: { params: Promise<{ owner: string, repo: string }> }) {
  const { owner, repo } = use(params)
  const { token, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [columns, setColumns] = useState<Record<string, Issue[]>>({
    [COLUMN_IDS.TODO]: [],
    [COLUMN_IDS.IN_PROGRESS]: [],
    [COLUMN_IDS.DONE]: []
  })
  const lastDragTimeRef = useRef<number>(0)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [newIssueDialogOpen, setNewIssueDialogOpen] = useState(false)
  const [newIssueDefaultStatus, setNewIssueDefaultStatus] = useState("todo")
  const [labelManagementOpen, setLabelManagementOpen] = useState(false)
  const [milestoneManagementOpen, setMilestoneManagementOpen] = useState(false)

  // Filters
  const [filterAuthor, setFilterAuthor] = useState<string | null>(null)
  const [filterMilestone, setFilterMilestone] = useState<string | null>(null)
  const [filterLabel, setFilterLabel] = useState<string | null>(null)
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null)

  // Organize issues into columns based on labels and filters
  const organizeIssues = useCallback((issuesToOrganize: Issue[]) => {
    console.log('🗂️ organizeIssues called with', issuesToOrganize.length, 'issues')
    const newColumns: Record<string, Issue[]> = {
      [COLUMN_IDS.TODO]: [],
      [COLUMN_IDS.IN_PROGRESS]: [],
      [COLUMN_IDS.DONE]: []
    }

    issuesToOrganize.forEach(issue => {
      // Apply filters
      if (filterAuthor && issue.user.login !== filterAuthor) return
      if (filterMilestone && issue.milestone?.title !== filterMilestone) return
      if (filterLabel && !issue.labels.some(l => l.name === filterLabel)) return
      if (filterAssignee && !issue.assignees.some(a => a.login === filterAssignee)) return

      const labels = issue.labels.map(l => l.name.toLowerCase())
      const statusLabels = issue.labels.filter(l => l.name.startsWith('status:'))

      if (labels.some(l => l.includes('done') || l.includes('complete'))) {
        newColumns[COLUMN_IDS.DONE].push(issue)
        console.log(`  Issue #${issue.number} -> DONE (labels: ${statusLabels.map(l => l.name).join(', ')})`)
      } else if (labels.some(l => l.includes('progress') || l.includes('working'))) {
        newColumns[COLUMN_IDS.IN_PROGRESS].push(issue)
        console.log(`  Issue #${issue.number} -> IN_PROGRESS (labels: ${statusLabels.map(l => l.name).join(', ')})`)
      } else {
        newColumns[COLUMN_IDS.TODO].push(issue)
        console.log(`  Issue #${issue.number} -> TODO (labels: ${statusLabels.map(l => l.name).join(', ')})`)
      }
    })

    console.log(`📊 Organized: TODO=${newColumns[COLUMN_IDS.TODO].length}, IN_PROGRESS=${newColumns[COLUMN_IDS.IN_PROGRESS].length}, DONE=${newColumns[COLUMN_IDS.DONE].length}`)
    return newColumns
  }, [filterAuthor, filterMilestone, filterLabel, filterAssignee])

  // Ensure required status labels exist in the repository
  const ensureStatusLabels = useCallback(async () => {
    if (!token) return

    try {
      const octokit = getOctokit(token)
      const requiredLabels = [
        { name: 'status:in-progress', color: '0366d6', description: 'Issue is in progress' },
        { name: 'status:done', color: '22863a', description: 'Issue is completed' }
      ]

      // Get existing labels
      const { data: existingLabels } = await octokit.rest.issues.listLabelsForRepo({
        owner,
        repo,
        per_page: 100
      })

      const existingLabelNames = existingLabels.map(l => l.name)

      // Create missing labels
      for (const label of requiredLabels) {
        if (!existingLabelNames.includes(label.name)) {
          try {
            await octokit.rest.issues.createLabel({
              owner,
              repo,
              name: label.name,
              color: label.color,
              description: label.description
            })
            console.log(`✓ Created label: ${label.name}`)
          } catch (error) {
            console.error(`Failed to create label ${label.name}:`, error)
          }
        }
      }
    } catch (error) {
      console.error("Failed to ensure status labels:", error)
    }
  }, [token, owner, repo])

  const fetchIssues = useCallback(async (skipDelayCheck = false) => {
      if (!token) {
        console.log("fetchIssues: No token, skipping")
        return
      }

      // Debug: Log who called fetchIssues
      console.log('📞 fetchIssues called, skipDelayCheck =', skipDelayCheck)
      console.trace('Call stack:')

      // Check if a drag happened recently (even before page reload)
      if (!skipDelayCheck) {
        const lastDragTime = parseInt(localStorage.getItem(`lastDrag_${owner}_${repo}`) || '0')
        const timeSinceLastDrag = Date.now() - lastDragTime
        const GITHUB_SYNC_DELAY = 5000 // 5 seconds (increased for GitHub eventual consistency)

        if (lastDragTime > 0 && timeSinceLastDrag < GITHUB_SYNC_DELAY) {
          const waitTime = GITHUB_SYNC_DELAY - timeSinceLastDrag
          console.log(`⏳ Waiting ${waitTime}ms for GitHub to sync recent drag operation...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          console.log(`✓ Wait complete, fetching from GitHub now...`)
        }
      }

      console.log("=== Fetching Issues ===")
      setLoading(true)
      try {
        const octokit = getOctokit(token)

        // Clean up old localStorage entry (only if we checked the delay)
        if (!skipDelayCheck) {
          const lastDragTime = parseInt(localStorage.getItem(`lastDrag_${owner}_${repo}`) || '0')
          if (lastDragTime && Date.now() - lastDragTime > 15000) { // 15 seconds
            localStorage.removeItem(`lastDrag_${owner}_${repo}`)
          }
        }

        // Fetch both open and closed issues
        const [openResponse, closedResponse] = await Promise.all([
          octokit.rest.issues.listForRepo({
            owner,
            repo,
            state: 'open',
            per_page: 100,
            sort: 'created',
            direction: 'desc'
          }),
          octokit.rest.issues.listForRepo({
            owner,
            repo,
            state: 'closed',
            per_page: 30, // Fetch last 30 closed issues
            sort: 'updated',
            direction: 'desc'
          })
        ])

        const fetchedIssues = [...openResponse.data, ...closedResponse.data] as Issue[]
        console.log(`✓ Fetched ${fetchedIssues.length} issues (${openResponse.data.length} open, ${closedResponse.data.length} closed)`)

        // Debug: Log labels for each issue
        fetchedIssues.forEach(issue => {
          const statusLabels = issue.labels.filter(l => l.name.startsWith('status:'))
          if (statusLabels.length > 0) {
            console.log(`  Issue #${issue.number}: labels = [${statusLabels.map(l => l.name).join(', ')}]`)
          }
        })

        setIssues(fetchedIssues)
        setColumns(organizeIssues(fetchedIssues))
        console.log("✓ Columns updated")
        setLoading(false)

      } catch (error) {
        console.error("❌ Failed to fetch issues:", error)
        setLoading(false)
      }
  }, [token, owner, repo, organizeIssues])

  // Initial fetch on mount
  useEffect(() => {
    if (!isAuthLoading && token) {
      ensureStatusLabels() // Create status labels if they don't exist
      fetchIssues()
    } else if (!isAuthLoading && !token) {
       router.push('/')
    }
    // Only run on mount and auth changes - NOT when fetchIssues changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAuthLoading, router, owner, repo])

  // Re-organize columns when issues or filters change (no API call needed)
  useEffect(() => {
    if (issues.length > 0) {
      setColumns(organizeIssues(issues))
    }
  }, [issues, organizeIssues, filterAuthor, filterMilestone, filterLabel, filterAssignee])


  const handleMove = async (event: any) => {
    const { activeContainer, overContainer, activeIndex, overIndex } = event

    // Optimistic Update
    const activeItems = [...columns[activeContainer]]
    const overItems = [...columns[overContainer]]
    const [movedItem] = activeItems.splice(activeIndex, 1)

    // If moving to same container
    if (activeContainer === overContainer) {
       activeItems.splice(overIndex, 0, movedItem)
       setColumns({
          ...columns,
          [activeContainer]: activeItems
       })
       return // No API call needed for reordering (GitHub doesn't support manual sort easily)
    }

    // Determine what labels to add/remove based on target column
    let labelToAdd: string | null = null
    let labelsToRemove: string[] = []
    let newState = movedItem.state

    if (overContainer === COLUMN_IDS.IN_PROGRESS) {
       labelToAdd = 'status:in-progress'
       labelsToRemove = ['status:done']
       if (movedItem.state === 'closed') newState = 'open'
    } else if (overContainer === COLUMN_IDS.DONE) {
       labelToAdd = 'status:done'
       labelsToRemove = ['status:in-progress']
       if (movedItem.state === 'open') newState = 'closed'
    } else {
       // Moving to TODO - remove all status labels
       labelsToRemove = ['status:in-progress', 'status:done']
       if (movedItem.state === 'closed') newState = 'open'
    }

    // Update the item's labels and state locally (optimistic update of data)
    const updatedLabels = movedItem.labels
      .filter(l => !labelsToRemove.includes(l.name))
    if (labelToAdd && !updatedLabels.some(l => l.name === labelToAdd)) {
      updatedLabels.push({ id: Date.now(), name: labelToAdd, color: '0366d6' })
    }

    const updatedItem = { ...movedItem, labels: updatedLabels, state: newState }

    // Update columns immediately for visual feedback (Kanban library needs this)
    overItems.splice(overIndex, 0, updatedItem)
    setColumns({
       ...columns,
       [activeContainer]: activeItems,
       [overContainer]: overItems
    })

    // Also update the issues array so the data stays in sync
    setIssues(prev => prev.map(i => i.id === movedItem.id ? updatedItem : i))

    // API Call (fire and forget - we trust the optimistic update)
    if (!token) return
    try {
       const octokit = getOctokit(token)
       const issueNumber = movedItem.number

       console.log(`Moving #${issueNumber}: ${activeContainer} -> ${overContainer}`)
       console.log(`  Labels to remove:`, labelsToRemove)
       console.log(`  Label to add:`, labelToAdd)
       console.log(`  State change:`, movedItem.state, '->', newState)

       // 1. Remove old labels (ignore 404 errors - label might not exist)
       for (const label of labelsToRemove) {
          try {
             await octokit.rest.issues.removeLabel({ owner, repo, issue_number: issueNumber, name: label })
             console.log(`  ✓ Removed label: ${label}`)
          } catch (error: any) {
             console.log(`  ℹ Could not remove label "${label}": ${error.status || 'unknown error'} (probably didn't exist)`)
          }
       }

       // 2. Add new label (create it if it doesn't exist)
       if (labelToAdd) {
          try {
             await octokit.rest.issues.addLabels({ owner, repo, issue_number: issueNumber, labels: [labelToAdd] })
             console.log(`  ✓ Added label: ${labelToAdd}`)
          } catch (error: any) {
             // If label doesn't exist (422 error), create it first
             if (error.status === 422) {
                console.log(`Label "${labelToAdd}" doesn't exist, creating it...`)
                try {
                   await octokit.rest.issues.createLabel({
                      owner,
                      repo,
                      name: labelToAdd,
                      color: labelToAdd === 'status:done' ? '22863a' : '0366d6',
                      description: labelToAdd === 'status:done' ? 'Issue is completed' : 'Issue is in progress'
                   })
                   // Try adding the label again
                   await octokit.rest.issues.addLabels({ owner, repo, issue_number: issueNumber, labels: [labelToAdd] })
                   console.log(`✓ Created and added label "${labelToAdd}"`)
                } catch (createError) {
                   console.error(`Failed to create label "${labelToAdd}":`, createError)
                   throw createError
                }
             } else {
                throw error
             }
          }
       }

       // 3. Close or reopen if needed
       if (newState !== movedItem.state) {
          await octokit.rest.issues.update({ owner, repo, issue_number: issueNumber, state: newState as 'open' | 'closed' })
          console.log(`  ✓ Updated state: ${movedItem.state} -> ${newState}`)
       }

       console.log(`✓ Issue #${issueNumber} moved successfully to ${overContainer}`)
       console.log(`  Final labels on issue:`, updatedItem.labels.map(l => l.name).join(', '))
       // Record the time of this drag operation (both in ref and localStorage)
       const now = Date.now()
       lastDragTimeRef.current = now
       localStorage.setItem(`lastDrag_${owner}_${repo}`, now.toString())
       // Don't fetch - trust the optimistic update

    } catch (error: any) {
       console.error("Failed to move issue:", error)
       const errorMessage = error.message || error.toString()
       const detailedError = error.status
          ? `GitHub API Error (${error.status}): ${errorMessage}`
          : `Error: ${errorMessage}`

       alert(`Failed to move issue. ${detailedError}\n\nReverting changes.`)
       // Revert optimistic update by fetching fresh data (skip delay since we're reverting an error)
       await fetchIssues(true)
    }
  }

  if (loading || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const projectName = `${owner}/${repo}`
  const navItems = [
    { name: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { name: projectName, url: `/board/${owner}/${repo}`, icon: LayoutDashboard },
  ]

  const handleIssueClick = (issue: Issue) => {
    setSelectedIssue(issue)
    setDetailDialogOpen(true)
  }

  const handleIssueUpdated = (updatedIssue: Issue) => {
    // Update the issue in local state optimistically
    setIssues(prev => prev.map(i => i.id === updatedIssue.id ? updatedIssue : i))

    // Also update the selected issue if it's the one being viewed
    setSelectedIssue(updatedIssue)
  }

  const handleIssueCreated = (newIssue: Issue) => {
    // Add new issue to the beginning of the issues array
    setIssues(prev => [newIssue, ...prev])
  }

  const handleManualRefresh = async () => {
    setRefreshing(true)

    // If a drag happened recently, wait for GitHub to sync (eventual consistency)
    // Check both ref and localStorage (in case of page reload)
    const refTime = lastDragTimeRef.current
    const storageTime = parseInt(localStorage.getItem(`lastDrag_${owner}_${repo}`) || '0')
    const lastDragTime = Math.max(refTime, storageTime)
    const timeSinceLastDrag = Date.now() - lastDragTime
    const GITHUB_SYNC_DELAY = 5000 // 5 seconds (increased for GitHub eventual consistency)

    if (lastDragTime > 0 && timeSinceLastDrag < GITHUB_SYNC_DELAY) {
      const waitTime = GITHUB_SYNC_DELAY - timeSinceLastDrag
      console.log(`Waiting ${waitTime}ms for GitHub to sync recent drag operation...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    await fetchIssues()
    setRefreshing(false)
  }

  const handleAuthorClick = (author: string) => {
    setFilterAuthor(author)
  }

  const handleAssigneeClick = (assignee: string) => {
    setFilterAssignee(assignee)
  }

  const handleAddItem = (columnId: string) => {
    // Map column IDs to status values for the new issue dialog
    const statusMap: Record<string, string> = {
      [COLUMN_IDS.TODO]: "todo",
      [COLUMN_IDS.IN_PROGRESS]: "in-progress",
      [COLUMN_IDS.DONE]: "done"
    }
    setNewIssueDefaultStatus(statusMap[columnId] || "todo")
    setNewIssueDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
       <NavBar items={navItems} activeTab={projectName} />

       <header className="pt-24 pb-6 border-b px-6 bg-background/50 backdrop-blur-sm sticky top-0 z-40 pointer-events-auto">
          <div className="container mx-auto space-y-4 pointer-events-auto">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
                     <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                     <h1 className="text-xl font-bold tracking-tight">{repo}</h1>
                     <p className="text-sm text-muted-foreground">Owned by {owner}</p>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualRefresh}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLabelManagementOpen(true)}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    Manage Labels
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMilestoneManagementOpen(true)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Manage Milestones
                  </Button>
                  <Button onClick={() => {
                    setNewIssueDefaultStatus("todo")
                    setNewIssueDialogOpen(true)
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Issue
                  </Button>
               </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap relative pointer-events-auto">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>Filters:</span>
              </div>

              {/* Author Filter */}
              {filterAuthor ? (
                <Badge variant="secondary" className="gap-1">
                  Author: {filterAuthor}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setFilterAuthor(null)}
                  />
                </Badge>
              ) : (
                <Select value={filterAuthor || ""} onValueChange={(v) => setFilterAuthor(v || null)}>
                  <SelectTrigger className="h-7 w-[140px] text-xs">
                    <SelectValue placeholder="Author" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    {Array.from(new Set(issues.map(i => i.user.login))).map(author => (
                      <SelectItem key={author} value={author}>{author}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Assignee Filter */}
              {filterAssignee ? (
                <Badge variant="secondary" className="gap-1">
                  Assignee: {filterAssignee}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setFilterAssignee(null)}
                  />
                </Badge>
              ) : (
                <Select value={filterAssignee || ""} onValueChange={(v) => setFilterAssignee(v || null)}>
                  <SelectTrigger className="h-7 w-[140px] text-xs">
                    <SelectValue placeholder="Assignee" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    {Array.from(new Set(issues.flatMap(i => i.assignees.map(a => a.login)))).map(assignee => (
                      <SelectItem key={assignee} value={assignee}>{assignee}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Label Filter */}
              {filterLabel ? (
                <Badge variant="secondary" className="gap-1">
                  Label: {filterLabel}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setFilterLabel(null)}
                  />
                </Badge>
              ) : (
                <Select value={filterLabel || ""} onValueChange={(v) => setFilterLabel(v || null)}>
                  <SelectTrigger className="h-7 w-[140px] text-xs">
                    <SelectValue placeholder="Label" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    {Array.from(new Set(issues.flatMap(i => i.labels.map(l => l.name)))).map(label => (
                      <SelectItem key={label} value={label}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Milestone Filter */}
              {filterMilestone ? (
                <Badge variant="secondary" className="gap-1">
                  Milestone: {filterMilestone}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setFilterMilestone(null)}
                  />
                </Badge>
              ) : (
                <Select value={filterMilestone || ""} onValueChange={(v) => setFilterMilestone(v || null)}>
                  <SelectTrigger className="h-7 w-[140px] text-xs">
                    <SelectValue placeholder="Milestone" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    {Array.from(new Set(issues.filter(i => i.milestone).map(i => i.milestone!.title))).map(milestone => (
                      <SelectItem key={milestone} value={milestone}>{milestone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Clear All Filters */}
              {(filterAuthor || filterAssignee || filterLabel || filterMilestone) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setFilterAuthor(null)
                    setFilterAssignee(null)
                    setFilterLabel(null)
                    setFilterMilestone(null)
                  }}
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>
       </header>

       <main className="flex-1 overflow-x-auto p-6">
          <div className="h-full min-w-max mx-auto container">
             <Kanban
                value={columns}
                onValueChange={setColumns as any}
                onMove={handleMove}
                getItemValue={(issue: Issue) => issue.id.toString()}
                className="h-full"
              >
                <KanbanBoard className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
                  {Object.entries(columns).map(([columnId, colIssues]) => (
                    <BoardColumn
                      key={columnId}
                      value={columnId}
                      issues={colIssues}
                      onIssueClick={handleIssueClick}
                      onAuthorClick={handleAuthorClick}
                      onAssigneeClick={handleAssigneeClick}
                      onAddItem={() => handleAddItem(columnId)}
                    />
                  ))}
                </KanbanBoard>
                <KanbanOverlay>
                   {({ value }) => {
                      const issue = issues.find(i => i.id.toString() === value)
                      if (!issue) return null
                      return <IssueCard issue={issue} />
                   }}
                </KanbanOverlay>
             </Kanban>
          </div>
       </main>

       <IssueDetailDialog
         issue={selectedIssue}
         owner={owner}
         repo={repo}
         open={detailDialogOpen}
         onOpenChange={setDetailDialogOpen}
         onIssueUpdated={handleIssueUpdated}
       />

       <NewIssueDialog
         owner={owner}
         repo={repo}
         open={newIssueDialogOpen}
         onOpenChange={setNewIssueDialogOpen}
         onIssueCreated={handleIssueCreated}
         defaultStatus={newIssueDefaultStatus}
       />

       <LabelManagementDialog
         owner={owner}
         repo={repo}
         open={labelManagementOpen}
         onOpenChange={setLabelManagementOpen}
         onLabelsUpdated={fetchIssues}
       />

       <MilestoneManagementDialog
         owner={owner}
         repo={repo}
         open={milestoneManagementOpen}
         onOpenChange={setMilestoneManagementOpen}
         onMilestonesUpdated={fetchIssues}
       />
    </div>
  )
}
