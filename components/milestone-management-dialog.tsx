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
import { Loader2, Plus, Trash2, Edit2, Check, X, Calendar } from "lucide-react"

interface MilestoneData {
  number?: number
  title: string
  description: string
  due_on: string | null
  state: string
}

interface MilestoneManagementDialogProps {
  owner: string
  repo: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onMilestonesUpdated: () => void
}

export function MilestoneManagementDialog({
  owner,
  repo,
  open,
  onOpenChange,
  onMilestonesUpdated,
}: MilestoneManagementDialogProps) {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [milestones, setMilestones] = useState<MilestoneData[]>([])
  const [editingMilestone, setEditingMilestone] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<MilestoneData>({ title: "", description: "", due_on: null, state: "open" })
  const [newMilestone, setNewMilestone] = useState<MilestoneData>({ title: "", description: "", due_on: null, state: "open" })
  const [showNewForm, setShowNewForm] = useState(false)

  useEffect(() => {
    if (open && token) {
      fetchMilestones()
    }
  }, [open, token])

  const fetchMilestones = async () => {
    if (!token) return
    setLoading(true)
    try {
      const octokit = getOctokit(token)
      const [openResponse, closedResponse] = await Promise.all([
        octokit.rest.issues.listMilestones({ owner, repo, state: "open" }),
        octokit.rest.issues.listMilestones({ owner, repo, state: "closed" })
      ])
      setMilestones([...openResponse.data, ...closedResponse.data].map(m => ({
        number: m.number,
        title: m.title,
        description: m.description || "",
        due_on: m.due_on,
        state: m.state
      })))
    } catch (error) {
      console.error("Failed to fetch milestones", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMilestone = async () => {
    if (!token || !newMilestone.title) return
    setLoading(true)
    try {
      const octokit = getOctokit(token)
      await octokit.rest.issues.createMilestone({
        owner,
        repo,
        title: newMilestone.title,
        description: newMilestone.description,
        due_on: newMilestone.due_on || undefined,
      })
      setNewMilestone({ title: "", description: "", due_on: null, state: "open" })
      setShowNewForm(false)
      await fetchMilestones()
      onMilestonesUpdated()
    } catch (error) {
      console.error("Failed to create milestone", error)
      alert("Failed to create milestone")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMilestone = async (number: number) => {
    if (!token) return
    setLoading(true)
    try {
      const octokit = getOctokit(token)
      await octokit.rest.issues.updateMilestone({
        owner,
        repo,
        milestone_number: number,
        title: editForm.title,
        description: editForm.description,
        due_on: editForm.due_on || undefined,
        state: editForm.state as "open" | "closed",
      })
      setEditingMilestone(null)
      await fetchMilestones()
      onMilestonesUpdated()
    } catch (error) {
      console.error("Failed to update milestone", error)
      alert("Failed to update milestone")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMilestone = async (number: number, title: string) => {
    if (!token) return
    if (!confirm(`Delete milestone "${title}"?`)) return
    setLoading(true)
    try {
      const octokit = getOctokit(token)
      await octokit.rest.issues.deleteMilestone({
        owner,
        repo,
        milestone_number: number,
      })
      await fetchMilestones()
      onMilestonesUpdated()
    } catch (error) {
      console.error("Failed to delete milestone", error)
      alert("Failed to delete milestone")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Milestones</DialogTitle>
          <DialogDescription>
            Create, edit, and delete milestones for this repository.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* New Milestone Form */}
          {showNewForm ? (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">New Milestone</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowNewForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="new-title">Title</Label>
                  <Input
                    id="new-title"
                    value={newMilestone.title}
                    onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                    placeholder="v1.0.0, Q1 2024, etc."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-due">Due Date (optional)</Label>
                  <Input
                    id="new-due"
                    type="date"
                    value={newMilestone.due_on ? newMilestone.due_on.split('T')[0] : ""}
                    onChange={(e) => setNewMilestone({ ...newMilestone, due_on: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-description">Description (optional)</Label>
                  <Textarea
                    id="new-description"
                    value={newMilestone.description}
                    onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                    placeholder="What's included in this milestone?"
                    rows={3}
                  />
                </div>
                <Button onClick={handleCreateMilestone} disabled={loading || !newMilestone.title}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Create Milestone
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowNewForm(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              New Milestone
            </Button>
          )}

          {/* Milestones List */}
          <div className="space-y-2">
            {loading && milestones.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : milestones.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No milestones yet</p>
            ) : (
              milestones.map((milestone) => (
                <div key={milestone.number} className="border rounded-lg p-3">
                  {editingMilestone === milestone.number ? (
                    <div className="space-y-3">
                      <Input
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="Milestone title"
                      />
                      <Input
                        type="date"
                        value={editForm.due_on ? editForm.due_on.split('T')[0] : ""}
                        onChange={(e) => setEditForm({ ...editForm, due_on: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      />
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Description"
                        rows={3}
                      />
                      <div className="flex items-center gap-2">
                        <Label>Status:</Label>
                        <select
                          value={editForm.state}
                          onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          <option value="open">Open</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdateMilestone(milestone.number!)} disabled={loading}>
                          <Check className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingMilestone(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-sm">{milestone.title}</div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${milestone.state === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {milestone.state}
                          </span>
                        </div>
                        {milestone.due_on && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3" />
                            Due {new Date(milestone.due_on).toLocaleDateString()}
                          </div>
                        )}
                        {milestone.description && (
                          <div className="text-xs text-muted-foreground mt-1">{milestone.description}</div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingMilestone(milestone.number!)
                            setEditForm(milestone)
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMilestone(milestone.number!, milestone.title)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
