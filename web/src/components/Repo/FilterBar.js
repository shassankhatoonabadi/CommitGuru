"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function FilterBar({ onChange }) {
  const [search, setSearch] = useState("");
  const [author, setAuthor] = useState("");
  const [classification, setClassification] = useState("all");

  const applyFilters = () => onChange({ search, author, classification });

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-muted p-3 rounded-lg sticky top-0 z-20">
      <Input
        placeholder="Search commits (message or SHA)…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="sm:max-w-xs"
      />
      <Input
        placeholder="Author"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        className="sm:max-w-xs"
      />
      <div className="flex gap-2">
        <Select value={classification} onValueChange={setClassification}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Classification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="fix">Fix</SelectItem>
            <SelectItem value="feature">Feature</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={applyFilters} className="shrink-0">Apply</Button>
      </div>
    </div>
  );
}