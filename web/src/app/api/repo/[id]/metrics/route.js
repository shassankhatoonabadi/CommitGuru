// app/api/repo/[id]/analytics/route.ts
import { Pool } from "pg";
import { NextResponse } from "next/server";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(_, { params }) {
  const repoId = params.id;

  const query = `
    SELECT 
      COUNT(*) AS total_commits,
      COUNT(*) FILTER (WHERE c.contains_bug) AS bug_commits,
      AVG(m.age) AS avg_age,
      AVG(m.entropy) AS avg_entropy,
      AVG(m.ndev) AS avg_ndev,
      AVG(m.la) AS avg_la,
      AVG(m.ld) AS avg_ld,
      AVG(m.nf) AS avg_nf,
      AVG(m.nd) AS avg_nd,
      AVG(m.ns) AS avg_ns,
      AVG(m.nuc) AS avg_nuc,
      AVG(m.exp) AS avg_exp,
      AVG(m.rexp) AS avg_rexp,
      AVG(m.sexp) AS avg_sexp,
      AVG(m.glm_probability) AS avg_glm
    FROM commits c
    JOIN metrics m ON c.id = m.commit_id
    WHERE c.repository_id = $1
  `;

  const result = await pool.query(query, [repoId]);
  console.log("Result:", result.rows[0]);
  return NextResponse.json(result.rows[0]);
}