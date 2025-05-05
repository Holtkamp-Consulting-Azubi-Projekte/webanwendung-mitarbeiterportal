import React, { useEffect, useState } from "react";

export default function Zeiterfassung() {
  const [eintraege, setEintraege] = useState([]);
  const [running, setRunning] = useState(false);
  const [selectedProjekt, setSelectedProjekt] = useState("");
  const [projekte, setProjekte] = useState([]);
  const email = localStorage.getItem("email");

  useEffect(() => {
    async function fetchZeiten() {
      const res = await fetch("http://localhost:5050/api/zeiten");
      const data = await res.json();
      const userZeiten = Object.values(data).filter(z => z.email === email);

      const sorted = userZeiten.sort((a, b) => new Date(b.start) - new Date(a.start));
      setEintraege(sorted);

      const offenerEintrag = sorted.find(e => e.end === null);
      if (offenerEintrag) {
        setRunning(true);
        setSelectedProjekt(offenerEintrag.projekt || "");
      } else {
        setRunning(false);
      }
    }

    async function fetchProjekte() {
      const res = await fetch("http://localhost:5050/api/projekte");
      const data = await res.json();
      setProjekte(Object.entries(data));
    }

    fetchZeiten();
    fetchProjekte();
  }, [email]);

  const handleStart = async () => {
    const start = new Date().toISOString();
    const res = await fetch("http://localhost:5050/api/zeiten/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, start, projekt: selectedProjekt }),
    });

    if (res.ok) {
      const newEntry = await res.json();
      setEintraege((prev) => [newEntry, ...prev]);
      setRunning(true);
    }
  };

  const handleStop = async () => {
    const end = new Date().toISOString();
    const res = await fetch("http://localhost:5050/api/zeiten/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, end }),
    });

    if (res.ok) {
      const updatedEntry = await res.json();
      setEintraege((prev) =>
        prev.map((e) =>
          e.start === updatedEntry.start && e.end === null ? updatedEntry : e
        )
      );
      setRunning(false);
      setSelectedProjekt("");
    }
  };

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

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded mt-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Zeiterfassung</h1>

      <div className="mb-6 text-center space-y-4">
        {!running && (
          <select
            value={selectedProjekt}
            onChange={(e) => setSelectedProjekt(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          >
            <option value="">Projekt auswählen</option>
            {projekte.map(([id, p]) => (
              <option key={id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={running ? handleStop : handleStart}
          className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700 w-full"
        >
          {running ? "Stopp" : "Start"}
        </button>
      </div>

      {eintraege.length > 0 && (
        <div className="bg-gray-100 border p-4 rounded mb-6 text-sm text-center">
          <p className="font-semibold">Arbeitszeit Übersicht:</p>
          {(() => {
            const { heute, woche } = berechneUebersicht(eintraege);
            return (
              <>
                <p>Heute: <strong>{heute}</strong></p>
                <p>Diese Woche: <strong>{woche}</strong></p>
              </>
            );
          })()}
        </div>
      )}

      <h2 className="text-lg font-semibold mb-2">Bisherige Einträge</h2>
      <div className="text-sm text-gray-700 space-y-2">
        {eintraege.map((z, i) => (
          <div key={i} className="border p-2 rounded bg-gray-50">
            <div><strong>Projekt:</strong> {z.projekt || "-"}</div>
            <div><strong>Start:</strong> {new Date(z.start).toLocaleString()}</div>
            <div>
              <strong>Stopp:</strong>{" "}
              {z.end ? new Date(z.end).toLocaleString() : <em>läuft…</em>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
