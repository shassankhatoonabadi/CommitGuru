import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) return new Response("Missing jobId", { status: 400 });

  const client = await pool.connect();
  await client.query("LISTEN job_updates");

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const onNotify = (msg) => {
        const payload = JSON.parse(msg.payload);
        if (payload.id === jobId) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
          );

          if (["completed", "error"].includes(payload.status)) {
            client.query("UNLISTEN job_updates");
            client.removeListener("notification", onNotify);
            controller.close();
            client.release();
          }
        }
      };

      client.on("notification", onNotify);
    },
    cancel() {
      client.query("UNLISTEN job_updates").catch(() => {});
      client.release();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
}