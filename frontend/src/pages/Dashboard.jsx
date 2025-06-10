import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get("/api/dashboard/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    };
    fetchDashboard();
  }, []);

  if (!data) {
    return <div className="p-8">Lade Dashboard...</div>;
  }

  // Wochenchart
  const weekLabels = data.wochenStunden.map((d) => d.datum);
  const weekData = data.wochenStunden.map((d) => d.stunden);

  // Projekte
  const projLabels = data.projektStunden.map((p) => p.projektName);
  const projData = data.projektStunden.map((p) => p.stunden);

  // Standorte
  const locLabels = data.standortStunden.map((l) => l.standort);
  const locData = data.standortStunden.map((l) => l.stunden);

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-4">📊 Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded shadow p-4">
          <div className="text-gray-500 text-sm">Arbeitstage (Monat)</div>
          <div className="text-2xl font-bold">{data.monatsSummary.arbeitstage}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-gray-500 text-sm">Gesamtstunden (Monat)</div>
          <div className="text-2xl font-bold">{data.monatsSummary.gesamtstunden.toFixed(1)} h</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-gray-500 text-sm">Top-Projekt</div>
          <div className="text-2xl font-bold">{data.topProjekte[0]?.projektName || "-"}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded shadow p-4">
          <div className="font-semibold mb-2">Stunden pro Tag (Woche)</div>
          <Bar
            data={{
              labels: weekLabels,
              datasets: [{ label: "Stunden", data: weekData, backgroundColor: "#3b82f6" }],
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } },
            }}
            height={200}
          />
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="font-semibold mb-2">Projektverteilung</div>
          <Doughnut
            data={{
              labels: projLabels,
              datasets: [{ data: projData, backgroundColor: ["#3b82f6", "#f59e42", "#10b981", "#ef4444"] }],
            }}
            options={{
              responsive: true,
              plugins: { legend: { position: "bottom" } },
            }}
            height={200}
          />
        </div>
      </div>

      <div className="bg-white rounded shadow p-4 max-w-md">
        <div className="font-semibold mb-2">Arbeitsorte (letzte 30 Tage)</div>
        <Doughnut
          data={{
            labels: locLabels,
            datasets: [{ data: locData, backgroundColor: ["#6366f1", "#fbbf24", "#34d399", "#f87171"] }],
          }}
          options={{
            responsive: true,
            plugins: { legend: { position: "bottom" } },
          }}
          height={200}
        />
      </div>
    </div>
  );
};

export default Dashboard;
