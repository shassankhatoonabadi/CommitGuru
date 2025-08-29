"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, Copy, ExternalLink, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const sha7 = (h) => (h || "").slice(0, 7);
function ordinal(n){ const s=["th","st","nd","rd"],v=n%100; return s[(v-20)%10]||s[v]||s[0]; }
function formatFullDate(iso){
  if (!iso) return "—";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime()) || d.getTime() <= 0) return "—";
  const month = d.toLocaleString(undefined, { month: "long" });
  const day = d.getDate();
  const year = d.getFullYear();
  const time = d.toLocaleString(undefined, { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
  return `${month} ${day}${ordinal(day)} ${year}, ${time}`;
}
function nameFromEmail(email){
  if(!email) return null;
  const local = email.split("@")[0] || "";
  if(!local) return null;
  return local.replace(/[._-]+/g," ").replace(/\b\w/g,(c)=>c.toUpperCase());
}
function authorDisplay(c){
  return c.author_name || c.committer_name || nameFromEmail(c.author_email) || nameFromEmail(c.committer_email) || "Unknown author";
}
function titleCase(s){ if(!s) return s; return s.replace(/\w\S*/g,(t)=>t[0].toUpperCase()+t.slice(1).toLowerCase()); }

function Metric({ label, value, fixed }) {
  const show = typeof value === "number" ? (fixed ? Number(value).toFixed(fixed) : value) : value ?? "—";
  return (
    <div className="bg-muted/40 rounded-md p-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="font-semibold text-sm">{show}</div>
    </div>
  );
}
function MetricGroup({ title, children }) {
  return (
    <section className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 bg-card border rounded-xl p-3">
      <h3 className="col-span-2 sm:col-span-4 text-[11px] tracking-wide uppercase text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

export default function CommitItem({ commit }) {
  const [open, setOpen] = useState(false);
  const isBuggy = Array.isArray(commit.fixes) && commit.fixes.length > 0;
  const authoredOrCommitted = commit.authored_date || commit.committed_date;

  const totals = useMemo(() => ({
    totalDelta: (commit.la || 0) + (commit.ld || 0),
  }), [commit.la, commit.ld]);

  return (
    <Card className={`rounded-xl border hover:shadow-sm transition ${isBuggy ? "ring-1 ring-red-500/40" : ""}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full text-left px-4 sm:px-5 py-3 sm:py-4 flex items-start justify-between rounded-t-xl ${
          isBuggy ? "bg-red-50/80 dark:bg-red-950/25" : "bg-muted/30"
        }`}
      >
        <div className="min-w-0 pr-3">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="secondary" className="shrink-0">
              {commit.classification ? titleCase(commit.classification) : "Unclassified"}
            </Badge>
            <span className="font-mono text-xs sm:text-[13px] shrink-0">{sha7(commit.hash)}</span>
            <span className="italic truncate">{commit.message || "(no message)"}</span>
          </div>
          <div className="mt-1 text-[11px] sm:text-xs text-muted-foreground">
            {authorDisplay(commit)} on {formatFullDate(authoredOrCommitted)}
            {isBuggy && (
              <span className="ml-2 inline-flex items-center gap-1 text-red-700 dark:text-red-300">
                <AlertTriangle className="h-3.5 w-3.5" /> Buggy
              </span>
            )}
          </div>
        </div>
        <div className="ml-3 shrink-0">{open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}</div>
      </button>

      {open && (
        <CardContent className="p-4 sm:p-5 space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(commit.hash)}>
              <Copy className="h-4 w-4 mr-1" /> Copy hash
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://github.com/search?q=${encodeURIComponent(commit.hash)}&type=commits`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-1" /> Open on GitHub
              </a>
            </Button>
          </div>

          <div className="grid gap-3 sm:gap-4 lg:gap-6">
            <MetricGroup title="Size">
              <Metric label="Lines added" value={commit.la} />
              <Metric label="Lines deleted" value={commit.ld} />
              <Metric label="Total lines" value={commit.lt} fixed={2}/>
            </MetricGroup>

            <MetricGroup title="Diffusion">
              <Metric label="# of modified subsystems (NS)" value={commit.ns} />
              <Metric label="# of modified directories (ND)" value={commit.nd} />
              <Metric label="# of modified files (NF)" value={commit.nf} />
              <Metric label="Entropy (Distribution)" value={commit.entropy} fixed={2} />
            </MetricGroup>

            <MetricGroup title="History">
              <Metric label="# devs contributing" value={commit.ndev} />
              <Metric label="Age from last change" value={commit.age} fixed={2} />
              <Metric label="# unique changes" value='-' />
            </MetricGroup>

            <MetricGroup title="Experience">
              <Metric label="Dev experience" value={commit.exp} fixed={2} />
              <Metric label="Recent dev experience" value='-' fixed={2} />
              <Metric label="Subsystem dev experience" value='-' fixed={2} />
            </MetricGroup>
          </div>

          <section>
            <p className="text-sm font-medium mb-2">Updated Files</p>
            {commit.hot_files?.length ? (
              <ul className="divide-y rounded-md border bg-card">
                {commit.hot_files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="font-mono text-[11px] sm:text-xs truncate">{f}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => navigator.clipboard.writeText(f)}>
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" asChild>
                        <a href={`https://github.com/search?q=${encodeURIComponent(f)}&type=code`} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 mr-1" /> Search
                        </a>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No file list captured.</p>
            )}
          </section>

          {isBuggy && (
            <section>
              <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Fixed by</p>
              {commit.fixes && commit.fixes.length ? (
                <div className="flex flex-wrap gap-2">
                  {commit.fixes.map((h, i) => (
                    <a
                      key={i}
                      className="inline-flex items-center gap-1 text-sm font-mono underline underline-offset-2"
                      href={`https://github.com/search?q=${encodeURIComponent(String(h))}&type=commits`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {String(h).slice(0, 10)} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No fixing commits recorded.</p>
              )}
            </section>
          )}
        </CardContent>
      )}
    </Card>
  );
}