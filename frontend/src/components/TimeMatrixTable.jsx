import React, { useState, useMemo } from "react";

const TimeMatrixTable = ({ entries, onAddClick, onEditClick, onDeleteClick, filters, onFilterChange, availableProjekte }) => {
  // Corporate Design Button Klassen
  const cdButtonClasses = "text-primary border border-primary bg-transparent hover:text-white hover:bg-primary focus:ring-4 focus:outline-none focus:ring-primary font-medium rounded-lg text-sm px-5 py-2.5 text-center transition duration-200";
  const cdTableActionButtonClasses = "text-primary hover:text-primary-dark transition duration-200 text-sm mr-2";
  const cdTableDeleteButtonClasses = "text-red-600 hover:text-red-800 transition duration-200 text-sm";
  const cdNewEntryButtonClasses = "text-primary hover:text-primary-dark transition duration-200 text-sm";

  // Corporate Design Tabellenkopf Klassen
  const cdTableHeaderClasses = "border px-2 py-2 bg-primary text-white font-bold text-left";

  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Funktion zum Umschalten des Dropdowns
  const toggleDropdown = (entryId) => {
    setOpenDropdownId(openDropdownId === entryId ? null : entryId);
  };

  // Funktion zur Generierung der Monatstage
  const generateMonthDays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Ersten Tag des Monats
    const firstDay = new Date(currentYear, currentMonth, 1);
    // Letzten Tag des Monats
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    const days = [];
    for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
      days.push(new Date(date));
    }
    return days;
  };

  // Funktion zur Formatierung eines Datumsobjekts in YYYY-MM-DD (lokale Zeit)
  const formatLocalDateToYYYYMMDD = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Monate sind 0-basiert
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Funktion zur Formatierung des Datums
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Funktion zur Ermittlung des Wochentags
  const getWeekday = (date) => {
    const weekdays = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
    return weekdays[date.getDay()];
  };

  // Funktion zur Überprüfung, ob ein Datum ein Wochenende ist
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sonntag, 6 = Samstag
  };

  // Funktion zur Überprüfung, ob ein Datum heute ist
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Funktion zur Berechnung der Arbeitszeit
  const calculateWorkTime = (beginn, ende, pause) => {
    if (!beginn || !ende) return 0;

    try {
      const [beginHour, beginMinute] = beginn.split(':').map(Number);
      const [endHour, endMinute] = ende.split(':').map(Number);

      const startDate = new Date(1970, 0, 1, beginHour, beginMinute);
      const endDate = new Date(1970, 0, 1, endHour, endMinute);

      if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1);
      }

      let durationMs = endDate.getTime() - startDate.getTime();
      let durationMinutes = Math.floor(durationMs / (1000 * 60));

      const pauseMinutes = Number(pause) || 0;
      let workMinutes = durationMinutes - pauseMinutes;

      if (workMinutes < 0) workMinutes = 0;

      return workMinutes;
    } catch (e) {
      console.error("Fehler bei der Arbeitszeitberechnung:", e);
      return 0;
    }
  };

  // Funktion zur Formatierung der Arbeitszeit
  const formatWorkTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Funktion zur Berechnung der Gesamtarbeitszeit
  const calculateTotalWorkTime = (entries) => {
    const totalMinutes = entries.reduce((total, entry) => {
      const minutes = calculateWorkTime(entry.beginn, entry.ende, entry.pause);
      return total + minutes;
    }, 0);
    return formatWorkTime(totalMinutes);
  };

  // Funktion zur Aufteilung von Projektname und Kunde
  const splitProjectAndCustomer = (projektString) => {
    if (!projektString || typeof projektString !== 'string') return { projectName: projektString || "N/A", customer: "" };
    const parts = projektString.match(/(.+)\s\(Kunde:\s(.+)\)/);
    if (parts && parts[1] && parts[2]) {
      return { projectName: parts[1].trim(), customer: `Kunde: ${parts[2].trim()}` };
    } else {
      return { projectName: projektString, customer: "" };
    }
  };

  // Funktion zur Formatierung des Datums von YYYY-MM-DD zu TT.MM.JJJJ
  const formatDateToDMY = (dateString) => {
    if (!dateString) return "N/A";
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    } else {
      return dateString;
    }
  };

  // Funktion zur Ermittlung des Wochentags
  const getWeekdayString = (dateString) => {
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

  // Filterlogik
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      for (const key in filters) {
        const filterValue = filters[key];

        // Ignoriere leere oder undefinierte Filterwerte
        if (filterValue === undefined || filterValue === null || filterValue === '') {
          continue; // Gehe zum nächsten Filter
        }

        const lowerCaseFilterValue = String(filterValue).toLowerCase().trim();

        if (key === 'projekt') {
          // Prüfe, ob eines der Projekte im Eintrag den Filterwert enthält
          const entryProjects = Array.isArray(entry.projekt)
            ? entry.projekt.map(p => String(p).toLowerCase().trim())
            : [String(entry.projekt || '').toLowerCase().trim()]; // Behandle auch nicht-Array-Formate und null/undefined

          const projectMatch = entryProjects.some(proj => proj.includes(lowerCaseFilterValue));
          if (!projectMatch) return false; // Eintrag stimmt nicht mit Projektfilter überein
        } else if (key === 'datum') {
          // Prüfe, ob das Datum exakt übereinstimmt
          const entryValue = String(entry[key]).toLowerCase();
          // Beim Datumsfilter muss das Datum exakt übereinstimmen
          if (entryValue !== lowerCaseFilterValue) return false; // Eintrag stimmt nicht mit Datumsfilter überein
        } else if (key === 'arbeitsort') {
          // Prüfe, ob der Arbeitsort exakt übereinstimmt
          const entryValue = String(entry[key] || '').toLowerCase().trim(); // Behandle null/undefined
          if (entryValue !== lowerCaseFilterValue) return false; // Eintrag stimmt nicht mit Arbeitsortfilter überein
        }
        // Füge hier bei Bedarf weitere Filterfelder hinzu
      }
      return true; // Eintrag stimmt mit allen gesetzten Filtern überein
    });
  }, [entries, filters]);

  // Chronologische Sortierung (nach Datum und Beginnzeit) - bleibt gleich, sortiert filteredEntries
  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      // Zuerst nach Datum sortieren
      const dateA = new Date(a.datum);
      const dateB = new Date(b.datum);
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;

      // Dann nach Beginnzeit sortieren
      const timeA = new Date(`1970-01-01T${a.beginn}`);
      const timeB = new Date(`1970-01-01T${b.beginn}`);
      return timeA - timeB;
    });
  }, [filteredEntries]);

  // Gruppiere die SORIERTEN Einträge nach Datum
  const groupedEntries = sortedEntries.reduce((acc, entry) => {
    const dateStr = entry.datum; // Datum ist bereits YYYY-MM-DD durch Backend/Modal
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(entry);
    return acc;
  }, {});

  // Generiere Monatstage (neu hier, da es im displayedDays useMemo verwendet wird)
  const monthDays = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    const days = [];
    for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
      days.push(new Date(date));
    }
    return days;
  }, []); // Leeres Array als Abhängigkeit, wird nur einmal berechnet

  // Ermittle die Tage, die angezeigt werden sollen, basierend auf den Filtern
  const displayedDays = useMemo(() => {
    const hasDateFilter = filters.datum !== undefined && filters.datum !== null && filters.datum !== '';
    const hasOtherFilters = Object.keys(filters).some(key => key !== 'datum' && filters[key] !== undefined && filters[key] !== null && filters[key] !== '');

    if (!hasDateFilter && !hasOtherFilters) {
      // Szenario 1: Keine Filter gesetzt. Zeige alle Tage des Monats an.
      return monthDays;
    } else if (hasDateFilter && !hasOtherFilters) {
      // Szenario 2: Nur Datumsfilter gesetzt. Zeige diesen Tag an (auch wenn er leer ist).
      const filterDate = new Date(filters.datum);
      return isNaN(filterDate.getTime()) ? [] : [filterDate];
    } else { // hasOtherFilters ist true (Szenario 3a oder 3b)
      // Szenarien 3a/3b: Andere Filter sind aktiv (mit oder ohne Datum)
      // Zeige nur Tage, die nach der Filterung Einträge haben.
      return Object.keys(groupedEntries).map(dateStr => new Date(dateStr));
    }
  }, [filters, groupedEntries, monthDays]);

  // Sortiere die anzuzeigenden Tage chronologisch
  displayedDays.sort((a, b) => a.getTime() - b.getTime());

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Zeitmatrix</h2>
      </div>
      {/* Statistik Gesamtarbeitszeit */}
      <div className="mb-4 text-lg font-semibold text-left">
        Gesamtarbeitszeit: {calculateTotalWorkTime(entries)}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="sticky top-0 bg-white z-10">
            <tr>
              <th className={cdTableHeaderClasses}>Datum</th>
              <th className={cdTableHeaderClasses}>Mitarbeiter</th>
              <th className={cdTableHeaderClasses}>Beginn</th>
              <th className={cdTableHeaderClasses}>Ende</th>
              <th className={cdTableHeaderClasses}>Pause (min)</th>
              <th className={cdTableHeaderClasses}>Arbeitszeit</th>
              <th className={cdTableHeaderClasses}>Projekt</th>
              <th className={cdTableHeaderClasses}>Arbeitsort</th>
              <th className={`${cdTableHeaderClasses} text-center`}>Aktionen</th>
            </tr>
            <tr className="bg-purple-100">
              <th className="border px-2 py-1"></th>
              <th className="border px-2 py-1">
                <input
                  type="date"
                  value={filters.datum || ''}
                  onChange={(e) => onFilterChange('datum', e.target.value)}
                  className="w-full px-1 py-0.5 text-sm border rounded"
                />
              </th>
              <th className="border px-2 py-1"></th>
              <th className="border px-2 py-1"></th>
              <th className="border px-2 py-1"></th>
              <th className="border px-2 py-1"></th>
              <th className="border px-2 py-1">
                <select
                  value={filters.projekt || ''}
                  onChange={(e) => onFilterChange('projekt', e.target.value)}
                  className="w-full px-1 py-0.5 text-sm border rounded"
                >
                  <option value="">Alle</option>
                  {availableProjekte && availableProjekte.length > 0 ? (
                    availableProjekte.map((projekt) => (
                      <option key={projekt} value={projekt}>{projekt}</option>
                    ))
                  ) : (
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
              <th className="border px-2 py-1 text-center">
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
            {displayedDays.map((date) => {
              const dateStr = formatLocalDateToYYYYMMDD(date);
              const dailyEntries = groupedEntries[dateStr] || [];
              const isWeekendDay = isWeekend(date);
              const isCurrentDay = isToday(date);
              const rowClasses = isWeekendDay ? "bg-gray-100" : isCurrentDay ? "bg-purple-100" : "hover:bg-gray-50";

              // Sortiere tägliche Einträge chronologisch
              dailyEntries.sort((a, b) => {
                const timeA = new Date(`1970-01-01T${a.beginn}`);
                const timeB = new Date(`1970-01-01T${b.beginn}`);
                return timeA - timeB;
              });

              const hasDateFilter = filters.datum !== undefined && filters.datum !== null && filters.datum !== '';
              const hasOtherFilters = Object.keys(filters).some(key => key !== 'datum' && filters[key] !== undefined && filters[key] !== null && filters[key] !== '');

              // Bestimme, ob die Zeile für Tage ohne Einträge angezeigt werden soll
              // Dies ist der Fall, wenn keine Einträge für den Tag vorhanden sind
              // UND (kein Filter gesetzt ist ODER nur der Datumsfilter gesetzt ist)
              const showEmptyRow = dailyEntries.length === 0 && (!hasOtherFilters && (!hasDateFilter || (hasDateFilter && formatLocalDateToYYYYMMDD(date) === filters.datum)));

              // Nur rendern, wenn Einträge vorhanden sind ODER die leere Zeile angezeigt werden soll
              if (dailyEntries.length === 0 && !showEmptyRow) {
                  return null; // Tag ohne Einträge bei anderen Filtern ausblenden
              }

              return (
                <React.Fragment key={dateStr}>
                  {dailyEntries.length > 0 ? (
                    dailyEntries.map((entry, index) => (
                      <tr key={`${dateStr}-${index}`} className={`${rowClasses} ${index === 0 ? 'border-t' : ''}`}>
                        <td className="border px-2 py-1">
                          {index === 0 && (
                            <div className="flex flex-col">
                              <div>{formatDateToDMY(entry.datum)}</div>
                              {entry.datum && <div className="text-xs text-gray-600">{getWeekdayString(entry.datum)}</div>}
                            </div>
                          )}
                        </td>
                        <td className="border px-2 py-1">{entry.mitarbeiter}</td>
                        <td className="border px-2 py-1">{entry.beginn}</td>
                        <td className="border px-2 py-1">{entry.ende}</td>
                        <td className="border px-2 py-1">{entry.pause}</td>
                        <td className="border px-2 py-1">{formatWorkTime(calculateWorkTime(entry.beginn, entry.ende, entry.pause))}</td>
                        <td className="border px-2 py-1">
                          {Array.isArray(entry.projekt) ? (
                            entry.projekt.map((proj, idx) => {
                              const { projectName, customer } = splitProjectAndCustomer(proj);
                              return (
                                <div key={idx}>
                                  <div>{projectName}</div>
                                  {customer && <div className="text-xs text-gray-600">{customer}</div>}
                                </div>
                              );
                            })
                          ) : (
                            (() => {
                              const { projectName, customer } = splitProjectAndCustomer(entry.projekt);
                              return (
                                <div>
                                  <div>{projectName}</div>
                                  {customer && <div className="text-xs text-gray-600">{customer}</div>}
                                </div>
                              );
                            })()
                          )}
                        </td>
                        <td className="border px-2 py-1">{entry.arbeitsort}</td>
                        <td className="border px-2 py-1 text-center relative">
                          {/* Dropdown Button */}
                          <button
                            className="text-gray-600 hover:text-gray-900 focus:outline-none"
                            onClick={() => toggleDropdown(entry.id)}
                            aria-expanded={openDropdownId === entry.id}
                            aria-haspopup="true"
                          >
                            Aktionen ▼
                          </button>

                          {/* Dropdown Menü */}
                          {openDropdownId === entry.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20">
                              <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                <button
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  role="menuitem"
                                  onClick={() => {
                                    onEditClick(entry);
                                    setOpenDropdownId(null); // Dropdown schließen
                                  }}
                                >
                                  Bearbeiten
                                </button>
                                <button
                                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                  role="menuitem"
                                  onClick={() => {
                                    onDeleteClick(entry.id);
                                    setOpenDropdownId(null); // Dropdown schließen
                                  }}
                                >
                                  Löschen
                                </button>
                                <button
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  role="menuitem"
                                  onClick={() => {
                                    onAddClick({ datum: formatLocalDateToYYYYMMDD(date) }); // Datum des aktuellen Eintrags übergeben
                                    setOpenDropdownId(null); // Dropdown schließen
                                  }}
                                >
                                  + Weiterer Eintrag
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    // Zeile für Tage ohne Einträge
                    <tr key={dateStr} className={rowClasses}>
                      {/* Datum Spalte */}
                      <td className="border px-2 py-1">
                        <div className="flex flex-col">
                          <div>{date.getDate()}.{date.getMonth() + 1}.{date.getFullYear()}</div>
                          <div className="text-xs text-gray-600">{getWeekday(date)}</div>
                        </div>
                      </td>
                      {/* Mitarbeiter Spalte */}
                      <td className="border px-2 py-1">-</td>
                      {/* Beginn Spalte */}
                      <td className="border px-2 py-1">-</td>
                      {/* Ende Spalte */}
                      <td className="border px-2 py-1">-</td>
                      {/* Pause Spalte */}
                      <td className="border px-2 py-1">-</td>
                      {/* Arbeitszeit Spalte */}
                      <td className="border px-2 py-1">-</td>
                      {/* Projekt Spalte */}
                      <td className="border px-2 py-1">-</td>
                      {/* Arbeitsort Spalte */}
                      <td className="border px-2 py-1">-</td>
                      {/* Aktionen Spalte */}
                      <td className="border px-2 py-1 text-center">
                        <button
                          className={cdNewEntryButtonClasses}
                          onClick={() => onAddClick({ datum: formatLocalDateToYYYYMMDD(date) })} // + Eintrag Button für leere Tage
                        >
                          + Eintrag
                        </button>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimeMatrixTable; 