import { NextResponse } from "next/server";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(req, { params }) {
  const { id: repoId } = params;
  const { searchParams } = new URL(req.url);

  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const size = Math.min(Math.max(parseInt(searchParams.get("size") || "20", 10), 1), 100);
  const offset = (page - 1) * size;

  const author = searchParams.get("author") || null;
  let classification = searchParams.get("classification") || null;
  const startDate = searchParams.get("startDate") || null;
  const endDate   = searchParams.get("endDate") || null;
  const search    = searchParams.get("search") || null;

  if (classification === "all") classification = null;

  try {
    const repoInfoSql = `
      SELECT r.id, r.name, r.url
      FROM repositories r
      WHERE r.id = $1
      LIMIT 1
    `;
    const repoInfoRes = await pool.query(repoInfoSql, [repoId]);
    const repo = {
      id: repoInfoRes.rows?.[0]?.id || repoId,
      name: repoInfoRes.rows?.[0]?.name || "Repository",
      url:  repoInfoRes.rows?.[0]?.url  || "",
    };

    const commitsSql = `
      SELECT 
        c.id,
        c.hash,
        LEFT(c.hash, 7) AS sha7,
        c.author_name,
        c.author_email,
        c.authored_date,
        c.committer_name,
        c.committer_email,
        c.committed_date,
        c.message,
        c.classification,
        c.contains_bug,
        c.fixes,               -- jsonb
        m.ns, m.nd, m.nf, m.entropy, m.la, m.ld, m.lt, 
        m.ndev, m.age, m.nuc, m.exp, m.rexp, m.sexp,
        m.hot_files            -- text[]
      FROM commits c
      LEFT JOIN metrics m ON m.commit_id = c.id
      WHERE c.repository_id = $1
        AND ($2::text IS NULL OR c.author_name ILIKE '%' || $2 || '%')
        AND ($3::text IS NULL OR c.classification = $3)
        AND ($4::timestamp IS NULL OR c.authored_date >= $4::timestamp)
        AND ($5::timestamp IS NULL OR c.authored_date <= $5::timestamp)
        AND (
          $6::text IS NULL OR 
          c.message ILIKE '%' || $6 || '%' OR 
          c.hash    ILIKE '%' || $6 || '%'
        )
      ORDER BY COALESCE(c.authored_date, c.committed_date) DESC NULLS LAST
      LIMIT $7 OFFSET $8
    `;
    const commitsVals = [repoId, author, classification, startDate, endDate, search, size, offset];
    const commitsRes = await pool.query(commitsSql, commitsVals);

    const countSql = `
      SELECT COUNT(*) AS total
      FROM commits c
      WHERE c.repository_id = $1
        AND ($2::text IS NULL OR c.author_name ILIKE '%' || $2 || '%')
        AND ($3::text IS NULL OR c.classification = $3)
        AND ($4::timestamp IS NULL OR c.authored_date >= $4::timestamp)
        AND ($5::timestamp IS NULL OR c.authored_date <= $5::timestamp)
        AND (
          $6::text IS NULL OR 
          c.message ILIKE '%' || $6 || '%' OR 
          c.hash    ILIKE '%' || $6 || '%'
        )
    `;
    const total = parseInt(
      (await pool.query(countSql, [repoId, author, classification, startDate, endDate, search]))
        .rows?.[0]?.total || "0",
      10
    );

    return NextResponse.json({
      repo,
      commits: commitsRes.rows ?? [],
      pagination: { page, size, total, totalPages: Math.ceil(total / size) },
    });
  } catch (error) {
    console.error("[API /repo/:id/metrics] error", error);
    return NextResponse.json({ error: "Failed to fetch repository metrics/commits" }, { status: 500 });
  }
}