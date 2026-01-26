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
import { Loader2, Plus, Trash2, Edit2, Check, X } from "lucide-react"

interface LabelData {
  name: string
  color: string
  description: string
}

interface LabelManagementDialogProps {
  owner: string
  repo: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onLabelsUpdated: () => void | Promise<void>
}

export function LabelManagementDialog({
  owner,
  repo,
  open,
  onOpenChange,
  onLabelsUpdated,
}: LabelManagementDialogProps) {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [labels, setLabels] = useState<LabelData[]>([])
  const [editingLabel, setEditingLabel] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<LabelData>({ name: "", color: "", description: "" })
  const [newLabel, setNewLabel] = useState<LabelData>({ name: "", color: "0969da", description: "" })
  const [showNewForm, setShowNewForm] = useState(false)

  useEffect(() => {
    if (open && token) {
      fetchLabels()
    }
  }, [open, token])

  const fetchLabels = async () => {
    if (!token) return
    setLoading(true)
    try {
      const octokit = getOctokit(token)
      const response = await octokit.rest.issues.listLabelsForRepo({
        owner,
        repo,
      })
      setLabels(response.data.map(l => ({ name: l.name, color: l.color, description: l.description || "" })))
    } catch (error) {
      console.error("Failed to fetch labels", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLabel = async () => {
    if (!token || !newLabel.name || !newLabel.color) return
    setLoading(true)
    try {
      const octokit = getOctokit(token)
      await octokit.rest.issues.createLabel({
        owner,
        repo,
        name: newLabel.name,
        color: newLabel.color.replace("#", ""),
        description: newLabel.description,
      })
      setNewLabel({ name: "", color: "0969da", description: "" })
      setShowNewForm(false)
      await fetchLabels()
      await onLabelsUpdated()
    } catch (error) {
      console.error("Failed to create label", error)
      alert("Failed to create label")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateLabel = async (oldName: string) => {
    if (!token) return
    setLoading(true)
    try {
      const octokit = getOctokit(token)
      await octokit.rest.issues.updateLabel({
        owner,
        repo,
        name: oldName,
        new_name: editForm.name,
        color: editForm.color.replace("#", ""),
        description: editForm.description,
      })
      setEditingLabel(null)
      await fetchLabels()
      await onLabelsUpdated()
    } catch (error) {
      console.error("Failed to update label", error)
      alert("Failed to update label")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLabel = async (name: string) => {
    if (!token) return
    if (!confirm(`Delete label "${name}"?`)) return
    setLoading(true)
    try {
      const octokit = getOctokit(token)
      await octokit.rest.issues.deleteLabel({
        owner,
        repo,
        name,
      })
      await fetchLabels()
      await onLabelsUpdated()
    } catch (error) {
      console.error("Failed to delete label", error)
      alert("Failed to delete label")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Labels</DialogTitle>
          <DialogDescription>
            Create, edit, and delete labels for this repository.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* New Label Form */}
          {showNewForm ? (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">New Label</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowNewForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="new-name">Name</Label>
                  <Input
                    id="new-name"
                    value={newLabel.name}
                    onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
                    placeholder="bug, enhancement, etc."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-color">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="new-color"
                      type="color"
                      value={`#${newLabel.color}`}
                      onChange={(e) => setNewLabel({ ...newLabel, color: e.target.value.replace("#", "") })}
                      className="w-20 h-9"
                    />
                    <Input
                      value={newLabel.color}
                      onChange={(e) => setNewLabel({ ...newLabel, color: e.target.value.replace("#", "") })}
                      placeholder="0969da"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-description">Description (optional)</Label>
                  <Input
                    id="new-description"
                    value={newLabel.description}
                    onChange={(e) => setNewLabel({ ...newLabel, description: e.target.value })}
                    placeholder="Something isn't working"
                  />
                </div>
                <Button onClick={handleCreateLabel} disabled={loading || !newLabel.name}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Create Label
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowNewForm(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              New Label
            </Button>
          )}

          {/* Labels List */}
          <div className="space-y-2">
            {loading && labels.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : labels.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No labels yet</p>
            ) : (
              labels.map((label) => (
                <div key={label.name} className="border rounded-lg p-3">
                  {editingLabel === label.name ? (
                    <div className="space-y-3">
                      <div className="grid gap-2">
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="Label name"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={`#${editForm.color}`}
                          onChange={(e) => setEditForm({ ...editForm, color: e.target.value.replace("#", "") })}
                          className="w-20 h-9"
                        />
                        <Input
                          value={editForm.color}
                          onChange={(e) => setEditForm({ ...editForm, color: e.target.value.replace("#", "") })}
                          className="flex-1"
                        />
                      </div>
                      <Input
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Description"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdateLabel(label.name)} disabled={loading}>
                          <Check className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingLabel(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-12 h-6 rounded"
                          style={{ backgroundColor: `#${label.color}` }}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{label.name}</div>
                          {label.description && (
                            <div className="text-xs text-muted-foreground">{label.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingLabel(label.name)
                            setEditForm(label)
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLabel(label.name)}
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
