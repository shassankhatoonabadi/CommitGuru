"use client"

import ThemeToggle from "@/components/ThemeToggle"
import LoaderSkeleton from "@/components/LoaderSkeleton"

export default function Home() {
  const isLoading = false;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white flex items-center justify-center px-6">
        <LoaderSkeleton />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white flex items-center justify-center px-6 relative">
      <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500/20 blur-3xl rounded-full -z-10" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-yellow-400/10 blur-2xl rounded-full -z-10" />

      {/* Dark mode toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tight">Commit Guru</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
            Commit Guru analyzes your repository and let you know how risky your team's changes have been over time.
        </p>
        <span className="inline-block mt-4 px-4 py-2 rounded-full text-sm bg-white/10 text-white backdrop-blur-md border border-white/10">
          Web App Initialized
        </span>
      </div>
    </main>
  )
}