const { Pool } = require("pg");
const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function update(jobId, step, status = "in_progress", log = "") {
  await pool.query(
    "UPDATE jobs SET step = $1, status = $2, log = $3, updated_at = NOW() WHERE id = $4",
    [step, status, log, jobId]
  );
}

async function markDone(jobId) {
  await pool.query(
    "UPDATE jobs SET status = 'completed', step = 'done', updated_at = NOW() WHERE id = $1",
    [jobId]
  );
}

async function markError(jobId, message) {
  await pool.query(
    "UPDATE jobs SET status = 'error', error = $1, updated_at = NOW() WHERE id = $2",
    [message, jobId]
  );
}

function runPython(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    execFile("python3", [scriptPath, ...args], { maxBuffer: 1024 * 1024 * 100 }, (error, stdout, stderr) => {
      if (error) {
        reject(stderr || error.message);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function storeCommits(commits, repoId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const insertQuery = `
      INSERT INTO commits (
        repository_id, hash, author_name, author_email, authored_date,
        committer_name, committer_email, committed_date, message,
        classification, is_merged, created_at, contains_bug
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, NOW(), FALSE
      ) ON CONFLICT (hash) DO NOTHING
    `;

    for (const c of commits) {
      await client.query(insertQuery, [
        repoId,
        c.hash,
        c.author_name,
        c.author_email,
        c.authored_date,
        c.committer_name,
        c.committer_email,
        c.committed_date,
        c.message,
        c.classification || "None",
        c.is_merge || false
      ]);
    }

    await client.query("COMMIT");
    return `${commits.length} commits inserted`;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function updateBugLinks(linked) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const l of linked) {
      await client.query(
        `UPDATE commits SET fixes = $1, is_linked = true WHERE hash = $2`,
        [JSON.stringify(l.linked_to), l.buggy_commit]  // ✅ matches Python output
      );
      for (const bug of l.linked_to) {
        await client.query(
          `UPDATE commits SET contains_bug = true WHERE hash = $1`,
          [bug]
        );
      }
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function updateMetrics(metrics) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const m of metrics) {
      await client.query(`
        INSERT INTO metrics (
          commit_id, ns, nd, nf, entropy, la, ld, lt,
          ndev, age, nuc, exp, rexp, sexp, computed_at
        ) VALUES (
          (SELECT id FROM commits WHERE hash = $1),
          $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, NOW()
        )
        ON CONFLICT (commit_id) DO UPDATE SET
          ns = EXCLUDED.ns,
          nd = EXCLUDED.nd,
          nf = EXCLUDED.nf,
          entropy = EXCLUDED.entropy,
          la = EXCLUDED.la,
          ld = EXCLUDED.ld,
          lt = EXCLUDED.lt,
          ndev = EXCLUDED.ndev,
          age = EXCLUDED.age,
          nuc = EXCLUDED.nuc,
          exp = EXCLUDED.exp,
          rexp = EXCLUDED.rexp,
          sexp = EXCLUDED.sexp,
          computed_at = NOW();
      `, [
        m.hash, m.ns, m.nd, m.nf, m.entropy,
        m.la, m.ld, m.lt, m.ndev,
        m.age, m.nuc, m.exp, m.rexp, m.sexp
      ]);
    }

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

module.exports = async (payload) => {
  const { jobId, repoUrl, repoId, token } = payload;
  const repoName = path.basename(repoUrl, ".git");
  const targetDir = path.join("repos", repoName);

  try {
    // 1. Clone repository
    await update(jobId, "Cloning repository");
    const branch = null; // null for now, can be set to a specific branch later based on user input
    const cloneArgs = ["-u", repoUrl, "-d", "repos"];
    if (branch !== null && branch !== undefined) {
      console.log(`Cloning branch: ${branch}`);
      cloneArgs.push("-b", branch);
    }
    if (token) {
      cloneArgs.push("-t", token);
    }
    const cloneResultRaw = await runPython("../ingestion/clone.py", cloneArgs);

    // // 2. Extract and classify commits
    await update(jobId, "Extracting and classifying commits");
    const extractRaw = await runPython("../analysis/classify_commits.py", ["-p", targetDir]);
    const extracted = JSON.parse(extractRaw);
    if (extracted.status !== "success") throw new Error("Extract failed");
    // console.log("Corrective commits:", extracted.corrective_commits);
    await storeCommits(extracted.commits, repoId);

    // // 3. Link bug-inducing commits
    await update(jobId, "Linking bug-inducing commits");
    const correctivePath = path.join(targetDir, "corrective.json");
    fs.writeFileSync(correctivePath, JSON.stringify(extracted.corrective_commits, null, 2));
    const linkRaw = await runPython("../analysis/link_commits.py", [targetDir, "--corrective", targetDir + "/corrective.json"]);
    const linked = JSON.parse(linkRaw);
    console.log("Linked commits:", linked);
    await updateBugLinks(linked);

    // 4. Compute metrics
    await update(jobId, "Computing metrics");
    const metricsRaw = await runPython("../analysis/compute_metrics.py", ["-p", targetDir]);
    const metricsOutput = JSON.parse(metricsRaw);

    // Convert and format each entry for DB insert
    const parsedMetrics = metricsOutput.map((entry) => ({
      hash: entry.commit_hash,
      ns: entry.stats.ns || 0,
      nd: entry.stats.nd || 0,
      nf: entry.stats.nf || 0,
      entropy: entry.stats.entropy || 0,
      la: entry.stats.la || 0,
      ld: entry.stats.ld || 0,
      lt: entry.stats.lt || 0,
      ndev: entry.stats.ndev || 0,
      age: entry.stats.age || 0,
      nuc: entry.stats.nuc || 0,
      exp: entry.stats.exp || 0,
      rexp: entry.stats.rexp || 0,  // optional
      sexp: entry.stats.sexp || 0   // optional
    }));

    await updateMetrics(parsedMetrics);

    // Print metrics
    console.log("Metrics computed and stored:", parsedMetrics);


    // 5. Done
    await markDone(jobId);
    console.log(`Job ${jobId} completed successfully.`);
  } catch (err) {
    await markError(jobId, err.toString());
    console.error(`Job ${jobId} failed:`, err);
  }
};