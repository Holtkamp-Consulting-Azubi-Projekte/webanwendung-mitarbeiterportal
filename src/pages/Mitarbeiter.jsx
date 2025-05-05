import { useEffect, useState } from "react";

const Mitarbeiter = () => {
  const [user, setUser] = useState(null);
  const [fehlermeldung, setFehlermeldung] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [speichernErfolg, setSpeichernErfolg] = useState(false);
  const [validierungsFehler, setValidierungsFehler] = useState("");
  const [hinweisOben, setHinweisOben] = useState(false);
  const [bearbeitenDaten, setBearbeitenDaten] = useState({
    vorname: "",
    nachname: "",
    rolle: "",
    eintrittsdatum: ""
  });

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email) {
      setFehlermeldung("Kein Benutzer angemeldet.");
      return;
    }

    fetch(`http://localhost:5050/api/user/${email}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Benutzer konnte nicht geladen werden.");
        }
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setBearbeitenDaten({
          vorname: data.vorname || "",
          nachname: data.nachname || "",
          rolle: data.rolle || "",
          eintrittsdatum: data.eintrittsdatum || ""
        });
      })
      .catch((err) => setFehlermeldung(err.message));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBearbeitenDaten((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-xl mx-auto mt-8 bg-white p-6 shadow rounded">
      <h2 className="text-2xl font-bold mb-4 text-purple-700">Mein Profil</h2>

      {/* Hinweis oben nach erfolgreicher Änderung */}
      {hinweisOben && (
        <div className="mb-4 px-4 py-2 bg-green-100 text-green-700 rounded text-sm text-center">
          Profil wurde erfolgreich aktualisiert.
        </div>
      )}

      {fehlermeldung && (
        <p className="text-red-600 text-sm mb-4">{fehlermeldung}</p>
      )}

      {!user && !fehlermeldung && (
        <p className="text-gray-500">Lade Benutzerdaten...</p>
      )}

      {user && (
        <>
          <ul className="text-sm leading-6 space-y-2">
            <li><strong>Vorname:</strong> {user.vorname}</li>
            <li><strong>Nachname:</strong> {user.nachname}</li>
            <li><strong>E-Mail:</strong> {user.email}</li>
            <li><strong>Rolle:</strong> {user.rolle}</li>
            <li><strong>Eintrittsdatum:</strong> {user.eintrittsdatum}</li>
          </ul>

          <div className="mt-6 text-center">
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700"
            >
              Profil bearbeiten
            </button>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-purple-700">Profil bearbeiten</h3>

            {/* Fehlermeldung */}
            {validierungsFehler && (
              <div className="mb-4 px-4 py-2 bg-red-100 text-red-700 rounded text-sm">
                {validierungsFehler}
              </div>
            )}

            {/* Erfolgsnachricht im Modal */}
            {speichernErfolg && (
              <div className="mb-4 px-4 py-2 bg-green-100 text-green-700 rounded text-sm">
                Profil wurde erfolgreich gespeichert.
              </div>
            )}

            <form className="space-y-4">
              <input
                type="text"
                name="vorname"
                value={bearbeitenDaten.vorname}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                placeholder="Vorname"
              />
              <input
                type="text"
                name="nachname"
                value={bearbeitenDaten.nachname}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                placeholder="Nachname"
              />
              <input
                type="text"
                name="rolle"
                value={bearbeitenDaten.rolle}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                placeholder="Rolle"
              />
              <input
                type="date"
                name="eintrittsdatum"
                value={bearbeitenDaten.eintrittsdatum}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSpeichernErfolg(false);
                    setValidierungsFehler("");
                  }}
                  className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  onClick={async (e) => {
                    e.preventDefault();
                    setValidierungsFehler("");

                    if (
                      !bearbeitenDaten.vorname.trim() ||
                      !bearbeitenDaten.nachname.trim() ||
                      !bearbeitenDaten.rolle.trim() ||
                      !bearbeitenDaten.eintrittsdatum
                    ) {
                      setValidierungsFehler("Alle Felder müssen ausgefüllt sein.");
                      return;
                    }

                    const datum = new Date(bearbeitenDaten.eintrittsdatum);
                    if (isNaN(datum.getTime())) {
                      setValidierungsFehler("Bitte ein gültiges Eintrittsdatum angeben.");
                      return;
                    }

                    const email = localStorage.getItem("email");

                    const response = await fetch(`http://localhost:5050/api/user/${email}`, {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(bearbeitenDaten),
                    });

                    if (response.ok) {
                      setSpeichernErfolg(true);
                      setHinweisOben(true);
                      setUser((prev) => ({
                        ...prev,
                        ...bearbeitenDaten,
                      }));
                      setTimeout(() => {
                        setShowModal(false);
                        setSpeichernErfolg(false);
                        setValidierungsFehler("");
                        setHinweisOben(false);
                      }, 3000);
                    } else {
                      setValidierungsFehler("Fehler beim Speichern ❌");
                    }
                  }}
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
