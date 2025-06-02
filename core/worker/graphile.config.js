const { WorkerPreset } = require("graphile-worker");

const preset = {
  extends: [WorkerPreset],
  worker: {
    taskDirectory: `./tasks`,
    connectionString: process.env.DATABASE_URL,
  },
};

module.exports = preset;