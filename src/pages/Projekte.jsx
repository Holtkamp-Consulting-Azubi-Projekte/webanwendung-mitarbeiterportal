import { useEffect, useState } from "react";

const Projekte = () => {
  const [projekte, setProjekte] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [neuesProjekt, setNeuesProjekt] = useState({ name: "", beschreibung: "" });
  const [fehlermeldung, setFehlermeldung] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    fetch("http://localhost:5050/api/projekte")
      .then((res) => res.json())
      .then((data) => setProjekte(data))
      .catch((err) => {
        console.error("Fehler beim Laden der Projekte:", err);
        setFehlermeldung("Projekte konnten nicht geladen werden.");
      });
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!neuesProjekt.name.trim()) {
      setFehlermeldung("Projektname darf nicht leer sein.");
      return;
    }

    const response = await fetch("http://localhost:5050/api/projekte", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(neuesProjekt),
    });

    if (response.ok) {
      const neu = await response.json(); // { id: {...} }
      setProjekte((prev) => ({ ...prev, ...neu }));
      setNeuesProjekt({ name: "", beschreibung: "" });
      setShowModal(false);
      setInfo("Projekt erfolgreich erstellt ✅");
      setTimeout(() => setInfo(""), 3000);
    } else {
      setFehlermeldung("Erstellen fehlgeschlagen ❌");
    }
  };

  const handleDelete = async (id) => {
    const response = await fetch(`http://localhost:5050/api/projekte/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      const kopie = { ...projekte };
      delete kopie[id];
      setProjekte(kopie);
      setInfo("Projekt gelöscht ✅");
      setTimeout(() => setInfo(""), 3000);
    } else {
      setFehlermeldung("Löschen fehlgeschlagen ❌");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold text-purple-700 mb-4">Projekte</h2>

      {info && (
        <div className="mb-4 px-4 py-2 bg-green-100 text-green-700 rounded text-sm">
          {info}
        </div>
      )}

      {fehlermeldung && (
        <div className="mb-4 px-4 py-2 bg-red-100 text-red-700 rounded text-sm">
          {fehlermeldung}
        </div>
      )}

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowModal(true)}
          className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700"
        >
          Neues Projekt hinzufügen
        </button>
      </div>

      <ul className="space-y-4">
        {Object.entries(projekte).map(([id, projekt]) => (
          <li key={id} className="border rounded p-4 bg-gray-50">
            <h3 className="font-bold text-lg">{projekt.name}</h3>
            <p className="text-sm text-gray-600">{projekt.beschreibung}</p>
            <div className="mt-2 flex gap-2">
              {/* Bearbeiten kommt später */}
              <button className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700">
                Bearbeiten
              </button>
              <button
                onClick={() => handleDelete(id)}
                className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700"
              >
                Löschen
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-purple-700">Neues Projekt</h3>
            <form className="space-y-4" onSubmit={handleCreate}>
              <input
                type="text"
                name="name"
                placeholder="Projektname"
                value={neuesProjekt.name}
                onChange={(e) =>
                  setNeuesProjekt({ ...neuesProjekt, name: e.target.value })
                }
                className="w-full border p-2 rounded"
              />
              <textarea
                name="beschreibung"
                placeholder="Beschreibung"
                value={neuesProjekt.beschreibung}
                onChange={(e) =>
                  setNeuesProjekt({ ...neuesProjekt, beschreibung: e.target.value })
                }
                className="w-full border p-2 rounded"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700"
                >
                  Erstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projekte;
