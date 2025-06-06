import React, { useState, useEffect } from "react";

// Hilfsfunktion: Kernarbeitszeit "08:30-17:00" → ["08:30", "17:00"]
function parseCoreHours(coreHours) {
  if (!coreHours) return ["", ""];
  const [start, end] = coreHours.split("-");
  return [start || "", end || ""];
}

const TimeEntryModal = ({ isOpen, onClose, onSave, initialData, availableProjekte, userProfile }) => {
  const [projekte, setProjekte] = useState([]);
  const [profile, setProfile] = useState(null);

  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  // Profil und Projekte beim Öffnen laden
  useEffect(() => {
    if (isOpen) {
      // Profil laden
      fetch("http://localhost:5050/api/profile", {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("access_token"),
        },
      })
        .then((res) => res.json())
        .then((data) => setProfile(data))
        .catch(() => setError("Profil konnte nicht geladen werden"));

      // Projekte laden
      fetch("http://localhost:5050/api/projects", {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("access_token"),
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data) => setProjekte(data))
        .catch(() => setError("Konnte Projekte nicht laden"));
    }
  }, [isOpen]);

  // Felder vorausfüllen, wenn Modal offen & Profil geladen
  useEffect(() => {
    if (isOpen && profile) {
      // coreHours z.B. "08:30-17:00"
      let coreStart = "";
      let coreEnd = "";
      if (profile.coreHours && profile.coreHours.includes("-")) {
        [coreStart, coreEnd] = profile.coreHours.split("-");
      }
      setDate(initialData?.date || new Date().toISOString().slice(0, 10));
      setStart(initialData?.start || coreStart);
      setEnd(initialData?.end || coreEnd);
      setProjectId(initialData?.project_id || profile.currentProject || "");
      setDescription(initialData?.description || "");
      setError("");
    }
  }, [isOpen, profile, initialData]);

  // Wenn Modal geöffnet wird und noch kein Profil geladen ist
  useEffect(() => {
    if (isOpen && !profile) {
      setDate(initialData?.date || new Date().toISOString().slice(0, 10));
      setStart(initialData?.start || "");
      setEnd(initialData?.end || "");
      setProjectId(initialData?.project_id || "");
      setDescription(initialData?.description || "");
      setError("");
    }
  }, [isOpen, initialData, profile]);

  // Projekt-Default setzen:
  useEffect(() => {
    if (isOpen && userProfile) {
      setProjectId(initialData?.project_id || userProfile.currentProject || "");
    }
  }, [isOpen, userProfile, initialData]);

  const handleSave = (e) => {
    e.preventDefault();
    console.log("Speichern aufgerufen mit date:", date); // Debugging-Ausgabe
    if (!date || !start || !end || !projectId) {
      setError("Bitte alle Pflichtfelder ausfüllen");
      return;
    }
    onSave({
      datum: date,
      beginn: start,
      ende: end,
      pause: "0",
      projekt: projectId ? [projectId] : [],
      beschreibung: description,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-4">Zeiteintrag erfassen</h2>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Datum*</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border rounded p-2"
              required
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block font-medium mb-1">Start*</label>
              <input
                type="time"
                value={start}
                onChange={e => setStart(e.target.value)}
                className="w-full border rounded p-2"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block font-medium mb-1">Ende*</label>
              <input
                type="time"
                value={end}
                onChange={e => setEnd(e.target.value)}
                className="w-full border rounded p-2"
                required
              />
            </div>
          </div>
          <div>
            <label className="block font-medium mb-1">Projekt*</label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full border rounded p-2"
              required
            >
              <option value="">Projekt wählen</option>
              {availableProjekte.map(projekt => (
                <option key={projekt.id} value={projekt.id}>
                  {projekt.name} {projekt.customer ? `(Kunde: ${projekt.customer})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Beschreibung</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="Optional"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              onClick={onClose}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimeEntryModal;