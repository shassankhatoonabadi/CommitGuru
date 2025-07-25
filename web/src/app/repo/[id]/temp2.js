"use client";
"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

// ✅ Register required components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend
);


export default function RepoPage() {
  const { id } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/repo/${id}/metrics`)
      .then(res => res.json())
      .then(res => {
        setData(res.data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <Skeleton className="w-full h-96" />;

  const dates = data.map(d => new Date(d.authored_date).toLocaleDateString());
  const entropy = data.map(d => d.entropy);
  const ndev = data.map(d => d.ndev);
  const la = data.map(d => d.la);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
      <h1 className="text-3xl font-bold">📊 Repo Analytics</h1>

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Entropy Over Time</h2>
          <Line
            data={{
              labels: dates,
              datasets: [
                {
                  label: "Entropy",
                  data: entropy,
                  fill: false,
                  borderColor: "rgb(75, 192, 192)",
                },
              ],
            }}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold">Number of Developers (ndev)</h2>
          <Bar
            data={{
              labels: dates,
              datasets: [
                {
                  label: "ndev",
                  data: ndev,
                  backgroundColor: "rgba(255, 99, 132, 0.5)",
                },
              ],
            }}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold">Lines Added (la)</h2>
          <Bar
            data={{
              labels: dates,
              datasets: [
                {
                  label: "Lines Added",
                  data: la,
                  backgroundColor: "rgba(54, 162, 235, 0.5)",
                },
              ],
            }}
          />
        </div>
      </section>
    </div>
  );
}
