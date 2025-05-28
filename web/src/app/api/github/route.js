// Route to fetch all GitHub repositories for the authenticated user

import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import { getUserById, getImportedRepoUrls } from "@/lib/db"
import { Octokit } from "@octokit/core"

export async function GET(req) {
  const token = await getToken({ req })

  if (!token || !token.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await getUserById(token.id)

  if (!user || !user.github_access_token) {
    return NextResponse.json({ error: "GitHub token not found" }, { status: 403 })
  }

  try {
    const octokit = new Octokit({
      auth: user.github_access_token,
    })

    const response = await octokit.request("GET /user/repos", {
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })

    const githubRepos = response.data

    const importedUrls = await getImportedRepoUrls()
    const importedSet = new Set(importedUrls)

    const enrichedRepos = githubRepos.map((repo) => {
      const url = `https://github.com/${repo.full_name}`
      return {
        ...repo,
        isImported: importedSet.has(url),
      }
    })

    return NextResponse.json(enrichedRepos)
  } catch (error) {
    console.error("GitHub API Error:", error)
    const status = error.status || 500
    const message = error.message || "GitHub API request failed"
    return NextResponse.json({ error: message }, { status })
  }
}