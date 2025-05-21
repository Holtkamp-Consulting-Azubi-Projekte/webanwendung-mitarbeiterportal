import React, { useState, useEffect } from "react";

const arbeitsorte = ["Büro", "Homeoffice", "Kunde"];

const TimeEntryModal = ({ isOpen, onClose, onSave, initialData, availableProjekte }) => {
  const [form, setForm] = useState({
    datum: "",
    beginn: "",
    ende: "",
    pause: "",
    projekt: "",
    arbeitsort: arbeitsorte[0],
    beschreibung: "",
    mitarbeiter: "",
  });
  const [errors, setErrors] = useState([]);

  // Formular mit initialen Daten füllen, wenn Modal geöffnet wird oder initialData sich ändert
  useEffect(() => {
    if (isOpen) {
      const defaultForm = {
        datum: "",
        beginn: "",
        ende: "",
        pause: "",
        projekt: "",
        arbeitsort: arbeitsorte[0],
        beschreibung: "",
        mitarbeiter: "",
      };

      if (initialData) {
        // Wenn initialData vorhanden ist, überschreibe die Standardwerte
        const projectString = Array.isArray(initialData.projekt) && initialData.projekt.length > 0 ? initialData.projekt[0] : initialData.projekt || "";
        setForm({ 
          ...defaultForm, 
          ...initialData, 
          projekt: projectString, 
          mitarbeiter: initialData.mitarbeiter || ""
        });
      } else {
         setForm(defaultForm);
      }
    } else {
      // Wenn Modal geschlossen ist, setzen Sie das Formular auf den leeren Zustand zurück
      setForm({
        datum: "",
        beginn: "",
        ende: "",
        pause: "",
        projekt: "",
        arbeitsort: arbeitsorte[0],
        beschreibung: "",
        mitarbeiter: "",
      });
    }
    
    setErrors([]);

  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProjectChange = (e) => {
    const selectedProject = e.target.value;
    setForm(prev => ({ ...prev, projekt: selectedProject }));
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

       if (endDate < startDate) {
           const beginMinutes = beginHour * 60 + beginMinute;
           const endMinutes = endHour * 60 + endMinute;
           if (endMinutes < beginMinutes) {
               alert("Endzeit muss nach Beginnzeit liegen.");
               return;
           }
       }
    }
    const pauseMinutes = Number(form.pause);
    if (form.pause !== '' && (isNaN(pauseMinutes) || pauseMinutes < 0)) {
         alert("Pause (min) muss eine positive Zahl sein.");
         return;
    }
    if (!form.projekt) {
         alert("Bitte ein Projekt auswählen.");
         return;
    }
    // Überprüfen des Mitarbeiters (sollte immer vorbelegt sein)
    if (!form.mitarbeiter) {
        alert("Mitarbeiterinformation fehlt.");
        return;
    }

    const dataToSave = { ...form, projekt: [form.projekt] };
    if (initialData && initialData.id) {
        dataToSave.id = initialData.id;
    }
    onSave(dataToSave);
  };

  if (!isOpen) return null;

  const modalTitle = initialData ? "Eintrag bearbeiten" : "Neuer Zeiteintrag";
  const saveButtonText = initialData ? "Änderungen speichern" : "Speichern";

  const cdSaveButtonClasses = "text-white bg-primary hover:bg-primary-dark focus:ring-4 focus:outline-none focus:ring-primary font-medium rounded-lg text-sm px-5 py-2.5 text-center transition duration-200";
  const cdCancelButtonClasses = "text-gray-700 bg-gray-200 hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-400 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition duration-200";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">{modalTitle}</h3>
        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Mitarbeiter Feld (schreibgeschützt) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Mitarbeiter</label>
            <input
              type="text"
              name="mitarbeiter"
              value={form.mitarbeiter}
              disabled
              className="w-full border px-2 py-1 rounded bg-gray-100"
            />
          </div>

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
          {/* Projekt Einzelauswahl */}
          <select
            name="projekt"
            value={form.projekt}
            onChange={handleProjectChange}
            required
            className="w-full border px-2 py-1 rounded"
          >
            <option value="">Bitte Projekt wählen</option>
            {availableProjekte && availableProjekte.length > 0 ? (
              availableProjekte.map((projekt) => (
                <option key={projekt} value={projekt}>
                  {projekt}
                </option>
              ))
            ) : (
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
           {/* Beschreibungsfeld */}
           <div>
               <label className="block text-sm font-medium text-gray-700">Beschreibung</label>
               <textarea
                   name="beschreibung"
                   value={form.beschreibung}
                   onChange={handleChange}
                   rows="3"
                   className="w-full border px-2 py-1 rounded"
               ></textarea>
           </div>

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