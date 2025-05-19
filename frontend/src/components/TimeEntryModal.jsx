import React, { useState, useEffect } from "react";

const arbeitsorte = ["Büro", "Homeoffice", "Kunde"];

const TimeEntryModal = ({ isOpen, onClose, onSave, initialData, availableProjekte }) => {
  const [form, setForm] = useState({
    datum: "",
    beginn: "",
    ende: "",
    pause: "",
    projekt: [], // Jetzt ein Array
    arbeitsort: arbeitsorte[0],
  });

  // Formular mit initialen Daten füllen, wenn Modal geöffnet wird oder initialData sich ändert
  useEffect(() => {
    if (isOpen && initialData) {
      // Stelle sicher, dass projekt ein Array ist
      const projektArray = Array.isArray(initialData.projekt) ? initialData.projekt : [initialData.projekt];
      setForm({ ...initialData, projekt: projektArray });
    } else if (isOpen && !initialData) {
      // Formular zurücksetzen, wenn neues Modal geöffnet wird
      setForm({
        datum: "",
        beginn: "",
        ende: "",
        pause: "",
        projekt: [], // Leeres Array für neue Einträge
        arbeitsort: arbeitsorte[0],
      });
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Neue Funktion für die Mehrfachauswahl von Projekten
  const handleProjectChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setForm(prev => ({ ...prev, projekt: selectedOptions }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Client-seitige Validierung
    if (!form.datum) {
      alert("Bitte Datum eingeben.");
      return;
    }
    if (!form.beginn) {
      alert("Bitte Beginnzeit eingeben.");
      return;
    }
    // Überprüfen der Endzeit nur, wenn sie eingegeben wurde
    if (form.ende) {
      const [beginHour, beginMinute] = form.beginn.split(':').map(Number);
      const [endHour, endMinute] = form.ende.split(':').map(Number);
      const startDate = new Date(1970, 0, 1, beginHour, beginMinute);
      const endDate = new Date(1970, 0, 1, endHour, endMinute);

       // Wenn Endzeit vor Startzeit UND es ist derselbe Tag, ist es ungültig
       // Über Mitternacht liegende Zeiten werden hier als gültig betrachtet (kann bei Bedarf angepasst werden)
       if (endDate < startDate) {
           // Eine einfachere Prüfung, die Mitternachtsüberschreitung ignoriert:
           const beginMinutes = beginHour * 60 + beginMinute;
           const endMinutes = endHour * 60 + endMinute;
           if (endMinutes < beginMinutes) {
               alert("Endzeit muss nach Beginnzeit liegen.");
               return;
           }
       }
    }
    // Überprüfen der Pausenzeit
    const pauseMinutes = Number(form.pause);
    if (form.pause !== '' && (isNaN(pauseMinutes) || pauseMinutes < 0)) {
         alert("Pause (min) muss eine positive Zahl sein.");
         return;
    }
     // Überprüfen, ob mindestens ein Projekt ausgewählt ist (wenn required)
    if (form.projekt.length === 0) {
         alert("Bitte mindestens ein Projekt auswählen.");
         return;
    }

    // Beim Speichern die ID mitgeben, wenn vorhanden (Bearbeiten)
    onSave(initialData ? { ...form, id: initialData.id } : form);
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
            className="w-full border px-2 py-1 rounded"
          />
          {/* Projekt Mehrfachauswahl */}
          <select
            name="projekt"
            value={form.projekt}
            onChange={handleProjectChange}
            required
            multiple
            className="w-full border px-2 py-1 rounded h-32"
          >
            {availableProjekte && availableProjekte.length > 0 ? (
              availableProjekte.map((projekt) => (
                <option key={projekt} value={projekt}>
                  {projekt || "Bitte Projekt wählen"}
                </option>
              ))
            ) : (
              <option value="">Lade Projekte...</option>
            )}
          </select>
          <div className="text-xs text-gray-500">
            Halten Sie die Strg-Taste (Windows) oder die Cmd-Taste (Mac) gedrückt, um mehrere Projekte auszuwählen.
          </div>
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