import React, { useState, useEffect, useMemo } from "react";
import TimeMatrixTable from "../components/TimeMatrixTable";
import TimeEntryModal from "../components/TimeEntryModal";

const API_URL = "http://localhost:5050/api/time-entries/";

// Temporäre Liste von Projekten für Testzwecke
const TEMPORARY_TEST_PROJEKTE = [
  '', // Option für 'Alle' / Leere Auswahl im Modal
  "Mitarbeiterportal (Kunde: Holtkamp Consulting)",
  "SAP Administration (Kunde: Winkelmann AG)",
  "Treasor (Kunde: Agentur für Arbeit)",
  "Data Vault (Kunde: APO Bank)",
 
];

export default function Zeitmatrix() {
  const [entries, setEntries] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'datum', direction: 'ascending' }); // Standard-Sortierung

  // Einträge vom Backend laden
  const fetchEntries = () => {
    setLoading(true);
    setError(null);
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Netzwerkantwort war nicht ok.");
        return res.json();
      })
      .then((data) => {
        setEntries(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fehler beim Laden der Einträge:", err);
        setError("Fehler beim Laden der Einträge");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // Liste der verfügbaren Projekte (jetzt temporär fest codiert)
  const availableProjekte = TEMPORARY_TEST_PROJEKTE;

  // Filterlogik
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      for (const key in filters) {
        const filterValue = filters[key];

        // Nur filtern, wenn ein Filterwert gesetzt ist
        if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
          const lowerCaseFilterValue = String(filterValue).toLowerCase().trim();

          // Spezielle Behandlung für das 'projekt'-Feld (kann Array sein)
          if (key === 'projekt') {
            const entryProjects = Array.isArray(entry.projekt)
              ? entry.projekt.map(p => String(p).toLowerCase().trim())
              : [String(entry.projekt).toLowerCase().trim()];

            // Prüfen, ob der Filterwert als Teilstring in einem der Projekte des Eintrags enthalten ist
            const projectMatch = entryProjects.some(proj => proj.includes(lowerCaseFilterValue));

            if (!projectMatch) {
              return false; // Eintrag ausschließen, wenn Filterwert nicht als Teilstring in den Projekten gefunden wurde
            }
          }
          // Spezielle Behandlung für das 'datum'-Feld (startsWith)
          else if (key === 'datum') {
             const entryValue = String(entry[key]).toLowerCase();
             if (!entryValue.startsWith(lowerCaseFilterValue)) {
                return false;
             }
          }
          // Spezielle Behandlung für 'arbeitsort' (exakter Match)
          else if (key === 'arbeitsort') {
              const entryValue = String(entry[key]).toLowerCase().trim();
              if (entryValue !== lowerCaseFilterValue) {
                  return false;
              }
          }
          // Standardbehandlung für andere Felder (includes)
          else {
             const entryValue = String(entry[key]).toLowerCase().trim();
             if (!entryValue.includes(lowerCaseFilterValue)) {
               return false;
             }
          }
        }
      }
      return true; // Eintrag beibehalten, wenn alle Filterbedingungen erfüllt sind
    });
  }, [entries, filters]);

  // Sortierlogik (nach Datum, dann nach Beginnzeit)
  const sortedAndFilteredEntries = useMemo(() => {
    // Erstelle eine Kopie, um das ursprüngliche Array nicht zu verändern
    const sortableEntries = [...filteredEntries];

    if (!sortConfig.key) { // Keine Sortierung angewendet
      return sortableEntries;
    }

    sortableEntries.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Behandlung für verschiedene Datentypen (string, number)
      if (typeof aValue === 'string' && typeof bValue === 'string') {
         // Spezielle Behandlung für Datum und Zeit für korrekte chronologische Sortierung
         if (sortConfig.key === 'datum' || sortConfig.key === 'beginn' || sortConfig.key === 'ende') {
             const dateA = new Date(`1970-01-01T${aValue}`); // Dummy-Datum für Zeitvergleich
             const dateB = new Date(`1970-01-01T${bValue}`);
             if (dateA < dateB) return sortConfig.direction === 'ascending' ? -1 : 1;
             if (dateA > dateB) return sortConfig.direction === 'ascending' ? 1 : -1;
             return 0;
         } else { // Standard String-Vergleich
            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
         }
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        // Numerischer Vergleich
        return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
      } else { // Fallback für andere Typen oder gemischte Typen (z.B. N/A)
        // Behandle null/undefined Werte als kleiner als alles andere
        if (aValue == null && bValue != null) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue != null && bValue == null) return sortConfig.direction === 'ascending' ? 1 : -1;
        if (aValue == null && bValue == null) return 0;
        // Versuche string-Vergleich als Fallback
        const stringA = String(aValue);
        const stringB = String(bValue);
        if (stringA < stringB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (stringA > stringB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      }
    });

    return sortableEntries;
  }, [filteredEntries]);

  // Funktion zum Ändern der Sortierung
  const handleSort = (key) => {
    let direction = 'ascending';
    // Wenn bereits nach dieser Spalte sortiert wird, wechsle die Richtung
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      // Wenn absteigend sortiert und nochmal geklickt, Sortierung für diese Spalte entfernen (oder Standard setzen)
      // Hier setzen wir es zurück auf die Standard-Sortierung nach Datum aufsteigend
       setSortConfig({ key: 'datum', direction: 'ascending' });
       return;
    }
    // Setze die neue Sortierung
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (key, value) => {
    if (key === 'all') {
      setFilters({});
    } else {
      setFilters((prevFilters) => ({
        ...prevFilters,
        [key]: value,
      }));
    }
  };

  const handleAddClick = () => {
    setEditingEntry(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingEntry(null);
  };

  const handleEditClick = (entry) => {
    setEditingEntry(entry);
    setModalOpen(true);
  };

  // Eintrag speichern oder aktualisieren
  const handleSaveEntry = (entryData) => {
    // Temporäre Lösung: Mitarbeiter festlegen, da Login-Logik noch fehlt.
    // TODO: Ersetzen durch den tatsächlich eingeloggten Benutzer, sobald die Login-Logik implementiert ist.
    if (!editingEntry) { // Nur bei neuen Einträgen den Mitarbeiter setzen
      entryData.mitarbeiter = "Marco"; // Temporärer Standardwert
    }

    const method = editingEntry ? "PUT" : "POST";
    const url = editingEntry ? `${API_URL}${editingEntry.id}` : API_URL;

    fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entryData),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Fehler beim Speichern");
        return res.json();
      })
      .then(() => {
        fetchEntries();
      })
      .catch((err) => {
        console.error("Fehler beim Speichern/Aktualisieren des Eintrags:", err);
        setError("Fehler beim Speichern/Aktualisieren des Eintrags");
      });
    setModalOpen(false);
    setEditingEntry(null);
  };

  // Eintrag löschen
  const handleDeleteClick = (entryId) => {
    if (window.confirm("Soll dieser Eintrag wirklich gelöscht werden?")) {
      fetch(`${API_URL}${entryId}`, {
        method: "DELETE",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Fehler beim Löschen");
          return res.json();
        })
        .then(() => {
          fetchEntries();
        })
        .catch((err) => {
          console.error("Fehler beim Löschen des Eintrags:", err);
          setError("Fehler beim Löschen des Eintrags");
        });
    }
  };

  return (
    <div className="p-8">
      {/* <h1 className="text-2xl font-bold text-primary mb-6">⌛️ Zeitmatrix</h1> */}
      {loading ? (
        <div>Lade Einträge...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <TimeMatrixTable
          entries={sortedAndFilteredEntries}
          onAddClick={handleAddClick}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
          filters={filters}
          onFilterChange={handleFilterChange}
          availableProjekte={availableProjekte}
          onSort={handleSort}
          sortConfig={sortConfig}
        />
      )}
      <TimeEntryModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveEntry}
        initialData={editingEntry}
        availableProjekte={availableProjekte}
      />
    </div>
  );
}
  