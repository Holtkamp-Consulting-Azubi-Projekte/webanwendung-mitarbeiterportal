import React, { useEffect, useState } from "react";

export default function Mitarbeiter() {
  const [benutzerdaten, setBenutzerdaten] = useState(null);
  const [fehlerMeldung, setFehlerMeldung] = useState("");
  const [bearbeiten, setBearbeiten] = useState(false);
  const [aktualisiert, setAktualisiert] = useState(false);
  const [formDaten, setFormDaten] = useState({
    vorname: "",
    nachname: "",
    rolle: "",
    eintrittsdatum: "",
  });

  useEffect(() => {
    let email = localStorage.getItem("email");

    if (!email || email === "undefined" || email === "null") {
      setFehlerMeldung("Kein Benutzer angemeldet oder ungültige E-Mail.");
      return;
    }

    email = email.replaceAll('"', '');

    fetch(`http://localhost:5050/api/user/${email}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Benutzer konnte nicht geladen werden");
        }
        return res.json();
      })
      .then((data) => {
        setBenutzerdaten(data);
        setFormDaten(data);
      })
      .catch((err) => {
        setFehlerMeldung(err.message);
      });
  }, []);

  const handleChange = (e) => {
    setFormDaten({
      ...formDaten,
      [e.target.name]: e.target.value,
    });
  };

  const handleSpeichern = () => {
    const email = localStorage.getItem("email").replaceAll('"', '');

    if (!formDaten.vorname || !formDaten.nachname || !formDaten.eintrittsdatum) {
      setFehlerMeldung("Bitte alle Pflichtfelder ausfüllen.");
      return;
    }

    fetch(`http://localhost:5050/api/user/${email}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formDaten),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Fehler beim Speichern ❌");
        }
        return res.json();
      })
      .then(() => {
        setBenutzerdaten(formDaten);
        setBearbeiten(false);
        setAktualisiert(true);
        setTimeout(() => setAktualisiert(false), 3000);
      })
      .catch((err) => setFehlerMeldung(err.message));
  };

  if (fehlerMeldung) {
    return (
      <div className="text-red-600 text-center mt-8">{fehlerMeldung}</div>
    );
  }

  if (!benutzerdaten) {
    return <div className="text-center mt-8">Lade Benutzerdaten...</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded mt-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Mitarbeiterprofil</h1>

      {aktualisiert && (
        <div className="bg-green-100 text-green-800 p-2 rounded mb-4 text-center border border-green-300">
          Profil wurde erfolgreich aktualisiert ✅
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Vorname
          </label>
          <input
            type="text"
            name="vorname"
            value={formDaten.vorname}
            onChange={handleChange}
            disabled={!bearbeiten}
            className="w-full mt-1 px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nachname
          </label>
          <input
            type="text"
            name="nachname"
            value={formDaten.nachname}
            onChange={handleChange}
            disabled={!bearbeiten}
            className="w-full mt-1 px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Rolle
          </label>
          <input
            type="text"
            name="rolle"
            value={formDaten.rolle}
            onChange={handleChange}
            disabled={!bearbeiten}
            className="w-full mt-1 px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Eintrittsdatum
          </label>
          <input
            type="date"
            name="eintrittsdatum"
            value={formDaten.eintrittsdatum}
            onChange={handleChange}
            disabled={!bearbeiten}
            className="w-full mt-1 px-3 py-2 border rounded"
          />
        </div>
      </div>

      <div className="mt-6 text-center">
        {!bearbeiten ? (
          <button
            className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700"
            onClick={() => setBearbeiten(true)}
          >
            Bearbeiten
          </button>
        ) : (
          <button
            className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700"
            onClick={handleSpeichern}
          >
            Speichern
          </button>
        )}
      </div>
    </div>
  );
}
