import { useEffect, useState } from "react";

const Projekte = () => {
  const [projekte, setProjekte] = useState({});
  const [name, setName] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [nachricht, setNachricht] = useState("");
  const [loeschKandidat, setLoeschKandidat] = useState(null);
  const [abschlussKandidat, setAbschlussKandidat] = useState(null);
  const [bearbeitenId, setBearbeitenId] = useState(null);

  useEffect(() => {
    ladeProjekte();
  }, []);

  const ladeProjekte = async () => {
    try {
      const res = await fetch("http://localhost:5050/api/projekte");
      const data = await res.json();
      setProjekte(data);
    } catch (err) {
      console.error("Fehler beim Laden:", err);
    }
  };

  const projektSpeichern = async () => {
    if (!name) return setNachricht("Bitte Projektnamen angeben");

    const payload = { name, beschreibung };

    try {
      const res = await fetch(
        `http://localhost:5050/api/projekte${bearbeitenId ? `/${bearbeitenId}` : ""}`,
        {
          method: bearbeitenId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        setNachricht(bearbeitenId ? "Projekt aktualisiert ✅" : "Projekt gespeichert ✅");
        setName("");
        setBeschreibung("");
        setBearbeitenId(null);
        ladeProjekte();
      } else {
        setNachricht("Fehler beim Speichern ❌");
      }
    } catch {
      setNachricht("Fehler beim Speichern ❌");
    }

    setTimeout(() => setNachricht(""), 3000);
  };

  const projektBearbeiten = (id) => {
    setBearbeitenId(id);
    setName(projekte[id].name);
    setBeschreibung(projekte[id].beschreibung);
  };

  const projektLöschen = async () => {
    try {
      const res = await fetch(`http://localhost:5050/api/projekte/${loeschKandidat}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (res.ok) {
        setNachricht("Projekt gelöscht ✅");
        ladeProjekte();
      } else {
        setNachricht(result.error || "Fehler beim Löschen ❌");
      }
    } catch {
      setNachricht("Fehler beim Löschen ❌");
    }

    setLoeschKandidat(null);
    setTimeout(() => setNachricht(""), 3000);
  };

  const projektAbschließen = async () => {
    try {
      const res = await fetch(`http://localhost:5050/api/projekte/${abschlussKandidat}/abschliessen`, {
        method: "PUT",
      });

      if (res.ok) {
        setNachricht("Projekt abgeschlossen ✅");
        ladeProjekte();
      } else {
        setNachricht("Fehler beim Abschließen ❌");
      }
    } catch {
      setNachricht("Fehler beim Abschließen ❌");
    }

    setAbschlussKandidat(null);
    setTimeout(() => setNachricht(""), 3000);
  };

  const statusBadge = (status) => {
    switch (status) {
      case "aktiv":
        return (
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800 border border-green-300">
            aktiv
          </span>
        );
      case "inaktiv":
        return (
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">
            inaktiv
          </span>
        );
      case "abgeschlossen":
        return (
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800 border border-red-300">
            abgeschlossen
          </span>
        );
      default:
        return (
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 border border-gray-300">
            unbekannt
          </span>
        );
    }
  };
    
  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Projektverwaltung</h2>

      {/* Formular zum Anlegen/Bearbeiten */}
      <input
        type="text"
        placeholder="Projektname"
        className="w-full border px-3 py-2 rounded mb-2"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <textarea
        placeholder="Beschreibung"
        className="w-full border px-3 py-2 rounded mb-2"
        value={beschreibung}
        onChange={(e) => setBeschreibung(e.target.value)}
      />
      <button
        onClick={projektSpeichern}
        className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700"
      >
        {bearbeitenId ? "Aktualisieren" : "Speichern"}
      </button>
      {nachricht && <p className="mt-2 text-sm text-blue-600">{nachricht}</p>}

      <hr className="my-6" />

      {/* Projektliste */}
      <h3 className="font-semibold mb-2">Bestehende Projekte</h3>
      <div className="space-y-4">
        {Object.entries(projekte).map(([id, projekt]) => (
          <div key={id} className="border p-4 rounded shadow-sm bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold flex items-center"> 
                  {projekt.name}
                  {statusBadge(projekt.status)}
                </h4>
                <p className="text-sm text-gray-600">{projekt.beschreibung}</p>
              </div>

              {/* Aktionen (nur wenn nicht abgeschlossen) */}
              {projekt.status !== "abgeschlossen" && (
                <div className="flex flex-col items-end space-y-2">
                  <button
                    onClick={() => projektBearbeiten(id)}
                    className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => setLoeschKandidat(id)}
                    className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700"
                  >
                    Löschen
                  </button>
                  <button
                    onClick={() => setAbschlussKandidat(id)}
                    className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700"
                  >
                    Abschließen
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Löschen */}
      {loeschKandidat && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md text-center">
            <p>Möchtest du dieses Projekt wirklich löschen?</p>
            <div className="mt-4 space-x-2">
              <button
                onClick={projektLöschen}
                className="px-3 py-2 rounded bg-red-600 text-white"
              >
                Ja, löschen
              </button>
              <button
                onClick={() => setLoeschKandidat(null)}
                className="px-3 py-2 rounded border"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Abschließen */}
      {abschlussKandidat && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md text-center">
            <p>Projekt wirklich abschließen? Danach ist keine Bearbeitung mehr möglich.</p>
            <div className="mt-4 space-x-2">
              <button
                onClick={projektAbschließen}
                className="px-3 py-2 rounded bg-yellow-600 text-white"
              >
                Ja, abschließen
              </button>
              <button
                onClick={() => setAbschlussKandidat(null)}
                className="px-3 py-2 rounded border"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projekte;
