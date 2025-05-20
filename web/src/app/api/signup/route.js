import { createUser, getUserByEmail, getUserByUsername } from "@/lib/users/db"

export async function POST(req) {
  const body = await req.json()
  const { username, email, password } = body

  if (!username || !email || !password) {
    return new Response(JSON.stringify({ message: "All fields are required" }), { status: 400 })
  }

  const existingEmail = await getUserByEmail(email)
  const existingUsername = await getUserByUsername(username)

  if (existingEmail) {
    return new Response(JSON.stringify({ message: "Email already in use" }), { status: 400 })
  }

  if (existingUsername) {
    return new Response(JSON.stringify({ message: "Username already taken" }), { status: 400 })
  }

  const user = await createUser({ username, email, password })

  return new Response(JSON.stringify({ user }), { status: 201 })
}
