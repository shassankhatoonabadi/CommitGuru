"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function AnalyzePage() {
  const searchParams = useSearchParams()
  const repo = searchParams.get("repo")
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!repo) return

    const fakeAnalyze = async () => {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ repo }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Unexpected error")

        setSuccess(true)
        setLoading(false)

      } catch (err) {
        setError(err.message || "Failed to queue repository.")
        setLoading(false)
      }
    }

    fakeAnalyze()
  }, [repo, router])

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-xl w-full text-center space-y-4">
        <h1 className="text-2xl font-bold">Analyzing Repository</h1>
        <p className="text-muted-foreground text-sm">{repo}</p>

        <div className="mt-6 text-lg">
          {error && <p className="text-red-500">X {error}</p>}
          {loading && <p>Adding repository to analysis queue...</p>}
          {success && <p className="text-green-600">Repository added to queue! Redirecting...</p>}
        </div>
      </div>
    </main>
  )
}