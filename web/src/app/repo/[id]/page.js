'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function RepoAnalyticsPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/repo/${id}/metrics`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
    console.log("Fetching data for repo ID:", id);
  }, [id]);

  if (loading || !data) return <Skeleton className="w-full h-96" />;

  const bugPct = data.total_commits > 0
    ? Math.round((data.bug_commits / data.total_commits) * 100)
    : 0;

  const cards = [
    { label: "Average Age from Last Change", value: data.avg_age },
    { label: "Entropy (Distribution)", value: data.avg_entropy },
    { label: "Developer Experience", value: data.avg_exp },
    { label: "Lines Added", value: data.avg_la },
    { label: "Lines Deleted", value: data.avg_ld },
    { label: "Total Lines", value: data.avg_la + data.avg_ld },
    { label: "# Modified Directories", value: data.avg_nd },
    { label: "# Developers Contributing", value: data.avg_ndev },
    { label: "# Modified Files", value: data.avg_nf },
    { label: "# Modified Subsystems", value: data.avg_ns },
    { label: "# Unique Changes", value: data.avg_nuc },
    { label: "Recent Experience", value: data.avg_rexp },
    { label: "Subsystem Experience", value: data.avg_sexp },
    { label: "GLM Probability", value: data.avg_glm },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <Badge variant="outline" className="text-sm font-mono py-1 px-3">
          Repo ID: {id}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
        <Card className="col-span-1 md:col-span-3 xl:col-span-1 shadow-lg">
          <CardContent className="p-6 flex flex-col items-center">
            <Doughnut
              data={{
                labels: ["Buggy", "Clean"],
                datasets: [
                  {
                    label: "Buggy Commits",
                    data: [bugPct, 100 - bugPct],
                    backgroundColor: ["#ef4444", "#22c55e"],
                    borderColor: ["#b91c1c", "#15803d"],
                    borderWidth: 1,
                  },
                ],
              }}
            />
            <p className="mt-4 text-center text-muted-foreground text-sm">
              {bugPct}% May Introduce Bugs, {100 - bugPct}% Don't
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md col-span-1">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Total Commits</p>
            <p className="text-3xl font-bold tracking-tight">{data.total_commits}</p>
          </CardContent>
        </Card>

        {cards.map((card, i) => (
          <Card key={i} className="shadow-md">
            <CardContent className="p-6 text-center space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
              <p className="text-xl font-bold tracking-tight">{Number(card.value).toFixed(2)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
