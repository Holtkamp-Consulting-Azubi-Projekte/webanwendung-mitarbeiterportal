import React from "react";

const TimeMatrixTable = ({ entries, onAddClick, onEditClick, onDeleteClick, filters, onFilterChange, availableProjekte }) => {
  // Corporate Design Button Klassen
  const cdButtonClasses = "text-primary border border-primary bg-transparent hover:text-white hover:bg-primary focus:ring-4 focus:outline-none focus:ring-primary font-medium rounded-lg text-sm px-5 py-2.5 text-center transition duration-200";
  const cdTableActionButtonClasses = "text-primary hover:text-primary-dark transition duration-200 text-sm mr-2"; // Angepasste Klassen für kleine Tabellen-Buttons
  const cdTableDeleteButtonClasses = "text-red-600 hover:text-red-800 transition duration-200 text-sm"; // Angepasste Klassen für kleinen Lösch-Button

  // Corporate Design Tabellenkopf Klassen
  const cdTableHeaderClasses = "border px-2 py-2 bg-primary text-white font-bold text-left"; // Angepasste Klassen für den Tabellenkopf

  // Funktion zur Berechnung der Arbeitszeit
  const calculateWorkTime = (beginn, ende, pause) => {
    // Annahme: beginn und ende sind im Format HH:MM
    if (!beginn || !ende) return "N/A";

    try {
      const [beginHour, beginMinute] = beginn.split(':').map(Number);
      const [endHour, endMinute] = ende.split(':').map(Number);

      const startDate = new Date(1970, 0, 1, beginHour, beginMinute);
      const endDate = new Date(1970, 0, 1, endHour, endMinute);

      // Wenn Endzeit vor Startzeit (über Mitternacht), addiere einen Tag zur Endzeit
      if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1);
      }

      let durationMs = endDate.getTime() - startDate.getTime();
      let durationMinutes = Math.floor(durationMs / (1000 * 60));

      // Pausenzeit abziehen
      const pauseMinutes = Number(pause) || 0; // Sicherstellen, dass Pause eine Zahl ist
      let workMinutes = durationMinutes - pauseMinutes;

      // Negative Arbeitszeit vermeiden
      if (workMinutes < 0) workMinutes = 0;

      // Arbeitszeit formatieren (H:MM)
      const hours = Math.floor(workMinutes / 60);
      const minutes = workMinutes % 60;

      return `${hours}h ${minutes}m`;

    } catch (e) {
      console.error("Fehler bei der Arbeitszeitberechnung:", e);
      return "Fehler";
    }
  };

  // Funktion zur Aufteilung von Projektname und Kunde
  const splitProjectAndCustomer = (projektString) => {
    if (!projektString) return { projectName: "N/A", customer: "" };
    const parts = projektString.match(/(.+)\s\(Kunde:\s(.+)\)/);
    if (parts && parts[1] && parts[2]) {
      return { projectName: parts[1].trim(), customer: `Kunde: ${parts[2].trim()}` };
    } else {
      return { projectName: projektString, customer: "" }; // Kein Kunde gefunden, nur Projektname zurückgeben
    }
  };

  // Funktion zur Formatierung des Datums von YYYY-MM-DD zu TT.MM.JJJJ
  const formatDateToDMY = (dateString) => {
    if (!dateString) return "N/A";
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    } else {
      return dateString; // Rückgabe des Originalstrings, falls Format unerwartet ist
    }
  };

  // Funktion zur Überprüfung, ob ein Datum der heutige Tag ist
  const isToday = (dateString) => {
      if (!dateString) return false;
      const today = new Date();
      const [year, month, day] = dateString.split('-').map(Number);
      // Monate in JavaScript sind 0-basiert
      const entryDate = new Date(year, month - 1, day);

      return entryDate.getFullYear() === today.getFullYear() &&
             entryDate.getMonth() === today.getMonth() &&
             entryDate.getDate() === today.getDate();
  };

  // Funktion zur Ermittlung des Wochentags
  const getWeekday = (dateString) => {
    if (!dateString) return "";
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      // Monate in JavaScript sind 0-basiert
      const date = new Date(year, month - 1, day);
      const weekdays = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
      return weekdays[date.getDay()];
    } catch (e) {
      console.error("Fehler bei der Ermittlung des Wochentags:", e);
      return "";
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Zeitmatrix</h2>
        <button
          className={cdButtonClasses}
          onClick={onAddClick}
        >
          Neuer Eintrag
        </button>
      </div>
      {/* Wrapper div für Scrollbarkeit */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="sticky top-0 bg-white z-10"> {/* Sticky Header */}
            <tr>
              <th className={cdTableHeaderClasses}>Mitarbeiter</th>
              <th className={cdTableHeaderClasses}>Datum</th>
              <th className={cdTableHeaderClasses}>Beginn</th>
              <th className={cdTableHeaderClasses}>Ende</th>
              <th className={cdTableHeaderClasses}>Pause (min)</th>
              <th className={cdTableHeaderClasses}>Arbeitszeit</th>
              <th className={cdTableHeaderClasses}>Projekt</th>
              <th className={cdTableHeaderClasses}>Arbeitsort</th>
              <th className={`${cdTableHeaderClasses} text-center`}>Aktionen</th>
            </tr>
            {/* Filter row */}
            <tr>
              <th className="border px-2 py-1">
                <input
                  type="text"
                  placeholder="Filtern..."
                  value={filters.mitarbeiter || ''}
                  onChange={(e) => onFilterChange('mitarbeiter', e.target.value)}
                  className="w-full px-1 py-0.5 text-sm border rounded"
                />
              </th>
              <th className="border px-2 py-1">
               <input
                  type="date"
                  value={filters.datum || ''}
                  onChange={(e) => onFilterChange('datum', e.target.value)}
                  className="w-full px-1 py-0.5 text-sm border rounded"
                />
              </th>
              <th className="border px-2 py-1">

              </th>
              <th className="border px-2 py-1">

              </th>
              <th className="border px-2 py-1">{/* Filter für Pause entfernt */}

              </th>
              <th className="border px-2 py-1">{/* Kein Filter für Arbeitszeit */}
                {/* Optional: Filter nach Stundenbereich später */}
              </th>
              <th className="border px-2 py-1">
                <select
                  value={filters.projekt || ''}
                  onChange={(e) => onFilterChange('projekt', e.target.value)}
                  className="w-full px-1 py-0.5 text-sm border rounded"
                >
                  {availableProjekte && availableProjekte.length > 0 ? (
                    availableProjekte.map((projekt) => (
                      <option key={projekt} value={projekt}>{projekt || "Alle"}</option>
                    ))
                  ) : ( /* Fallback-Option, wenn keine Projekte geladen sind */
                     <option value="">Lade Projekte...</option>
                  )}
                </select>
              </th>
              <th className="border px-2 py-1">
                 <select
                   value={filters.arbeitsort || ''}
                   onChange={(e) => onFilterChange('arbeitsort', e.target.value)}
                   className="w-full px-1 py-0.5 text-sm border rounded"
                 >
                   <option value="">Alle</option>
                   <option value="Büro">Büro</option>
                   <option value="Homeoffice">Homeoffice</option>
                   <option value="Kunde">Kunde</option>
                 </select>
              </th>
              <th className="border px-2 py-1">{/* Filter für Aktionen */}
                <button
                  className="text-gray-500 hover:text-gray-700 text-sm"
                  onClick={() => onFilterChange('all', '')}
                  title="Filter zurücksetzen"
                >
                  Zurücksetzen
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-4 text-gray-400">
                  Keine Einträge vorhanden
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const { projectName, customer } = splitProjectAndCustomer(entry.projekt);
                const rowClasses = isToday(entry.datum) ? "bg-purple-100 hover:bg-purple-200" : "hover:bg-gray-50"; // Hervorhebung und Hover-Effekt
                return (
                  <tr key={entry.id || Math.random()} className={rowClasses}>
                    <td className="border px-2 py-1">{entry.mitarbeiter}</td>
                    <td className="border px-2 py-1">
                      <div>{formatDateToDMY(entry.datum)}</div>
                      {entry.datum && <div className="text-xs text-gray-600">{getWeekday(entry.datum)}</div>}
                    </td>
                    <td className="border px-2 py-1">{entry.beginn}</td>
                    <td className="border px-2 py-1">{entry.ende}</td>
                    <td className="border px-2 py-1">{entry.pause}</td>
                    <td className="border px-2 py-1">{calculateWorkTime(entry.beginn, entry.ende, entry.pause)}</td>
                    <td className="border px-2 py-1">
                      <div>{projectName}</div>
                      {customer && <div className="text-xs text-gray-600">{customer}</div>}
                    </td>
                    <td className="border px-2 py-1">{entry.arbeitsort}</td>
                    <td className="border px-2 py-1 text-center">
                      <button
                        className={cdTableActionButtonClasses}
                        onClick={() => onEditClick(entry)}
                      >
                        Bearbeiten
                      </button>
                       <button
                        className={cdTableDeleteButtonClasses}
                        onClick={() => onDeleteClick(entry.id)}
                      >
                        Löschen
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimeMatrixTable; 