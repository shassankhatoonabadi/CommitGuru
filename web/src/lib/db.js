import { Pool } from "pg"
import bcrypt from "bcryptjs"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function getUserByEmail(email) {
  const res = await pool.query("SELECT * FROM users WHERE email = $1", [email])
  return res.rows[0] || null
}

export async function getUserByUsername(username) {
  const res = await pool.query("SELECT * FROM users WHERE username = $1", [username])
  return res.rows[0] || null
}

export async function createUser({ username, email, password }) {
  const hashedPassword = await bcrypt.hash(password, 10)
  const res = await pool.query(
    `INSERT INTO users (username, email, hashed_password)
     VALUES ($1, $2, $3)
     RETURNING id, email, username`,
    [username, email, hashedPassword]
  )
  return res.rows[0]
}

export async function getUserByGithubId(githubId) {
  const res = await pool.query("SELECT * FROM users WHERE github_id = $1", [githubId])
  return res.rows[0] || null
}

export async function createGithubUser({ github_id, github_email, github_username, github_avatar_url, github_access_token, hashedPassword }) {
  const res = await pool.query(
    `INSERT INTO users (username, email, github_id, github_username, github_avatar_url, github_access_token, hashed_password)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, email, username`,
    [github_username, github_email, github_id, github_username, github_avatar_url, github_access_token, hashedPassword]
  )
  return res.rows[0]
}

export async function updateGithubUser({ github_id, github_access_token, github_username, github_avatar_url }) {
  const res = await pool.query(
    `
    UPDATE users
    SET 
      github_access_token = $1,
      github_username = $2,
      github_avatar_url = $3
    WHERE github_id = $4
    RETURNING id, email, username
    `,
    [github_access_token, github_username, github_avatar_url, github_id]
  )

  return res.rows[0] || null
}

export async function getUserById(id) {
  const res = await pool.query("SELECT * FROM users WHERE id = $1", [id])
  return res.rows[0] || null
}

export async function getImportedRepoUrls() {
  const res = await pool.query("SELECT url FROM repositories")
  return res.rows.map((row) => row.url)
}