import { NextResponse } from "next/server";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import { makeWorkerUtils } from "graphile-worker";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(req) {
  const { userId, repoUrl } = await req.json();

  console.log("request body:", req.body);
  const repoRes = await pool.query("SELECT id FROM repositories WHERE url = $1", [repoUrl]);
  let repoId;
  if (repoRes.rows.length > 0) {
    console.log("Repository already exists, using existing ID");
    const existingRepoLink = `https://github.com/${userId}/${repoUrl}`;
    return NextResponse.json({ success: true, jobId: uuidv4(), existingRepoLink });
  } else {
    const repoName = repoUrl.split("/").pop().replace(".git", "");
    const insertRepo = await pool.query(
      `INSERT INTO repositories (user_id, name, url, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id`,
      [userId, repoName, repoUrl]
    );
    repoId = insertRepo.rows[0].id;
  }

  const jobId = uuidv4();
  await pool.query(
    `INSERT INTO jobs (id, user_id, repository_id, status, created_at, updated_at)
     VALUES ($1, $2, $3, 'queued', NOW(), NOW())`,
    [jobId, userId, repoId]
  );

  const workerUtils = await makeWorkerUtils({ pgPool: pool });

  await workerUtils.addJob("analyzeRepo", {
    jobId,
    repoId,
    repoUrl,
    userId
  });

  return NextResponse.json({ success: true, jobId });
}