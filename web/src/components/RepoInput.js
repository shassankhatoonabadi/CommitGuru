"use client"

import { useSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"

export function RepoInput() {
  const { data: session } = useSession()
  const router = useRouter()
  const [repoUrl, setRepoUrl] = useState("")
  const [showDialog, setShowDialog] = useState(false)

  const handleGithubImport = () => {
    if (!session) {
      toast.success("Redirecting to GitHub...")
      signIn("github", { callbackUrl: "/import" })
    }

    if (!session?.user?.isGithubUser) {
      setShowDialog(true)
    } else {
      router.push("/import")
    }
  }

  const handleConfirmGithub = () => {
    toast.success("Redirecting to GitHub...")
    signIn("github", { callbackUrl: "/import" })
  }

  const handleUrlSubmit2 = (e) => {
    e.preventDefault()
    if (!repoUrl.trim()) return
    router.push(`/analyze?repo=${encodeURIComponent(repoUrl.trim())}`)
  }

  const handleUrlSubmit = async (e) => {
        e.preventDefault()

      const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repoUrl: repoUrl.trim(),
        userId: session?.user?.id || null,
      })
    });

    const data = await response.json();

    if (data.success && data.jobId) {
      router.push(`/analyze/${data.jobId}`);
    } else {
      alert("Failed to start analysis");
    }
  }



  return (
    <section className="space-y-6 max-w-2xl mx-auto text-center">
      <h1 className="text-3xl font-bold">Analyze a GitHub Repository</h1>

      <form
        onSubmit={handleUrlSubmit}
        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
      >
        <Input
          type="text"
          placeholder="https://github.com/username/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          className="w-full sm:w-[420px]"
        />
        <Button type="submit">Analyze URL</Button>
      </form>

      <div className="relative">
        <div className="mt-4 text-muted-foreground">or</div>
        <Button onClick={handleGithubImport} className="mt-4">
          Import from GitHub
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch to GitHub Sign-In</DialogTitle>
            <DialogDescription>
              You're currently signed in with email. To import repositories from GitHub, you'll need to log in using your GitHub account.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmGithub}>Continue with GitHub</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}