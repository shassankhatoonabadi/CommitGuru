"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Shield, ShieldCheck } from "lucide-react";
import { STATUS_COLORS, cls } from "./utils";

export default function RepoList({ loading, error, repos, analyze, fmtDate }) {
  if (loading) {
    return (
      <div className="mt-5 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 w-full rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mt-5 p-6">
        <p className="text-rose-600">{error}</p>
      </Card>
    );
  }

  if (repos.length === 0) {
    return (
      <Card className="mt-5 p-8">
        <p className="text-muted-foreground text-sm">
          No repositories found. Try adjusting filters or importing one.
        </p>
      </Card>
    );
  }

  return (
    <div className="mt-5">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="p-3 w-[38%]">Repository</th>
              <th className="p-3">Visibility</th>
              <th className="p-3">Latest Job</th>
              <th className="p-3">Last Activity</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {repos.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">
                  <div className="flex flex-col">
                    <Link href={`/repo/${r.id}`} className="font-medium hover:underline">
                      {r.name}
                    </Link>
                    <span className="text-xs text-muted-foreground break-all">{r.url}</span>
                  </div>
                </td>
                <td className="p-3">
                  <Badge variant="outline" className="gap-1">
                    {r.is_public ? <ShieldCheck className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                    {r.is_public ? "Public" : "Private"}
                  </Badge>
                </td>
                <td className="p-3">
                  {r.latest_job ? (
                    <div className="flex flex-col">
                      <div
                        className={cls(
                          "inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
                          STATUS_COLORS[r.latest_job.status] || "bg-muted text-muted-foreground"
                        )}
                      >
                        {r.latest_job.status.replace("_", " ")}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {r.latest_job.step || "—"}
                        {r.latest_job.error ? ` • ${r.latest_job.error}` : ""}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No jobs yet</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="text-xs">
                    <div>Created: {fmtDate(r.created_at)}</div>
                    <div>Ingested: {fmtDate(r.ingested_at)}</div>
                    <div>
                      Latest:{" "}
                      {r.latest_job?.updated_at
                        ? fmtDate(r.latest_job.updated_at)
                        : r.latest_job?.created_at
                        ? fmtDate(r.latest_job.created_at)
                        : "—"}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/repo/${r.id}`}>Open</Link>
                    </Button>
                    <Button
                      size="sm"
                      disabled
                      onClick={() => {
                        toast.error("Analysis is temporarily disabled.");
                      }}
                    >
                      <Play className="h-4 w-4 mr-1 opacity-50" /> Analyze
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden grid gap-3">
        {repos.map((r) => (
          <Card key={r.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/repo/${r.id}`} className="font-medium hover:underline break-words">
                    {r.name}
                  </Link>
                  <div className="text-xs text-muted-foreground break-words">{r.url}</div>
                </div>
                <Badge variant="outline" className="shrink-0 gap-1">
                  {r.is_public ? <ShieldCheck className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                  {r.is_public ? "Public" : "Private"}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div
                  className={cls(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
                    STATUS_COLORS[r.latest_job?.status || "none"]
                  )}
                >
                  {r.latest_job ? r.latest_job.status.replace("_", " ") : "no jobs"}
                </div>
                <span className="text-xs text-muted-foreground">
                  {r.latest_job?.step || "—"}
                  {r.latest_job?.error ? ` • ${r.latest_job.error}` : ""}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>Created: {fmtDate(r.created_at)}</div>
                <div>Ingested: {fmtDate(r.ingested_at)}</div>
                <div className="col-span-2">
                  Latest:{" "}
                  {r.latest_job?.updated_at
                    ? fmtDate(r.latest_job.updated_at)
                    : r.latest_job?.created_at
                    ? fmtDate(r.latest_job.created_at)
                    : "—"}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`/repo/${r.id}`}>Open</a>
                </Button>
                <Button
                  size="sm"
                  disabled
                  onClick={() => {
                    toast.error("Analysis is temporarily disabled.");
                  }}
                >
                  <Play className="h-4 w-4 mr-1 opacity-50" /> Analyze
                </Button>

              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
