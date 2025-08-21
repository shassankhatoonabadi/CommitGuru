"use client";

import { Search, ArrowUpDown, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";

export default function RepoControls({
  q, setQ,
  visibility, setVisibility,
  status, setStatus,
  owner, setOwner,
  facets,
  sort, order, toggleSort,
  setPage,
}) {
  return (
    <>
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => { setPage(1); setQ(e.target.value); }}
              placeholder="Search by name or URL…"
              className="pl-9"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <Select value={visibility} onValueChange={(v) => { setPage(1); setVisibility(v); }}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Visibility" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Visibility: All</SelectItem>
              <SelectItem value="public">Visibility: Public ({facets.visibility?.public ?? 0})</SelectItem>
              <SelectItem value="private">Visibility: Private ({facets.visibility?.private ?? 0})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-3">
          <Select value={status} onValueChange={(v) => { setPage(1); setStatus(v); }}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Latest job status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Status: All</SelectItem>
              <SelectItem value="queued">Queued ({facets.status?.queued ?? 0})</SelectItem>
              <SelectItem value="in_progress">In Progress ({facets.status?.in_progress ?? 0})</SelectItem>
              <SelectItem value="completed">Completed ({facets.status?.completed ?? 0})</SelectItem>
              <SelectItem value="error">Error ({facets.status?.error ?? 0})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-3 flex gap-2">
          <Select value={owner} onValueChange={(v) => { setPage(1); setOwner(v); }}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Owner" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Owner: All</SelectItem>
              <SelectItem value="me">Owner: Me</SelectItem>
            </SelectContent>
          </Select>
          <Button className="hidden md:inline-flex" variant="outline">
            <Filter className="h-4 w-4 mr-2" /> Filters
          </Button>
        </div>
      </div>

      {/* Sort bar */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Sort by</span>
        {["last_job", "name", "created", "ingested"].map((key) => (
          <Button
            key={key}
            size="sm"
            variant={sort === key ? "default" : "outline"}
            onClick={() => toggleSort(key)}
          >
            {labelForSort(key)} <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-70" />
          </Button>
        ))}
        <span className="ml-auto text-muted-foreground">
          Order: <span className="font-medium">{order.toUpperCase()}</span>
        </span>
      </div>
    </>
  );
}

function labelForSort(key) {
  switch (key) {
    case "last_job": return "Last Activity";
    case "name": return "Name";
    case "created": return "Created";
    case "ingested": return "Ingested";
    default: return key;
  }
}