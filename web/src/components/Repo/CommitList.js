"use client";

import CommitItem from "./CommitItem";
import { Button } from "@/components/ui/button";

export default function CommitList({ commits, hasMore, loadingMore, onLoadMore }) {
  return (
    <div className="mt-4 space-y-3">
      {(!commits || commits.length === 0) ? (
        <p className="text-muted-foreground text-sm">No commits found.</p>
      ) : (
        <>
          {commits.map((c) => <CommitItem key={c.id} commit={c} />)}
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              disabled={!hasMore || loadingMore}
              onClick={onLoadMore}
              className="w-full sm:w-auto"
            >
              {hasMore ? (loadingMore ? "Loading…" : "Load more") : "No more commits"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}