const { run } = require("graphile-worker");
const { Pool } = require("pg");
const preset = require("./graphile.config");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 2000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function waitForDatabase(retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await pool.connect();
      await client.query("SELECT 1");
      client.release();
      console.log("[core] Database is ready");
      return;
    } catch (err) {
      console.warn(`[core] Waiting for database... attempt ${attempt}`);
      if (attempt === retries) {
        throw new Error("Database did not become ready in time.");
      }
      await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
    }
  }
}

async function main() {
  await waitForDatabase();
  const runner = await run({ pgPool: pool, preset });
  await runner.promise;
}

main().catch((err) => {
  console.error("[core] catal error:", err);
  process.exit(1);
});
