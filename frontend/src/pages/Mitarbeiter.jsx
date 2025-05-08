import { useEffect, useState } from "react";

const Mitarbeiter = () => {
  const [daten, setDaten] = useState(null);
  const [info, setInfo] = useState("");
  const [fehler, setFehler] = useState("");
  const [modalOffen, setModalOffen] = useState(false);
  const [formulardaten, setFormulardaten] = useState({
    vorname: "",
    nachname: "",
    rolle: "",
    eintrittsdatum: "",
    adresse: "",
    telefon: ""
  });

  const email = localStorage.getItem("email");

  useEffect(() => {
    if (!email) {
      setFehler("Kein Benutzer angemeldet oder ungültige E-Mail.");
      return;
    }

    fetch(`http://localhost:5050/api/user/${email}`)
      .then((res) => res.json())
      .then((data) => {
        setDaten(data);
        setFormulardaten(data);
      })
      .catch(() =>
        setFehler("Fehler beim Laden der Benutzerdaten.")
      );
  }, [email]);

  const handleChange = (e) => {
    setFormulardaten({ ...formulardaten, [e.target.name]: e.target.value });
  };

  const speichern = async (e) => {
    e.preventDefault();
    if (!formulardaten.vorname || !formulardaten.nachname || !formulardaten.eintrittsdatum) {
      setFehler("Bitte fülle alle Pflichtfelder aus.");
      setTimeout(() => setFehler(""), 3000);
      return;
    }

    const res = await fetch(`http://localhost:5050/api/user/${email}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formulardaten)
    });

    if (res.ok) {
      setInfo("Profil aktualisiert ✅");
      setTimeout(() => setInfo(""), 3000);
      setModalOffen(false);
      setDaten(formulardaten);
    } else {
      setFehler("Aktualisierung fehlgeschlagen ❌");
      setTimeout(() => setFehler(""), 3000);
    }
  };

  if (fehler) {
    return <p className="text-red-600 text-center mt-10">{fehler}</p>;
  }

  if (!daten) {
    return <p className="text-center mt-10">Lade Benutzerdaten...</p>;
  }

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-md p-6 mt-8 rounded">
      <h2 className="text-2xl font-bold mb-4 text-center">Mitarbeiterprofil</h2>

      {info && (
        <div className="mb-4 px-4 py-2 bg-green-100 text-green-700 rounded text-sm text-center">
          {info}
        </div>
      )}

      <div className="space-y-2 text-sm">
        <p><strong>Vorname:</strong> {daten.vorname}</p>
        <p><strong>Nachname:</strong> {daten.nachname}</p>
        <p><strong>Rolle:</strong> {daten.rolle}</p>
        <p><strong>Eintrittsdatum:</strong> {daten.eintrittsdatum}</p>
        <p><strong>Adresse:</strong> {daten.adresse || "-"}</p>
        <p><strong>Telefon:</strong> {daten.telefon || "-"}</p>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => setModalOffen(true)}
          className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700"
        >
          Bearbeiten
        </button>
      </div>

      {modalOffen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4 text-purple-700">Profil bearbeiten</h3>
            <form onSubmit={speichern} className="space-y-4">
              <input
                type="text"
                name="vorname"
                placeholder="Vorname"
                value={formulardaten.vorname}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <input
                type="text"
                name="nachname"
                placeholder="Nachname"
                value={formulardaten.nachname}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <input
                type="text"
                name="rolle"
                placeholder="Rolle"
                value={formulardaten.rolle}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
              <input
                type="date"
                name="eintrittsdatum"
                value={formulardaten.eintrittsdatum}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <input
                type="text"
                name="adresse"
                placeholder="Adresse"
                value={formulardaten.adresse}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
              <input
                type="text"
                name="telefon"
                placeholder="Telefonnummer"
                value={formulardaten.telefon}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOffen(false)}
                  className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mitarbeiter;
