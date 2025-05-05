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
    fetch("http://localhost:5050/api/zeiten")
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

  function aggregiereWochentage(eintraege) {
    const wochentage = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
    const daten = wochentage.map((tag) => ({ tag, minuten: 0 }));

    eintraege.forEach((e) => {
      if (!e.end) return;
      const start = new Date(e.start);
      const end = new Date(e.end);
      const tagIndex = (start.getDay() + 6) % 7; // Montag = 0
      const dauer = berechneDauer(start, end);
      daten[tagIndex].minuten += dauer;
    });

    return daten.map((d) => ({ ...d, stunden: +(d.minuten / 60).toFixed(2) }));
  }

  function aggregiereProjekte(eintraege) {
    const projektDaten = {};
    const heute = new Date();
    const wochenstart = new Date(heute);
    wochenstart.setDate(heute.getDate() - heute.getDay() + 1);

    eintraege.forEach((e) => {
      if (!e.end) return;

      const start = new Date(e.start);
      const end = new Date(e.end);
      if (start < wochenstart) return;

      const dauer = (end - start) / 60000;
      const projekt = e.projekt || "Unbekannt";
      projektDaten[projekt] = (projektDaten[projekt] || 0) + dauer;
    });

    return Object.entries(projektDaten).map(([projekt, minuten]) => ({
      name: projekt,
      value: +(minuten / 60).toFixed(2),
    }));
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

      <div className="bg-gray-100 border p-4 rounded text-sm mb-6">
        <p className="font-semibold text-center mb-2">Arbeitszeit nach Wochentag</p>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={aggregiereWochentage(zeiten)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tag" />
            <YAxis unit="h" />
            <Tooltip formatter={(value) => `${value} Stunden`} />
            <Bar dataKey="stunden" fill="#6b21a8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gray-100 border p-4 rounded text-sm">
        <p className="font-semibold text-center mb-2">Projektverteilung (diese Woche)</p>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={aggregiereProjekte(zeiten)}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name, percent }) =>
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
            >
              {aggregiereProjekte(zeiten).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={farben[index % farben.length]} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
