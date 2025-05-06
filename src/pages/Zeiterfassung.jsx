import React, { useEffect, useState } from "react";

export default function Zeiterfassung() {
  const [eintraege, setEintraege] = useState([]);
  const [running, setRunning] = useState(false);
  const [selectedProjekt, setSelectedProjekt] = useState("");
  const [projekte, setProjekte] = useState([]);
  const [filterProjekt, setFilterProjekt] = useState("");
  const [filterVon, setFilterVon] = useState("");
  const [filterBis, setFilterBis] = useState("");
  const [sortierung, setSortierung] = useState(() => localStorage.getItem("sortierung") || "neu");

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

  const gefilterteEintraege = eintraege.filter((z) => {
    const start = new Date(z.start);
    const projektOk = filterProjekt ? z.projekt === filterProjekt : true;
    const vonOk = filterVon ? start >= new Date(filterVon) : true;
    const bisOk = filterBis ? start <= new Date(filterBis) : true;
    return projektOk && vonOk && bisOk;
  });

  const sortierteEintraege = [...gefilterteEintraege].sort((a, b) =>
    sortierung === "neu"
      ? new Date(b.start) - new Date(a.start)
      : new Date(a.start) - new Date(b.start)
  );

  const handleSortChange = (e) => {
    const value = e.target.value;
    setSortierung(value);
    localStorage.setItem("sortierung", value);
  };

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

      <div className="mb-6 border p-4 rounded bg-gray-50">
        <h2 className="font-semibold mb-3">Filter</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          <select
            value={filterProjekt}
            onChange={(e) => setFilterProjekt(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="">Alle Projekte</option>
            {projekte.map(([id, p]) => (
              <option key={id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filterVon}
            onChange={(e) => setFilterVon(e.target.value)}
            className="border px-3 py-2 rounded"
          />

          <input
            type="date"
            value={filterBis}
            onChange={(e) => setFilterBis(e.target.value)}
            className="border px-3 py-2 rounded"
          />
        </div>

        <button
          onClick={() => {
            setFilterProjekt("");
            setFilterVon("");
            setFilterBis("");
          }}
          className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700"
        >
          Filter zurücksetzen
        </button>

        <div className="mt-4">
          <label className="block mb-1 font-medium">Sortierung:</label>
          <select
            value={sortierung}
            onChange={handleSortChange}
            className="border px-3 py-2 rounded w-full"
          >
            <option value="neu">Neueste zuerst</option>
            <option value="alt">Älteste zuerst</option>
          </select>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-2">Einträge</h2>

      <div className="text-sm text-gray-700 space-y-2">
        {sortierteEintraege.map((z, i) => (
          <div key={i} className="border p-2 rounded bg-gray-50">
            <div><strong>Projekt:</strong> {z.projekt || "-"}</div>
            <div><strong>Start:</strong> {new Date(z.start).toLocaleString()}</div>
            <div>
              <strong>Stopp:</strong>{" "}
              {z.end ? new Date(z.end).toLocaleString() : <em>läuft…</em>}
            </div>
            {z.end && (
              <div><strong>Dauer:</strong> {formatiereDauer(berechneDauer(z.start, z.end))}</div>
            )}
          </div>
        ))}
        {sortierteEintraege.length === 0 && (
          <p className="text-gray-400 text-center">Keine passenden Einträge gefunden.</p>
        )}
      </div>
    </div>
  );
}
