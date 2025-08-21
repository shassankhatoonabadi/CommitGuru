"use client";

import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";

export default function RepoHeader({ name, url }) {
  const copyUrl = () => url && navigator.clipboard.writeText(url);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-muted p-4 rounded-lg">
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-bold truncate">{name || "Repository"}</h1>
        <p className="text-sm text-muted-foreground break-all">{url || "—"}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => url && window.open(url, "_blank")} disabled={!url}>
          <ExternalLink className="w-4 h-4 mr-1" /> Open
        </Button>
        <Button variant="outline" size="sm" onClick={copyUrl} disabled={!url}>
          <Copy className="w-4 h-4 mr-1" /> Copy
        </Button>
      </div>
    </div>
  );
}