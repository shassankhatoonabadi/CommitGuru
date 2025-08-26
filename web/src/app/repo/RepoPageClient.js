"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

import RepoControls from "@/components/repos/RepoControls";
import RepoList from "@/components/repos/RepoList";
import RepoFooter from "@/components/repos/RepoFooter";
import { useDebounced, fmtDate } from "@/components/repos/utils";

export default function RepoPageClient() {
  const router = useRouter();
  const pathname = usePathname(); // should be "/repo"
  const sp = useSearchParams();

  // URL-backed state
  const [q, setQ] = useState(sp.get("q") || "");
  const [visibility, setVisibility] = useState(sp.get("visibility") || "all");
  const [status, setStatus] = useState(sp.get("status") || "all");
  const [sort, setSort] = useState(sp.get("sort") || "last_job");
  const [order, setOrder] = useState(sp.get("order") || "desc");
  const [owner, setOwner] = useState(sp.get("owner") || "all");
  const [pageSize, setPageSize] = useState(sp.get("pageSize") || "20");
  const [page, setPage] = useState(parseInt(sp.get("page") || "1", 10));

  // data
  const [data, setData] = useState({
    repos: [],
    meta: { total: 0, pages: 1, page: 1 },
    facets: { status: {}, visibility: {} },
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // mobile filters toggle
  const [showFilters, setShowFilters] = useState(false);

  // dev StrictMode guard
  const fetchedOnce = useRef(false);

  const qDebounced = useDebounced(q, 450);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (qDebounced) p.set("q", qDebounced);
    if (visibility !== "all") p.set("visibility", visibility);
    if (status !== "all") p.set("status", status);
    if (owner !== "all") p.set("owner", owner);
    if (sort) p.set("sort", sort);
    if (order) p.set("order", order);
    if (pageSize) p.set("pageSize", String(pageSize));
    p.set("page", String(page));
    return p.toString();
  }, [qDebounced, visibility, status, owner, sort, order, pageSize, page]);

  async function fetchData(signal) {
    setLoading(true);
    setErr("");
    try {
      // ✅ plural API
      const res = await fetch(`/api/repo?${queryString}`, {
        signal,
        headers: owner === "me" ? { "x-user-id": "demo-user" } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
      setErr("Failed to load repositories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Only update the URL if it actually changed
    const current = sp.toString();
    if (current !== queryString) {
      router.replace(`${pathname}?${queryString}`, { scroll: false });
    }

    // Guard duplicate fetches in dev StrictMode
    if (!fetchedOnce.current || process.env.NODE_ENV === "production") {
      fetchedOnce.current = true;
    }

    const ctrl = new AbortController();
    fetchData(ctrl.signal);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  function toggleSort(key) {
    if (sort === key) setOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setOrder("desc");
    }
  }

  async function analyze(repoId) {
    toast.error("Analysis is temporarily disabled.");
    // If you later enable:
    // toast.loading("Queuing analysis…", { id: repoId });
    // try { ... } catch { ... }
  }

  const { repos, meta, facets } = data;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <Toaster position="bottom-right" richColors />

      {/* Header */}
      <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Repositories{" "}
            <span className="text-muted-foreground font-normal">
              ({meta.total})
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Explore all repositories analyzed or imported in Commit Guru.
          </p>
        </div>

        {/* Mobile filter toggle (hidden on md+) */}
        <div className="sm:hidden mt-2">
          <Button
            variant="outline"
            className="w-full justify-center"
            aria-expanded={showFilters}
            aria-controls="repo-filters"
            onClick={() => setShowFilters((v) => !v)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? "Hide filters" : "Show filters"}
          </Button>
        </div>
      </div>

      {/* Controls: always visible on md+, collapsible on mobile */}
      <div
        id="repo-filters"
        className={`mt-4 ${showFilters ? "block" : "hidden"} sm:block`}
      >
        <RepoControls
          q={q}
          setQ={setQ}
          visibility={visibility}
          setVisibility={setVisibility}
          status={status}
          setStatus={setStatus}
          owner={owner}
          setOwner={setOwner}
          facets={facets}
          sort={sort}
          order={order}
          toggleSort={toggleSort}
          setPage={setPage}
        />
      </div>

      {/* List */}
      <RepoList
        loading={loading}
        error={err}
        repos={repos}
        analyze={analyze}
        fmtDate={fmtDate}
      />

      {/* Pagination */}
      <RepoFooter
        meta={meta}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
        currentCount={repos.length}
      />
    </div>
  );
}