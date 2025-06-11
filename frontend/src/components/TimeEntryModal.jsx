import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

const TimeEntryModal = ({ isOpen, onClose, onSave, initialData, availableProjekte, userProfile }) => {
  const [formData, setFormData] = useState({
    datum: '',
    beginn: '',
    ende: '',
    pause: '0',
    projekt: [],
    arbeitsort: 'Büro',
    beschreibung: '',
    mitarbeiter: ''
  });
  
  const [errors, setErrors] = useState({});

  // Formular mit initialData füllen, wenn vorhanden
  useEffect(() => {
    if (initialData) {
      // Sicherstellen, dass ein leeres Objekt verwendet wird, wenn initialData null ist
      const data = initialData || {};
      
      // Projekt als Array formatieren
      let projekte = data.projekt;
      if (!Array.isArray(projekte)) {
        projekte = projekte ? [projekte] : [];
      }
      
      setFormData({
        datum: data.datum || '',
        beginn: data.beginn || '',
        ende: data.ende || '',
        pause: data.pause || '0',
        projekt: projekte,
        arbeitsort: data.arbeitsort || 'Büro',
        beschreibung: data.beschreibung || '',
        mitarbeiter: data.mitarbeiter || ''
      });
      
      setErrors({});
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Reset spezifischer Fehler beim Ändern
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleProjektChange = (e) => {
    // Für die Einzelauswahl
    const projektId = e.target.value;
    
    setFormData({
      ...formData,
      projekt: [projektId]  // Als Array setzen, auch wenn nur ein Projekt ausgewählt werden kann
    });
    
    // Reset Projekt-Fehler
    if (errors.projekt) {
      setErrors({
        ...errors,
        projekt: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validierung für erforderliche Felder
    if (!formData.datum) newErrors.datum = 'Datum ist erforderlich';
    if (!formData.beginn) newErrors.beginn = 'Beginnzeit ist erforderlich';
    if (!formData.ende) newErrors.ende = 'Endzeit ist erforderlich';
    if (!formData.projekt || formData.projekt.length === 0) newErrors.projekt = 'Ein Projekt muss ausgewählt sein';
    
    // Validierung für Zeit (Ende muss nach Beginn sein)
    if (formData.beginn && formData.ende) {
      const [beginHours, beginMinutes] = formData.beginn.split(':').map(Number);
      const [endHours, endMinutes] = formData.ende.split(':').map(Number);
      
      if ((endHours < beginHours) || (endHours === beginHours && endMinutes <= beginMinutes)) {
        newErrors.ende = 'Endzeit muss nach Beginnzeit liegen';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Hier senden wir das projekt als Array, auch wenn nur ein Element
      onSave({
        ...formData,
        projekt: formData.projekt
      });
    }
  };
  
  const heute = new Date().toISOString().split('T')[0];
  
  // Verwendung der Kernarbeitszeiten aus dem Profil
  const setCoreHours = () => {
    if (userProfile?.coreHours) {
      const [startTime, endTime] = userProfile.coreHours.split('-');
      setFormData({
        ...formData,
        beginn: startTime.trim(),
        ende: endTime.trim()
      });
    }
  };

  return (
    <div className={`fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 ${isOpen ? '' : 'hidden'}`}>
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{initialData?.id ? 'Zeiteintrag bearbeiten' : 'Neuer Zeiteintrag'}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Datum */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Datum:
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                name="datum"
                value={formData.datum || ''}
                onChange={handleChange}
                className={`shadow appearance-none border ${errors.datum ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              />
              <button
                type="button"
                onClick={() => setFormData({...formData, datum: heute})}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              >
                Heute
              </button>
            </div>
            {errors.datum && <p className="text-red-500 text-xs italic mt-1">{errors.datum}</p>}
          </div>
          
          {/* Zeit */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Beginn:
              </label>
              <input
                type="time"
                name="beginn"
                value={formData.beginn || ''}
                onChange={handleChange}
                className={`shadow appearance-none border ${errors.beginn ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              />
              {errors.beginn && <p className="text-red-500 text-xs italic mt-1">{errors.beginn}</p>}
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Ende:
              </label>
              <input
                type="time"
                name="ende"
                value={formData.ende || ''}
                onChange={handleChange}
                className={`shadow appearance-none border ${errors.ende ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              />
              {errors.ende && <p className="text-red-500 text-xs italic mt-1">{errors.ende}</p>}
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Pause (Min):
              </label>
              <input
                type="number"
                min="0"
                name="pause"
                value={formData.pause || '0'}
                onChange={handleChange}
                className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          </div>
          
          {userProfile?.coreHours && (
            <div className="mb-4">
              <button
                type="button"
                onClick={setCoreHours}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              >
                Kernarbeitszeit übernehmen
              </button>
            </div>
          )}
          
          {/* Projekt - Einzelauswahl statt Mehrfachauswahl */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Projekt:
            </label>
            <select
              name="projekt"
              value={formData.projekt[0] || ''} // Wählt das erste Element aus dem Array
              onChange={handleProjektChange}
              className={`shadow appearance-none border ${errors.projekt ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
            >
              <option value="">Bitte wählen</option>
              {availableProjekte && availableProjekte.map((projekt) => (
                <option key={projekt.id} value={projekt.name}>
                  {projekt.name} {projekt.customer ? `(${projekt.customer})` : ''}
                </option>
              ))}
            </select>
            {errors.projekt && <p className="text-red-500 text-xs italic mt-1">{errors.projekt}</p>}
          </div>
          
          {/* Arbeitsort */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Arbeitsort:
            </label>
            <select
              name="arbeitsort"
              value={formData.arbeitsort || 'Büro'}
              onChange={handleChange}
              className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="Büro">Büro</option>
              <option value="Home-Office">Home-Office</option>
              <option value="Kunde">Beim Kunden</option>
              <option value="Unterwegs">Unterwegs</option>
            </select>
          </div>
          
          {/* Beschreibung */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Beschreibung:
            </label>
            <textarea
              name="beschreibung"
              value={formData.beschreibung || ''}
              onChange={handleChange}
              className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="3"
              placeholder="Optionale Beschreibung der durchgeführten Arbeiten"
            />
          </div>
          
          {/* Buttons */}
          <div className="flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
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