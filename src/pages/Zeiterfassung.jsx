import { useEffect, useState } from "react";

// Hilfsfunktion zur Stundenberechnung
function berechneDauer(start, end) {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  return (e - s) / (1000 * 60 * 60); // Stunden
}

// Hilfsfunktion zur ISO-Woche
function getISOWeek(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `KW ${weekNo}/${d.getFullYear()}`;
}

const Zeiterfassung = () => {
  const [startzeit, setStartzeit] = useState(null);
  const [eintraege, setEintraege] = useState([]);
  const [info, setInfo] = useState("");
  const [projekte, setProjekte] = useState({});
  const [ausgewaehltesProjekt, setAusgewaehltesProjekt] = useState("");
  const [filterProjekt, setFilterProjekt] = useState("");
  const [sortRichtung, setSortRichtung] = useState("desc");

  const email = localStorage.getItem("email");

  useEffect(() => {
    fetch("http://localhost:5050/api/zeiten")
      .then((res) => res.json())
      .then((data) => {
        const alle = Object.values(data).filter((e) => e.email === email);
        setEintraege(alle);
      })
      .catch((err) => console.error("Fehler beim Laden der Zeiten", err));
  }, [email]);

  useEffect(() => {
    fetch("http://localhost:5050/api/projekte")
      .then((res) => res.json())
      .then((data) => setProjekte(data))
      .catch((err) => console.error("Fehler beim Laden der Projekte", err));
  }, []);

  const handleStart = async () => {
    if (!ausgewaehltesProjekt) {
      setInfo("Bitte ein Projekt auswählen.");
      setTimeout(() => setInfo(""), 2000);
      return;
    }

    const timestamp = new Date().toISOString();

    const response = await fetch("http://localhost:5050/api/zeiten/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        start: timestamp,
        projekt: ausgewaehltesProjekt,
      }),
    });

    if (response.ok) {
      setStartzeit(timestamp);
      setInfo("Zeiterfassung gestartet ✅");
      setTimeout(() => setInfo(""), 3000);
    }
  };

  const handleStop = async () => {
    const end = new Date().toISOString();

    const response = await fetch("http://localhost:5050/api/zeiten/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, end }),
    });

    if (response.ok) {
      const neu = await response.json();
      setStartzeit(null);
      setEintraege((prev) => [neu, ...prev]);
      setInfo("Zeiterfassung gestoppt ✅");
      setTimeout(() => setInfo(""), 3000);
    }
  };

  // Tages- und Wochenauswertung
  const tage = {};
  const wochen = {};

  eintraege.forEach((e) => {
    if (!e.end) return;

    const tag = new Date(e.start).toLocaleDateString("de-DE");
    const woche = getISOWeek(e.start);
    const stunden = berechneDauer(e.start, e.end);

    tage[tag] = (tage[tag] || 0) + stunden;
    wochen[woche] = (wochen[woche] || 0) + stunden;
  });

  const gefilterteEintraege = eintraege
    .filter((e) => !filterProjekt || e.projekt === filterProjekt)
    .sort((a, b) =>
      sortRichtung === "desc"
        ? new Date(b.start) - new Date(a.start)
        : new Date(a.start) - new Date(b.start)
    );

  return (
    <div className="max-w-3xl mx-auto mt-8 bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold text-purple-700 mb-4">Zeiterfassung</h2>

      {info && (
        <div className="mb-4 px-4 py-2 bg-green-100 text-green-700 rounded text-sm text-center">
          {info}
        </div>
      )}

      {/* ✅ Auswertungsblock */}
      <div className="mb-6 p-4 bg-gray-50 border rounded">
        <h3 className="text-lg font-bold mb-2">📊 Auswertung</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-1 text-purple-700">Tage</h4>
            <ul className="text-sm">
              {Object.entries(tage).map(([tag, stunden]) => (
                <li key={tag}>
                  {tag}: {stunden.toFixed(2)} Stunden
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-1 text-purple-700">Wochen</h4>
            <ul className="text-sm">
              {Object.entries(wochen).map(([woche, stunden]) => (
                <li key={woche}>
                  {woche}: {stunden.toFixed(2)} Stunden
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Start-Stopp Bereich */}
      <div className="text-center mb-6">
        {!startzeit ? (
          <div className="space-y-3">
            <select
              value={ausgewaehltesProjekt}
              onChange={(e) => setAusgewaehltesProjekt(e.target.value)}
              className="border p-2 rounded w-full"
            >
              <option value="">-- Projekt wählen --</option>
              {Object.entries(projekte).map(([id, p]) => (
                <option key={id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleStart}
              className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700 w-full"
            >
              Arbeitszeit starten
            </button>
          </div>
        ) : (
          <button
            onClick={handleStop}
            className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700 w-full"
          >
            Arbeitszeit beenden
          </button>
        )}
      </div>

      {/* Filter & Sortierung */}
      <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
        <div className="flex gap-2">
          <label className="text-sm">Filter Projekt:</label>
          <select
            value={filterProjekt}
            onChange={(e) => setFilterProjekt(e.target.value)}
            className="border p-1 rounded"
          >
            <option value="">Alle</option>
            {Object.entries(projekte).map(([id, p]) => (
              <option key={id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <label className="text-sm">Sortierung:</label>
          <select
            value={sortRichtung}
            onChange={(e) => setSortRichtung(e.target.value)}
            className="border p-1 rounded"
          >
            <option value="desc">Neueste zuerst</option>
            <option value="asc">Älteste zuerst</option>
          </select>
        </div>
      </div>

      {/* Einträge */}
      <h3 className="font-bold text-lg mb-2">Bisherige Einträge</h3>
      <ul className="space-y-3 text-sm">
        {gefilterteEintraege.map((e, index) => (
          <li key={index} className="border p-3 rounded bg-gray-50">
            <div><strong>Projekt:</strong> {e.projekt || "–"}</div>
            <div><strong>Start:</strong> {new Date(e.start).toLocaleString()}</div>
            <div><strong>Ende:</strong> {e.end ? new Date(e.end).toLocaleString() : "Noch offen"}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Zeiterfassung;
