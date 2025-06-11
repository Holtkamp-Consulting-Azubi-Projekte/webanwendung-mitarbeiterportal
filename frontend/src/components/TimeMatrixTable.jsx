import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

// Einfache Version des Beschreibungs-Popup
const DescriptionPopup = ({ description }) => {
  if (!description) return null;
  
  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    bg-white p-6 rounded-lg shadow-xl border border-gray-300 z-50
                    max-w-lg w-full max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Beschreibung</h3>
        <button className="text-gray-500 hover:text-gray-700" id="closePopup">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <div className="text-gray-700 whitespace-pre-wrap">{description}</div>
    </div>
  );
};

// Overlay für den Hintergrund
const Overlay = ({ onClose }) => (
  <div 
    className="fixed inset-0 bg-black bg-opacity-50 z-40"
    onClick={onClose}
  />
);

const TimeMatrixTable = ({
  entries,
  onAddClick,
  onEditClick,
  onDeleteClick,
  filters,
  onFilterChange,
  availableProjekte
}) => {
  // State für den Popup-Dialog
  const [activeDescription, setActiveDescription] = useState(null);
  
  // Popup schließen, wenn ESC gedrückt wird
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setActiveDescription(null);
      }
    };
    
    if (activeDescription) {
      document.addEventListener('keydown', handleEsc);
      // Scrolling auf dem Body verhindern
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      // Scrolling wiederherstellen
      document.body.style.overflow = '';
    };
  }, [activeDescription]);
  
  // Popup schließen, wenn auf das X oder den Hintergrund geklickt wird
  useEffect(() => {
    const closeBtn = document.getElementById('closePopup');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => setActiveDescription(null));
      
      return () => {
        closeBtn.removeEventListener('click', () => setActiveDescription(null));
      };
    }
  }, [activeDescription]);
  
  // Gruppierung der Einträge nach Datum
  const entriesByDate = entries.reduce((acc, entry) => {
    const date = entry.datum;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {});

  // Funktion zur Berechnung der Arbeitsstunden pro Tag
  const calculateTotalHours = (entriesForDay) => {
    return entriesForDay.reduce((total, entry) => {
      if (!entry.beginn || !entry.ende) return total;
      
      const [startHour, startMinute] = entry.beginn.split(':').map(Number);
      const [endHour, endMinute] = entry.ende.split(':').map(Number);
      
      let minutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
      // Pause abziehen, falls vorhanden
      if (entry.pause) {
        minutes -= parseInt(entry.pause, 10);
      }
      
      return total + (minutes / 60);
    }, 0).toFixed(1);
  };

  const handleFilterReset = () => {
    onFilterChange('all', '');
  };

  // Berechnung der Arbeitsstunden (Ende - Beginn - Pause)
  const calculateWorkingHours = (entry) => {
    if (!entry.beginn || !entry.ende) return '-';
    
    const [beginHours, beginMinutes] = entry.beginn.split(':').map(Number);
    const [endHours, endMinutes] = entry.ende.split(':').map(Number);
    
    let totalMinutes = (endHours * 60 + endMinutes) - (beginHours * 60 + beginMinutes);
    
    // Pause abziehen
    totalMinutes -= Number(entry.pause || 0);
    
    // Minuten in Stunden und Minuten umrechnen
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  // Formatierung des Datums
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = parseISO(dateString);
    return format(date, 'dd.MM.yyyy', { locale: de });
  };

  return (
    <div className="overflow-x-auto relative">
      {/* Overlay und Popup für Beschreibungen */}
      {activeDescription && (
        <>
          <Overlay onClose={() => setActiveDescription(null)} />
          <DescriptionPopup description={activeDescription} />
        </>
      )}
      
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Zeiteinträge</h2>
        
        <div className="flex space-x-2">
          <button 
            onClick={handleFilterReset}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
          >
            Filter zurücksetzen
          </button>
        </div>
      </div>
      
      <table className="min-w-full bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border-b-2 border-gray-200 text-left">
              Datum
              <input
                type="date"
                value={filters.datum || ''}
                onChange={(e) => onFilterChange('datum', e.target.value)}
                className="w-full px-1 py-0.5 text-sm border rounded mt-1"
              />
            </th>
            <th className="py-2 px-4 border-b-2 border-gray-200 text-left">
              Projekt
              {/* Projektfilter wird außerhalb der Tabelle angezeigt */}
            </th>
            <th className="py-2 px-4 border-b-2 border-gray-200 text-left">
              Arbeitsort
              <select
                value={filters.arbeitsort || ''}
                onChange={(e) => onFilterChange('arbeitsort', e.target.value)}
                className="w-full px-1 py-0.5 text-sm border rounded mt-1"
              >
                <option value="">Alle</option>
                <option value="Büro">Büro</option>
                <option value="Home-Office">Home-Office</option>
                <option value="Kunde">Beim Kunden</option>
                <option value="Unterwegs">Unterwegs</option>
              </select>
            </th>
            <th className="py-2 px-4 border-b-2 border-gray-200 text-left">Zeit</th>
            <th className="py-2 px-4 border-b-2 border-gray-200 text-center">Stunden</th>
            <th className="py-2 px-4 border-b-2 border-gray-200 text-right">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(entriesByDate).map(([date, dayEntries]) => (
            <React.Fragment key={date}>
              {/* Datumszeile mit Summe */}
              <tr className="border-t border-gray-200 bg-gray-50">
                <td colSpan="4" className="py-2 px-4 font-medium">
                  {format(new Date(date), 'EEEE, dd.MM.yyyy', { locale: de })}
                </td>
                <td className="py-2 px-4 text-center font-medium">
                  {calculateTotalHours(dayEntries)}h
                </td>
                <td className="py-2 px-4 text-right">
                  <button
                    onClick={() => onAddClick(date)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Neuer Eintrag für dieses Datum"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </td>
              </tr>
              
              {/* Einträge für dieses Datum */}
              {dayEntries.map((entry, index) => {
                // Erstelle einen zusammengesetzten Key aus ID und Index
                const uniqueKey = `${entry.id}-${index}`;
                
                return (
                  <tr key={uniqueKey} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b border-gray-200"></td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      {Array.isArray(entry.projekt) 
                        ? entry.projekt.map((projektId) => {
                            const projekt = availableProjekte?.find(p => String(p.id) === String(projektId));
                            return projekt ? `${projekt.name}${projekt.customer ? ` (${projekt.customer})` : ''}` : projektId;
                          }).join(', ')
                        : entry.projekt
                      }
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      {entry.arbeitsort}
                    </td>
                    <td className="px-4 py-2 border-b">
                      {entry.beginn} - {entry.ende} 
                      {entry.pause ? `(${entry.pause} min Pause)` : ''}
                      {entry.beschreibung && (
                        <button 
                          className="ml-2 p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDescription(entry.beschreibung);
                          }}
                          title="Beschreibung anzeigen"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-center">
                      {calculateWorkingHours(entry)}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => onEditClick(entry)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Bearbeiten"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDeleteClick(entry.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Löschen"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
          {Object.keys(entriesByDate).length === 0 && (
            <tr>
              <td colSpan="6" className="py-4 text-center text-gray-500">
                Keine Einträge gefunden. Füge einen neuen Eintrag hinzu.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TimeMatrixTable;