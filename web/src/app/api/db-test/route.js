import pool from "@/lib/db"

export async function GET() {
  try {
    const result = await pool.query("SELECT NOW()")
    return Response.json({ success: true, time: result.rows[0].now })
  } catch (error) {
    console.error("DB connection error:", error)
    return new Response("Database error", { status: 500 })
  }
}