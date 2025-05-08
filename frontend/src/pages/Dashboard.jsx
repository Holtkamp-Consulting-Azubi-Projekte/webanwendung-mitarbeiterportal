import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

export default function Dashboard() {
  const [zeiten, setZeiten] = useState([]);
  const [vorname, setVorname] = useState("");
  const email = localStorage.getItem("email");

  useEffect(() => {
    // Benutzerdaten holen
    fetch("http://localhost:5050/api/user/" + email)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.vorname) {
          setVorname(data.vorname);
        }
      });

    // Zeiteinträge holen
    fetch("http://localhost:5050/api/time/")
      .then((res) => res.json())
      .then((data) => {
        const userZeiten = Object.values(data).filter((z) => z.email === email);
        setZeiten(userZeiten);
      });
  }, [email]);

  function berechneDauer(start, end) {
    const s = new Date(start);
    const e = new Date(end);
    return Math.max(0, (e - s) / 60000); // Minuten
  }

  function formatiereDauer(minuten) {
    const h = Math.floor(minuten / 60);
    const m = Math.round(minuten % 60);
    return `${h}h ${m}m`;
  }

  function berechneUebersicht(eintraege) {
    const heute = new Date();
    const wochenstart = new Date(heute);
    wochenstart.setDate(heute.getDate() - heute.getDay() + 1); // Montag

    let minutenHeute = 0;
    let minutenWoche = 0;

    eintraege.forEach((e) => {
      if (!e.end) return;
      const start = new Date(e.start);
      const end = new Date(e.end);
      const dauer = berechneDauer(start, end);

      if (start.toDateString() === heute.toDateString()) {
        minutenHeute += dauer;
      }

      if (start >= wochenstart) {
        minutenWoche += dauer;
      }
    });

    return {
      heute: formatiereDauer(minutenHeute),
      woche: formatiereDauer(minutenWoche),
    };
  }

  const farben = ["#6b21a8", "#9333ea", "#c084fc", "#d946ef", "#a855f7", "#7e22ce"];
  const { heute, woche } = berechneUebersicht(zeiten);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow rounded mt-6">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Willkommen, {vorname || "Benutzer"} 👋
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-100 border p-4 rounded text-center">
          <p className="text-sm text-gray-500">Arbeitszeit heute</p>
          <p className="text-xl font-semibold">{heute}</p>
        </div>
        <div className="bg-gray-100 border p-4 rounded text-center">
          <p className="text-sm text-gray-500">Arbeitszeit diese Woche</p>
          <p className="text-xl font-semibold">{woche}</p>
        </div>
      </div>
    </div>
  );
}
