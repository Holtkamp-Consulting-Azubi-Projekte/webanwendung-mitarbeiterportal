import React, { useState, useEffect } from "react";

const arbeitsorte = ["Büro", "Homeoffice", "Kunde"];

const TimeEntryModal = ({ isOpen, onClose, onSave, initialData, availableProjekte }) => {
  const [form, setForm] = useState({
    mitarbeiter: "",
    datum: "",
    beginn: "",
    ende: "",
    pause: "",
    projekt: "",
    arbeitsort: arbeitsorte[0],
  });

  // Formular mit initialen Daten füllen, wenn Modal geöffnet wird oder initialData sich ändert
  useEffect(() => {
    if (isOpen && initialData) {
      setForm(initialData);
    } else if (isOpen && !initialData) {
      // Formular zurücksetzen, wenn neues Modal geöffnet wird
       setForm({
        mitarbeiter: "",
        datum: "",
        beginn: "",
        ende: "",
        pause: "",
        projekt: availableProjekte && availableProjekte.length > 0 ? availableProjekte[0] : "", // Erstes Projekt oder leer
        arbeitsort: arbeitsorte[0],
      });
    }
  }, [isOpen, initialData, availableProjekte]); // availableProjekte als Abhängigkeit hinzufügen


  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Beim Speichern die ID mitgeben, wenn vorhanden (Bearbeiten)
    onSave(initialData ? { ...form, id: initialData.id } : form);
    // Formular zurücksetzen (wird durch useEffect bei Modal-Schließen auch gemacht)
    // setForm({
    //   mitarbeiter: "",
    //   datum: "",
    //   beginn: "",
    //   ende: "",
    //   pause: "",
    //   projekt: "",
    //   arbeitsort: arbeitsorte[0],
    // });
  };

  if (!isOpen) return null;

  const modalTitle = initialData ? "Eintrag bearbeiten" : "Neuer Zeiteintrag";
  const saveButtonText = initialData ? "Änderungen speichern" : "Speichern";

  // Corporate Design Button Klassen (angepasst für Modal)
  const cdSaveButtonClasses = "text-white bg-primary hover:bg-primary-dark focus:ring-4 focus:outline-none focus:ring-primary font-medium rounded-lg text-sm px-5 py-2.5 text-center transition duration-200";
  const cdCancelButtonClasses = "text-gray-700 bg-gray-200 hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-400 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition duration-200"; // Grauer Button

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">{modalTitle}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            name="mitarbeiter"
            placeholder="Mitarbeiter"
            value={form.mitarbeiter}
            onChange={handleChange}
            required
            className="w-full border px-2 py-1 rounded"
          />
          <input
            type="date"
            name="datum"
            value={form.datum}
            onChange={handleChange}
            required
            className="w-full border px-2 py-1 rounded"
          />
          <div className="flex gap-2">
            <input
              type="time"
              name="beginn"
              value={form.beginn}
              onChange={handleChange}
              required
              className="w-full border px-2 py-1 rounded"
            />
            <input
              type="time"
              name="ende"
              value={form.ende}
              onChange={handleChange}
              required
              className="w-full border px-2 py-1 rounded"
            />
          </div>
          <input
            type="number"
            name="pause"
            placeholder="Pause (min)"
            value={form.pause}
            onChange={handleChange}
            min="0"
            required
            className="w-full border px-2 py-1 rounded"
          />
          {/* Projekt Dropdown */}
          <select
            name="projekt"
            value={form.projekt}
            onChange={handleChange}
            required
            className="w-full border px-2 py-1 rounded"
          >
            {/* Überprüfen, ob availableProjekte vorhanden und nicht leer ist */}
            {availableProjekte && availableProjekte.length > 0 ? (
              availableProjekte.map((projekt) => (
                <option key={projekt} value={projekt}>{projekt || "Bitte Projekt wählen"}</option>
              ))
            ) : ( /* Fallback-Option, wenn keine Projekte geladen sind */
               <option value="">Lade Projekte...</option>
            )}
          </select>
          <select
            name="arbeitsort"
            value={form.arbeitsort}
            onChange={handleChange}
            className="w-full border px-2 py-1 rounded"
          >
            {arbeitsorte.map((ort) => (
              <option key={ort} value={ort}>{ort}</option>
            ))}
          </select>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className={cdCancelButtonClasses}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className={cdSaveButtonClasses}
            >
              {saveButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimeEntryModal; 