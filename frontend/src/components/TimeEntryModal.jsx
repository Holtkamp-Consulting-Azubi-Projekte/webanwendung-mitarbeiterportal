import React, { useState, useEffect } from "react";

const arbeitsorte = ["Büro", "Homeoffice", "Kunde"];

const TimeEntryModal = ({ isOpen, onClose, onSave, initialData, availableProjekte, coreHours, userProfile }) => {
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    breakDuration: 0,
    project: '',
    workLocation: '',
    description: '',
    id: ''
  });
  const [timeWarning, setTimeWarning] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          date: initialData.datum || '',
          startTime: initialData.beginn || '',
          endTime: initialData.ende || '',
          breakDuration: Number(initialData.pause) || 0,
          project: Array.isArray(initialData.projekt) ? initialData.projekt[0] || '' : initialData.projekt || '',
          workLocation: initialData.arbeitsort || '',
          description: initialData.beschreibung || '',
          id: initialData.id,
        });
      } else {
        setFormData({
          date: '',
          startTime: '',
          endTime: '',
          breakDuration: 0,
          project: '',
          workLocation: '',
          description: ''
        });
      }
      setTimeWarning('');
    }
  }, [isOpen, initialData]);

  const checkCoreHours = () => {
    if (!coreHours || !formData.startTime || !formData.endTime) return;
    const [coreStart, coreEnd] = coreHours.split('-');
    if (formData.startTime < coreStart || formData.endTime > coreEnd) {
      setTimeWarning('Achtung: Der Eintrag liegt außerhalb der Kernarbeitszeit.');
    } else {
      setTimeWarning('');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (name === 'startTime' || name === 'endTime') {
      checkCoreHours();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
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
        {timeWarning && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            {timeWarning}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Datum</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              className="w-full border px-2 py-1 rounded"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              required
              className="w-full border px-2 py-1 rounded"
            />
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              className="w-full border px-2 py-1 rounded"
            />
          </div>
          <input
            type="number"
            name="breakDuration"
            placeholder="Pause (min)"
            value={formData.breakDuration}
            onChange={handleInputChange}
            min="0"
            className="w-full border px-2 py-1 rounded"
          />
          <select
            name="project"
            value={formData.project}
            onChange={handleInputChange}
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
            name="workLocation"
            value={formData.workLocation}
            onChange={handleInputChange}
            className="w-full border px-2 py-1 rounded"
          >
            {arbeitsorte.map((ort) => (
              <option key={ort} value={ort}>{ort}</option>
            ))}
          </select>
          <div>
            <label className="block text-sm font-medium text-gray-700">Beschreibung</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
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