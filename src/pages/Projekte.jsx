import React, { useEffect, useState } from "react";

const Projekte = () => {
  const [projekte, setProjekte] = useState({});
  const [modalOffen, setModalOffen] = useState(false);
  const [modus, setModus] = useState("neu");
  const [formular, setFormular] = useState({ name: "", beschreibung: "" });
  const [aktiveID, setAktiveID] = useState(null);
  const [meldung, setMeldung] = useState("");
  const [warnung, setWarnung] = useState("");
  const [bestätigeAktion, setBestätigeAktion] = useState(null);

  // Projekte vom Server laden
  const ladeProjekte = async () => {
    const res = await fetch("http://localhost:5050/api/projekte");
    const daten = await res.json();
    setProjekte(daten);
  };

  useEffect(() => {
    ladeProjekte();
  }, []);

  const öffneModal = (id = null) => {
    setWarnung("");
    if (id) {
      setModus("bearbeiten");
      setAktiveID(id);
      setFormular({ ...projekte[id] });
    } else {
      setModus("neu");
      setAktiveID(null);
      setFormular({ name: "", beschreibung: "" });
    }
    setModalOffen(true);
  };

  const schließeModal = () => {
    setModalOffen(false);
    setAktiveID(null);
    setFormular({ name: "", beschreibung: "" });
  };

  const handleSpeichern = async () => {
    const url =
      modus === "neu"
        ? "http://localhost:5050/api/projekte"
        : `http://localhost:5050/api/projekte/${aktiveID}`;
    const method = modus === "neu" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formular),
    });

    if (res.ok) {
      await ladeProjekte();
      setMeldung(modus === "neu" ? "Projekt erstellt ✅" : "Projekt aktualisiert ✅");
      schließeModal();
      setTimeout(() => setMeldung(""), 3000);
    } else {
      setWarnung("Fehler beim Speichern ❌");
    }
  };

  const handleLöschen = (id) => {
    setBestätigeAktion(() => async () => {
      const res = await fetch(`http://localhost:5050/api/projekte/${id}`, {
        method: "DELETE",
      });
      const daten = await res.json();

      if (res.ok) {
        await ladeProjekte();
        setMeldung("Projekt gelöscht ✅");
      } else {
        setWarnung(daten.error || "Fehler beim Löschen ❌");
      }

      setTimeout(() => {
        setMeldung("");
        setWarnung("");
      }, 3000);
      setBestätigeAktion(null);
    });
  };

  const handleAbschließen = (id) => {
    setBestätigeAktion(() => async () => {
      const res = await fetch(`http://localhost:5050/api/projekte/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "abgeschlossen" }),
      });

      if (res.ok) {
        await ladeProjekte();
        setMeldung("Projekt abgeschlossen ✅");
        setTimeout(() => setMeldung(""), 3000);
      }

      setBestätigeAktion(null);
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Projekte</h1>

      {meldung && <div className="text-green-600 mb-2">{meldung}</div>}
      {warnung && <div className="text-red-600 mb-2">{warnung}</div>}

      <button
        onClick={() => öffneModal()}
        className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700 mb-4"
      >
        ➕ Neues Projekt
      </button>

      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(projekte).map(([id, projekt]) => (
          <div
            key={id}
            className="border rounded p-4 shadow-sm bg-white flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{projekt.name}</h2>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  projekt.status === "aktiv"
                    ? "bg-green-200 text-green-800"
                    : projekt.status === "abgeschlossen"
                    ? "bg-red-200 text-red-800"
                    : "bg-yellow-200 text-yellow-800"
                }`}
              >
                {projekt.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">{projekt.beschreibung}</p>

            {projekt.status !== "abgeschlossen" && (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => öffneModal(id)}
                  className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700"
                >
                  ✏️ Bearbeiten
                </button>
                <button
                  onClick={() => handleLöschen(id)}
                  className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700"
                >
                  🗑 Löschen
                </button>
                <button
                  onClick={() => handleAbschließen(id)}
                  className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700"
                >
                  ✅ Abschließen
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOffen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded p-6 shadow-md w-full max-w-md max-h-[70vh] overflow-auto">
            <h2 className="text-xl font-bold mb-4">
              {modus === "neu" ? "Neues Projekt" : "Projekt bearbeiten"}
            </h2>

            <label className="block mb-2 text-sm font-medium">Name</label>
            <input
              type="text"
              value={formular.name}
              onChange={(e) =>
                setFormular({ ...formular, name: e.target.value })
              }
              className="w-full border rounded px-3 py-2 mb-4"
            />

            <label className="block mb-2 text-sm font-medium">Beschreibung</label>
            <textarea
              value={formular.beschreibung}
              onChange={(e) =>
                setFormular({ ...formular, beschreibung: e.target.value })
              }
              className="w-full border rounded px-3 py-2 mb-4"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={schließeModal}
                className="px-3 py-2 rounded border text-gray-700 hover:bg-gray-200 transition duration-200"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSpeichern}
                className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bestätigung */}
      {bestätigeAktion && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md text-center max-w-sm">
            <p className="mb-4">Bist du dir sicher?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setBestätigeAktion(null)}
                className="px-3 py-2 rounded border text-gray-700 hover:bg-gray-200 transition duration-200"
              >
                Abbrechen
              </button>
              <button
                onClick={bestätigeAktion}
                className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700"
              >
                Ja, bestätigen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projekte;
