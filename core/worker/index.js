const { run } = require("graphile-worker");
const { Pool } = require("pg");
const preset = require("./graphile.config");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const runner = await run({ pgPool: pool, preset });
  await runner.promise;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});