// app/api/repos/route.js
import { NextResponse } from "next/server";
import { Pool } from "pg";

/**
 * Lightweight pool bootstrap (no external imports needed).
 * Uses a global so dev hot-reload doesn't create multiple pools.
 */
const pool =
  globalThis.__PG_POOL__ ||
  (globalThis.__PG_POOL__ = new Pool({
    connectionString: process.env.DATABASE_URL,
    // ssl: { rejectUnauthorized: false }, // enable if your PG needs SSL
  }));

/** ---------- helpers ---------- */
const SORTS = {
  name: "r.name",
  created: "r.created_at",
  ingested: "r.ingested_at",
  last_job: "COALESCE(latest.updated_at, latest.created_at, r.ingested_at, r.created_at)",
};

function toInt(v, def) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function boolParam(v) {
  if (v === "true") return true;
  if (v === "false") return false;
  return null;
}
function csvEscape(s) {
  if (s == null) return "";
  const str = String(s);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  // Basic inputs
  const q = (searchParams.get("q") || "").trim();
  const page = clamp(toInt(searchParams.get("page"), 1), 1, 1e6);
  const pageSize = clamp(toInt(searchParams.get("pageSize"), 20), 1, 100);
  const offset = (page - 1) * pageSize;

  const sortKey = (searchParams.get("sort") || "last_job").toLowerCase();
  const order = (searchParams.get("order") || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";
  const sortExpr = SORTS[sortKey] || SORTS.last_job;

  const visibility = (searchParams.get("visibility") || "all").toLowerCase(); // public|private|all
  const status = searchParams.get("status"); // latest job status
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const owner = (searchParams.get("owner") || "all").toLowerCase(); // me|all
  const format = (searchParams.get("format") || "json").toLowerCase(); // json|csv

  // Optional user scoping via header for "owner=me"
  const userId = req.headers.get("x-user-id") || process.env.DEMO_USER_ID || null;

  // Build filters
  const values = [];
  const where = [];

  if (owner === "me") {
    if (!userId) return NextResponse.json({ error: "Unauthorized (missing x-user-id)" }, { status: 401 });
    values.push(userId);
    where.push(`r.user_id = $${values.length}`);
  }

  if (q) {
    values.push(`%${q}%`);
    const idx = `$${values.length}`;
    where.push(`(r.name ILIKE ${idx} OR r.url ILIKE ${idx})`);
  }

  if (visibility === "public") where.push(`r.is_public = TRUE`);
  else if (visibility === "private") where.push(`r.is_public = FALSE`);

  if (status) {
    values.push(status);
    where.push(`latest.status = $${values.length}`);
  }

  if (dateFrom) {
    values.push(dateFrom);
    where.push(`r.created_at >= $${values.length}`);
  }
  if (dateTo) {
    values.push(dateTo);
    where.push(`r.created_at <= $${values.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // Base FROM + LATERAL latest job
  const BASE_FROM = `
    FROM repositories r
    LEFT JOIN LATERAL (
      SELECT j.id AS job_id, j.status, j.step, j.error, j.created_at, j.updated_at
      FROM jobs j
      WHERE j.repository_id = r.id
      ORDER BY j.created_at DESC
      LIMIT 1
    ) latest ON TRUE
  `;

  // Queries
  const countSql = `SELECT COUNT(*)::int AS total ${BASE_FROM} ${whereSql}`;
  const listSql = `
    SELECT
      r.id, r.user_id, r.name, r.url, r.is_public, r.created_at, r.ingested_at,
      latest.job_id, latest.status AS latest_status, latest.step AS latest_step,
      latest.error AS latest_error, latest.created_at AS latest_created_at, latest.updated_at AS latest_updated_at
    ${BASE_FROM}
    ${whereSql}
    ORDER BY ${sortExpr} ${order}, r.id ASC
    LIMIT $${values.push(pageSize)} OFFSET $${values.push(offset)}
  `;
  const facetsSql = `
    SELECT
      COALESCE(latest.status, 'none') AS status,
      COUNT(*)::int AS count
    ${BASE_FROM}
    ${whereSql}
    GROUP BY COALESCE(latest.status, 'none')
  `;
  const visibilitySql = `
    SELECT
      CASE WHEN r.is_public THEN 'public' ELSE 'private' END AS visibility,
      COUNT(*)::int AS count
    ${BASE_FROM}
    ${whereSql}
    GROUP BY CASE WHEN r.is_public THEN 'public' ELSE 'private' END
  `;

  try {
    const client = await pool.connect();
    try {
      const baseValues = values.slice(0, values.length - 2); // for queries without LIMIT/OFFSET
      const [countRes, listRes, facetRes, visRes] = await Promise.all([
        client.query(countSql, baseValues),
        client.query(listSql, values),
        client.query(facetsSql, baseValues),
        client.query(visibilitySql, baseValues),
      ]);

      const total = countRes.rows[0]?.total || 0;
      const pages = Math.max(1, Math.ceil(total / pageSize));

      const rows = listRes.rows.map(r => ({
        id: r.id,
        user_id: r.user_id,
        name: r.name,
        url: r.url,
        is_public: r.is_public,
        created_at: r.created_at,
        ingested_at: r.ingested_at,
        latest_job: r.job_id
          ? {
              id: r.job_id,
              status: r.latest_status,
              step: r.latest_step,
              error: r.latest_error,
              created_at: r.latest_created_at,
              updated_at: r.latest_updated_at,
            }
          : null,
      }));

      if (format === "csv") {
        // Minimal CSV export (current page only)
        const header = [
          "id",
          "user_id",
          "name",
          "url",
          "is_public",
          "created_at",
          "ingested_at",
          "latest_job_id",
          "latest_status",
          "latest_step",
          "latest_error",
          "latest_created_at",
          "latest_updated_at",
        ].join(",");

        const body = listRes.rows
          .map(r =>
            [
              r.id,
              r.user_id,
              r.name,
              r.url,
              r.is_public,
              r.created_at,
              r.ingested_at,
              r.job_id,
              r.latest_status,
              r.latest_step,
              r.latest_error,
              r.latest_created_at,
              r.latest_updated_at,
            ]
              .map(csvEscape)
              .join(",")
          )
          .join("\n");

        const csv = `${header}\n${body}`;
        return new Response(csv, {
          status: 200,
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="repos_page_${page}.csv"`,
            "Cache-Control": "no-store",
          },
        });
      }

      return NextResponse.json(
        {
          repos: rows,
          meta: { page, pageSize, total, pages, sort: sortKey, order },
          facets: {
            status: Object.fromEntries(facetRes.rows.map(r => [r.status, r.count])),
            visibility: Object.fromEntries(visRes.rows.map(r => [r.visibility, r.count])),
          },
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("GET /api/repos error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
