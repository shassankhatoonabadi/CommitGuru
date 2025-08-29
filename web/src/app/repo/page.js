import { Suspense } from "react";
import RepoPageClient from "./RepoPageClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <RepoPageClient />
    </Suspense>
  );
}