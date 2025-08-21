"use client";

import { Button } from "@/components/ui/button";

export default function RepoFooter({
  loading,
  error,
  repos,          // pass the same array you give RepoList
  page = 1,
  totalPages = null,   // or pass hasNext if you prefer
  onPrev,
  onNext,
}) {
  // Don’t render anything while loading/errored
  if (loading || error) return null;

  // Only show the footer when there’s at least one repo
  const hasRows = Array.isArray(repos) && repos.length > 0;
  if (!hasRows) return null;

  const canPrev = typeof onPrev === "function" && page > 1;
  const canNext =
    typeof onNext === "function" &&
    (totalPages == null ? true : page < Number(totalPages));

  return (
    <div className="mt-4 flex items-center justify-end gap-2 text-sm">
      <Button variant="outline" disabled={!canPrev} onClick={onPrev}>
        Previous
      </Button>
      <span className="text-muted-foreground">
        Page {page}
        {totalPages ? ` of ${totalPages}` : ""}
      </span>
      <Button variant="outline" disabled={!canNext} onClick={onNext}>
        Next
      </Button>
    </div>
  );
}