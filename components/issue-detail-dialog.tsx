"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-hook"
import { getOctokit } from "@/lib/github"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge-2"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, ExternalLink, Calendar, Users, Tag, X, Edit2, Check, XCircle, Building2 } from "lucide-react"

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

interface User {
  login: string
  avatar_url: string
  id: number
}

interface Milestone {
  title: string
  number: number
  due_on: string | null
}

interface IssueDetailDialogProps {
  issue: Issue | null
  owner: string
  repo: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onIssueUpdated: () => void | Promise<void>
}

export function IssueDetailDialog({
  issue,
  owner,
  repo,
  open,
  onOpenChange,
  onIssueUpdated,
}: IssueDetailDialogProps) {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [collaborators, setCollaborators] = useState<User[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [availableLabels, setAvailableLabels] = useState<{ name: string; color: string }[]>([])
  const [currentIssue, setCurrentIssue] = useState<Issue | null>(issue)

  // Editable fields
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingBody, setEditingBody] = useState(false)
  const [titleValue, setTitleValue] = useState("")
  const [bodyValue, setBodyValue] = useState("")

  useEffect(() => {
    if (issue) {
      setCurrentIssue(issue)
      setTitleValue(issue.title)
      setBodyValue(issue.body || "")
    }
  }, [issue])

  const refreshIssue = async () => {
    if (!token || !currentIssue) return
    try {
      const octokit = getOctokit(token)
      const response = await octokit.rest.issues.get({
        owner,
        repo,
        issue_number: currentIssue.number,
      })
      setCurrentIssue(response.data as Issue)
      setTitleValue(response.data.title)
      setBodyValue(response.data.body || "")
      onIssueUpdated()
    } catch (error) {
      console.error("Failed to refresh issue", error)
    }
  }

  useEffect(() => {
    if (open && token) {
      fetchCollaborators()
      fetchMilestones()
      fetchLabels()
    }
  }, [open, token, owner, repo])

  const fetchCollaborators = async () => {
    if (!token) return
    try {
      const octokit = getOctokit(token)
      const response = await octokit.rest.repos.listCollaborators({
        owner,
        repo,
      })
      setCollaborators(response.data as User[])
    } catch (error) {
      console.error("Failed to fetch collaborators", error)
    }
  }

  const fetchMilestones = async () => {
    if (!token) return
    try {
      const octokit = getOctokit(token)
      const response = await octokit.rest.issues.listMilestones({
        owner,
        repo,
        state: "open",
      })
      setMilestones(response.data as Milestone[])
    } catch (error) {
      console.error("Failed to fetch milestones", error)
    }
  }

  const fetchLabels = async () => {
    if (!token) return
    try {
      const octokit = getOctokit(token)
      const response = await octokit.rest.issues.listLabelsForRepo({
        owner,
        repo,
      })
      setAvailableLabels(response.data.map(l => ({ name: l.name, color: l.color })))
    } catch (error) {
      console.error("Failed to fetch labels", error)
    }
  }

  const handleAssignUser = async (username: string) => {
    if (!token || !currentIssue) return
    setLoading(true)
    try {
      const octokit = getOctokit(token)
      await octokit.rest.issues.addAssignees({
        owner,
        repo,
        issue_number: currentIssue.number,
        assignees: [username],
      })
      await refreshIssue()
    } catch (error) {
      console.error("Failed to assign user", error)
      alert("Failed to assign user")
    } finally {
      setLoading(false)
    }
  }

  const handleUnassignUser = async (username: string) => {
    if (!token || !currentIssue) return
    setLoading(true)
    try {
      const octokit = getOctokit(token)
      await octokit.rest.issues.removeAssignees({
        owner,
        repo,
        issue_number: currentIssue.number,
        assignees: [username],
      })
      await refreshIssue()
    } catch (error) {
      console.error("Failed to unassign user", error)
      alert("Failed to unassign user")
    } finally {
      setLoading(false)
    }
  }

  const handleSetMilestone = async (milestoneNumber: number | null) => {
    if (!token || !currentIssue) return
    setLoading(true)
    try {
      const octokit = getOctokit(token)
      await octokit.rest.issues.update({
        owner,
        repo,
        issue_number: currentIssue.number,
        milestone: milestoneNumber,
      })
      await refreshIssue()
    } catch (error) {
      console.error("Failed to set milestone", error)
      alert("Failed to set milestone")
    } finally {
      setLoading(false)
    }
  }

  const handleAddLabel = async (labelName: string) => {
    if (!token || !currentIssue) return
    setLoading(true)
    try {
      const octokit = getOctokit(token)
      await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: currentIssue.number,
        labels: [labelName],
      })
      await refreshIssue()
    } catch (error) {
      console.error("Failed to add label", error)
      alert("Failed to add label")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveLabel = async (labelName: string) => {
    if (!token || !currentIssue) return
    setLoading(true)
    try {
      const octokit = getOctokit(token)
      await octokit.rest.issues.removeLabel({
        owner,
        repo,
        issue_number: currentIssue.number,
        name: labelName,
      })
      console.log('Label removed:', labelName)
      await refreshIssue()
    } catch (error) {
      console.error("Failed to remove label", error)
      alert("Failed to remove label")
    } finally {
      setLoading(false)
    }
  }

  const handleChangeDepartment = async (newDepartment: string) => {
    if (!token || !currentIssue) return
    setLoading(true)
    try {
      const octokit = getOctokit(token)

      // Remove current department if exists
      if (currentDepartment) {
        console.log('Removing current department:', currentDepartment.name)
        await octokit.rest.issues.removeLabel({
          owner,
          repo,
          issue_number: currentIssue.number,
          name: currentDepartment.name,
        })
      }

      // Add new department
      console.log('Adding new department:', newDepartment)
      await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: currentIssue.number,
        labels: [newDepartment],
      })

      await refreshIssue()
    } catch (error) {
      console.error("Failed to change department", error)
      alert("Failed to change department")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTitle = async () => {
    if (!token || !currentIssue || titleValue.trim() === "") return
    setLoading(true)
    try {
      const octokit = getOctokit(token)
      await octokit.rest.issues.update({
        owner,
        repo,
        issue_number: currentIssue.number,
        title: titleValue,
      })
      setEditingTitle(false)
      await refreshIssue()
    } catch (error) {
      console.error("Failed to update title", error)
      alert("Failed to update title")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBody = async () => {
    if (!token || !currentIssue) return
    setLoading(true)
    try {
      const octokit = getOctokit(token)
      await octokit.rest.issues.update({
        owner,
        repo,
        issue_number: currentIssue.number,
        body: bodyValue,
      })
      setEditingBody(false)
      await refreshIssue()
    } catch (error) {
      console.error("Failed to update description", error)
      alert("Failed to update description")
    } finally {
      setLoading(false)
    }
  }

  const handleCloseIssue = async () => {
    if (!token || !currentIssue) return
    if (!confirm("Are you sure you want to close this issue?")) return
    setLoading(true)
    try {
      const octokit = getOctokit(token)
      await octokit.rest.issues.update({
        owner,
        repo,
        issue_number: currentIssue.number,
        state: "closed",
      })
      await refreshIssue()
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to close issue", error)
      alert("Failed to close issue")
    } finally {
      setLoading(false)
    }
  }

  const handleReopenIssue = async () => {
    if (!token || !currentIssue) return
    setLoading(true)
    try {
      const octokit = getOctokit(token)
      await octokit.rest.issues.update({
        owner,
        repo,
        issue_number: currentIssue.number,
        state: "open",
      })
      await refreshIssue()
    } catch (error) {
      console.error("Failed to reopen issue", error)
      alert("Failed to reopen issue")
    } finally {
      setLoading(false)
    }
  }

  if (!currentIssue) return null

  const assignedLogins = currentIssue.assignees.map(a => a.login)
  const unassignedCollaborators = collaborators.filter(
    c => !assignedLogins.includes(c.login)
  )

  const issueLabels = currentIssue.labels.map(l => l.name)
  const unusedLabels = availableLabels.filter(l => !issueLabels.includes(l.name))

  // Department labels - dynamic based on "dept:" prefix
  const departmentLabels = availableLabels.filter(l => l.name.startsWith('dept:'))
  const currentDepartment = currentIssue.labels.find(l => l.name.startsWith('dept:'))
  const otherLabels = currentIssue.labels.filter(l =>
    !l.name.startsWith('dept:') && !l.name.startsWith('status:')
  )
  const unusedOtherLabels = unusedLabels.filter(l =>
    !l.name.startsWith('dept:')
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    className="text-xl font-semibold"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdateTitle()
                      if (e.key === "Escape") {
                        setEditingTitle(false)
                        setTitleValue(currentIssue.title)
                      }
                    }}
                  />
                  <Button size="sm" variant="ghost" onClick={handleUpdateTitle} disabled={loading}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingTitle(false)
                      setTitleValue(currentIssue.title)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <DialogTitle className="text-xl">{currentIssue.title}</DialogTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    onClick={() => setEditingTitle(true)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <DialogDescription className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className={currentIssue.state === "open" ? "bg-green-500 text-white" : "bg-purple-500 text-white"}
                >
                  {currentIssue.state === "open" ? "Open" : "Closed"}
                </Badge>
                <span className="text-xs font-mono">#{currentIssue.number}</span>
                <span>•</span>
                <span>Opened by {currentIssue.user.login}</span>
                <span>•</span>
                <a
                  href={currentIssue.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  View on GitHub <ExternalLink className="h-3 w-3" />
                </a>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Description</Label>
              {!editingBody && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingBody(true)}
                  className="h-6 text-xs"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
            </div>
            {editingBody ? (
              <div className="space-y-2">
                <Textarea
                  value={bodyValue}
                  onChange={(e) => setBodyValue(e.target.value)}
                  rows={6}
                  className="text-sm"
                  placeholder="Add a description..."
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleUpdateBody} disabled={loading}>
                    <Check className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingBody(false)
                      setBodyValue(currentIssue.body || "")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground whitespace-pre-wrap border rounded-md p-3 bg-muted/30 min-h-[80px]">
                {currentIssue.body || "No description provided."}
              </div>
            )}
          </div>

          {/* Department */}
          {departmentLabels.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <Label>Department</Label>
                </div>
                {currentDepartment && (
                  <button
                    onClick={() => handleRemoveLabel(currentDepartment.name)}
                    disabled={loading}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                {departmentLabels.map((dept) => {
                  const isSelected = currentDepartment?.name === dept.name
                  return (
                    <button
                      key={dept.name}
                      type="button"
                      onClick={async () => {
                        console.log('Department clicked:', dept.name, 'isSelected:', isSelected)
                        if (isSelected) {
                          console.log('Removing department:', dept.name)
                          await handleRemoveLabel(dept.name)
                        } else {
                          console.log('Changing to department:', dept.name)
                          await handleChangeDepartment(dept.name)
                        }
                      }}
                      disabled={loading}
                      className={`
                        px-3 py-2.5 text-left text-sm rounded border transition-all cursor-pointer
                        ${isSelected
                          ? 'border-2'
                          : 'border hover:shadow-sm'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                      style={isSelected ? {
                        backgroundColor: `#${dept.color}10`,
                        borderColor: `#${dept.color}`,
                      } : {
                        backgroundColor: 'transparent',
                        borderColor: 'hsl(var(--border))'
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="size-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: `#${dept.color}` }}
                        />
                        <span className="flex-1 font-medium tracking-tight">
                          {dept.name.replace('dept:', '')}
                        </span>
                        {isSelected && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold uppercase" style={{ color: `#${dept.color}` }}>Selected</span>
                            <Check className="h-4 w-4 flex-shrink-0" style={{ color: `#${dept.color}` }} />
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Assignees */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <Label>Assignees</Label>
              </div>
              <div className="space-y-2">
                {currentIssue.assignees.length === 0 && (
                  <p className="text-xs text-muted-foreground">No one assigned</p>
                )}
                {currentIssue.assignees.map((assignee) => (
                  <div
                    key={assignee.login}
                    className="flex items-center justify-between gap-2 p-2 rounded-md border bg-card"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={assignee.avatar_url} />
                        <AvatarFallback>{assignee.login[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{assignee.login}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleUnassignUser(assignee.login)}
                      disabled={loading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {unassignedCollaborators.length > 0 && (
                  <Select onValueChange={handleAssignUser} disabled={loading}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Add assignee..." />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      {unassignedCollaborators.map((user) => (
                        <SelectItem key={user.login} value={user.login}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback>{user.login[0]}</AvatarFallback>
                            </Avatar>
                            {user.login}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Milestone */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <Label>Milestone</Label>
              </div>
              <div className="space-y-2">
                {currentIssue.milestone ? (
                  <div className="flex items-center justify-between gap-2 p-2 rounded-md border bg-card">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{currentIssue.milestone.title}</span>
                      {currentIssue.milestone.due_on && (
                        <span className="text-xs text-muted-foreground">
                          Due {new Date(currentIssue.milestone.due_on).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleSetMilestone(null)}
                      disabled={loading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No milestone</p>
                )}
                {milestones.length > 0 && (
                  <Select
                    onValueChange={(value) => handleSetMilestone(parseInt(value))}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Set milestone..." />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      {milestones.map((milestone) => (
                        <SelectItem key={milestone.number} value={milestone.number.toString()}>
                          {milestone.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <Label>Labels</Label>
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {otherLabels.length === 0 && (
                  <p className="text-xs text-muted-foreground">No labels</p>
                )}
                {otherLabels.map((label) => (
                  <Badge
                    key={label.id}
                    variant="outline"
                    className="gap-1 pr-1"
                    style={{
                      backgroundColor: `#${label.color}20`,
                      borderColor: `#${label.color}`,
                      color: `#${label.color}`,
                    }}
                  >
                    {label.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => handleRemoveLabel(label.name)}
                      disabled={loading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              {unusedOtherLabels.length > 0 && (
                <Select onValueChange={handleAddLabel} disabled={loading}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Add label..." />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    {unusedOtherLabels.map((label) => (
                      <SelectItem key={label.name} value={label.name}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: `#${label.color}` }}
                          />
                          {label.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            {currentIssue.state === "open" ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCloseIssue}
                disabled={loading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Close Issue
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleReopenIssue}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Reopen Issue
              </Button>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Last updated {new Date(currentIssue.updated_at).toLocaleString()}
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
