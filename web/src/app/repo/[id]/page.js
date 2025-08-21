"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import RepoHeader from "@/components/Repo/RepoHeader";
import RepoTabs from "@/components/Repo/RepoTabs";
import FilterBar from "@/components/Repo/FilterBar";
import CommitList from "@/components/Repo/CommitList";
import { Skeleton } from "@/components/ui/skeleton";

export default function RepoPage() {
  const { id } = useParams();

  const [repo, setRepo] = useState({ id, name: "Repository", url: "" });
  const [commits, setCommits] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, size: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [filters, setFilters] = useState({ search: "", author: "", classification: "all" });

  const queryForPage = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.author) params.set("author", filters.author);
    if (filters.classification && filters.classification !== "all") params.set("classification", filters.classification);
    params.set("page", String(pagination.page));
    params.set("size", String(pagination.size));
    return params.toString();
  }, [filters, pagination.page, pagination.size]);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    fetch(`/api/repo/${id}/metrics?${queryForPage}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        if (cancel) return;
        setRepo(data.repo || { id, name: "Repository", url: "" });
        setCommits((prev) => (pagination.page === 1 ? data.commits ?? [] : [...prev, ...(data.commits ?? [])]));
        setPagination((p) => ({ ...p, total: data.pagination?.total ?? 0, totalPages: data.pagination?.totalPages ?? 0 }));
      })
      .catch((e) => console.error("[RepoPage] fetch error", e))
      .finally(() => !cancel && setLoading(false));
    return () => { cancel = true; };
  }, [id, queryForPage]);

  const handleApplyFilters = (next) => {
    setPagination((p) => ({ ...p, page: 1 }));
    setCommits([]);
    setFilters(next);
  };

  const loadMore = () => {
    if (loading || loadingMore) return;
    if (pagination.page >= (pagination.totalPages || 1)) return;
    setLoadingMore(true);
    setPagination((p) => ({ ...p, page: p.page + 1 }));
    setTimeout(() => setLoadingMore(false), 250);
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-5 sm:py-6">
      {loading && commits.length === 0 ? (
        <Skeleton className="h-20 w-full mb-3" />
      ) : (
        <RepoHeader name={repo.name} url={repo.url} />
      )}

      <RepoTabs>
        <>
          <FilterBar onChange={handleApplyFilters} />
          {loading && commits.length === 0 ? (
            <div className="space-y-3 mt-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <CommitList
              commits={commits}
              hasMore={pagination.page < (pagination.totalPages || 1)}
              loadingMore={loadingMore}
              onLoadMore={loadMore}
            />
          )}
        </>
      </RepoTabs>
    </div>
  );
}