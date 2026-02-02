"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-hook"
import { getOctokit } from "@/lib/github"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus } from "lucide-react"

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

interface NewIssueDialogProps {
  owner: string
  repo: string
  onIssueCreated: (newIssue: Issue) => void | Promise<void>
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultStatus?: string
}

export function NewIssueDialog({ owner, repo, onIssueCreated, open: controlledOpen, onOpenChange, defaultStatus = "todo" }: NewIssueDialogProps) {
  const { token } = useAuth()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState(defaultStatus)

  useEffect(() => {
    setStatus(defaultStatus)
  }, [defaultStatus, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    setLoading(true)
    try {
      const octokit = getOctokit(token)
      
      const labels = []
      if (status === "todo") {
          // No label or custom label? Let's just create it without specific status label for Todo if it's default
      } else if (status === "in-progress") {
          labels.push("status:in-progress")
      } else if (status === "done") {
          labels.push("status:done")
      }

      const newIssue = await octokit.rest.issues.create({
        owner,
        repo,
        title,
        body: description,
        labels
      })

      console.log("✓ Issue created:", newIssue.data.number)

      // Reset form and close dialog immediately for snappy UX
      setTitle("")
      setDescription("")
      setStatus("todo")
      setOpen(false)

      // Pass the created issue data to the callback for optimistic update
      const newIssueData = newIssue.data as Issue
      await onIssueCreated(newIssueData)

    } catch (error) {
      console.error("Failed to create issue", error)
      alert("Failed to create issue. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Issue</DialogTitle>
          <DialogDescription>
            Add a new task to your board.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Fix navigation bug"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
             <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue..."
              rows={3}
            />
          </div>
          <DialogFooter>
             <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Issue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
