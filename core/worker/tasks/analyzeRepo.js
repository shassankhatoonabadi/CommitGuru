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
    const subprocess = execFile("python3", [scriptPath, ...args], (error, stdout, stderr) => {
      if (error) {
        reject(stderr || error.message);
      } else {
        resolve(stdout);
      }
    });
  });
}

module.exports = async (payload) => {
  const { jobId, repoUrl } = payload;
  const repoName = path.basename(repoUrl, ".git");
  const targetDir = path.join("repos", repoName);

  try {
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }

    await update(jobId, "Cloning repository", "in_progress", `Running clone.py for ${repoUrl}`);
    await runPython("../ingestion/clone.py", ["-u", repoUrl, "-d", targetDir]);
    console.log(`Repository cloned to ${targetDir}`);

    // await update(jobId, "Extracting commits", "in_progress", "Running extract_commits.py");
    // await runPython("core/ingestion/extract_commits.py", ["--repo", targetDir]);

    // await update(jobId, "Classifying commits", "in_progress", "Running classify_commits.py");
    // await runPython("core/analysis/classify_commits.py", ["--repo", targetDir]);

    // await update(jobId, "Computing metrics", "in_progress", "Running compute_metrics.py");
    // await runPython("core/analysis/compute_metrics.py", ["--repo", targetDir]);

    // await update(jobId, "Linking bugs", "in_progress", "Running link_commits.py");
    // await runPython("core/analysis/link_commits.py", ["--repo", targetDir]);

    await markDone(jobId);
    console.log(`Job ${jobId} completed successfully.`);
  } catch (err) {
    await markError(jobId, err.toString());
    console.error(`Job ${jobId} failed:`, err);
  }
};