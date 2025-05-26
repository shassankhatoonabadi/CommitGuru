import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import { getUserById } from "@/lib/db"

export async function POST(req) {
  try {
    const token = await getToken({ req })
    if (!token?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { repo } = await req.json()
    if (!repo) {
      return NextResponse.json({ error: "Repository is required." }, { status: 400 })
    }

    const user = await getUserById(token.id)
    if (!user?.github_access_token) {
      return NextResponse.json({ error: "GitHub token not found." }, { status: 403 })
    }

    console.log(`equest received to analyze: ${repo}`)

    return NextResponse.json({
      success: true,
      message: "Repository analysis started (stub).",
    })
  } catch (err) {
    console.error("Error in /api/analyze:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}