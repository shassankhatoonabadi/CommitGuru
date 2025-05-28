"use client"

import { useSession } from "next-auth/react"
import { useState } from "react"
import { toast } from "sonner"
import { RepoInput } from "@/components/RepoInput"

export default function Home() {
  const { data: session } = useSession()
  const [repoUrl, setRepoUrl] = useState("")
  
  const handleAnalyze = () => {
    if (!repoUrl.trim()) {
      toast.error("Please enter a repository URL.")
      return
    }
    console.log("Session hook value:", session)
    toast.success(`Analyzing: ${repoUrl}`)
  }

  return (
    <main className="relative min-h-screen w-full bg-background text-foreground flex flex-col items-center px-4 overflow-hidden">
      <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-pink-500 rounded-full blur-2xl opacity-10 pointer-events-none z-0" />
      <div className="absolute bottom-[-120px] right-[-100px] w-[300px] h-[300px] bg-teal-400 rounded-full blur-2xl opacity-10 pointer-events-none z-0" />
      <section className="z-10 text-center max-w-2xl pt-28 pb-12 space-y-6">
        <h1 className="text-5xl font-extrabold tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 dark:from-blue-300 dark:via-purple-300 dark:to-pink-300">
          Ask the Commit Guru
        </h1>
        <p className="text-muted-foreground text-lg">
          View automatically generated reports of your repository's commits. Anywhere.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <RepoInput />
        </div>
      </section>
    </main>
  )
}