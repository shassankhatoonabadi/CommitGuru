"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp, Star, GitBranch, Eye } from "lucide-react"
import { useSession } from "next-auth/react"

export default function ImportPage() {
  const [repos, setRepos] = useState([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [expandedRepos, setExpandedRepos] = useState(new Set())
  const router = useRouter()
  const { data: session } = useSession();

  useEffect(() => {
    const fetchRepos = async () => {
      setLoading(true)
      const res = await fetch("/api/github")
      const data = await res.json()
      setRepos(data)
      setLoading(false)
    }

    fetchRepos()
  }, [])

  const handleAnalyze = async (repo) => {
    if (repo.isImported) return;

    const userId = session?.user?.id;

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        repoUrl: `https://github.com/${repo.full_name}.git`
      })
    });

    const data = await response.json();

    if (data.success && data.jobId) {
      router.push(`/analyze/${data.jobId}`);
    } else {
      alert("Failed to start analysis");
    }
  };
  

  const toggleInfo = (repoId) => {
    const newSet = new Set(expandedRepos)
    newSet.has(repoId) ? newSet.delete(repoId) : newSet.add(repoId)
    setExpandedRepos(newSet)
  }

  const filtered = Array.isArray(repos)
    ? repos.filter((repo) =>
      repo.full_name.toLowerCase().includes(search.toLowerCase())
    )
    : []


  return (
    <main className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      <h1 className="text-3xl font-semibold text-center">Select a GitHub Repository</h1>

      <Input
        placeholder="Search repositories..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-md"
      />

      {loading && <p className="text-center text-muted-foreground">Loading repositories...</p>}

      {!loading && filtered.length === 0 && (
        <p className="text-center text-muted-foreground">No repositories found.</p>
      )}

      <ul className="space-y-4">
        {filtered.map((repo) => (
          <li
            key={repo.id}
            className="border rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition"
          >
            <div
              className="flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              onClick={() => toggleInfo(repo.id)}
            >
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-medium">{repo.full_name}</p>
                  {repo.isImported && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Imported</span>
                  )}
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                    {repo.private ? "Private" : "Public"}
                  </span>
                  {repo.language && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                      {repo.language}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {repo.description || "No description"}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                <Button
                  size="sm"
                  disabled={repo.isImported}
                  variant={repo.isImported ? "outline" : "default"}
                  onClick={() => handleAnalyze(repo)}
                  className="w-full sm:w-auto"
                >
                  {repo.isImported ? "Imported" : "Analyze"}
                </Button>
                <button
                  onClick={() => toggleInfo(repo.id)}
                  className="p-2 rounded hover:bg-accent text-muted-foreground transition"
                  title="Toggle Info"
                >
                  {expandedRepos.has(repo.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
            </div>

            {expandedRepos.has(repo.id) && (
              <div className="mt-3 border-t pt-3 text-sm text-muted-foreground space-y-1">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="flex items-center gap-1"><Star size={14} /> {repo.stargazers_count}</span>
                  <span className="flex items-center gap-1"><GitBranch size={14} /> {repo.forks_count}</span>
                  <span className="flex items-center gap-1"><Eye size={14} /> {repo.watchers_count}</span>
                </div>
                <p><strong>Default Branch:</strong> {repo.default_branch}</p>
                <p><strong>Updated:</strong> {new Date(repo.updated_at).toLocaleDateString()}</p>
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-600"
                >
                  View on GitHub ↗
                </a>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}