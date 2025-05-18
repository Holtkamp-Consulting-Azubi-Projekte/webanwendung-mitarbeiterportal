import React, { useState, useEffect, useMemo } from "react";
import TimeMatrixTable from "../components/TimeMatrixTable";
import TimeEntryModal from "../components/TimeEntryModal";

const API_URL = "http://localhost:5050/api/time-entries/";

// Temporäre Liste von Projekten für Testzwecke
const TEMPORARY_TEST_PROJEKTE = [
  '', // Option für 'Alle' / Leere Auswahl im Modal
  "Mitarbeiterportal (Kunde: Holtkam Consulting)",
  "SAP Administration (Kunde: Winkelmann AG)",
  "Treasor (Kunde: agentur für Arbeit)",
];

export default function Zeitmatrix() {
  const [entries, setEntries] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [filters, setFilters] = useState({});

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
        if (filters[key]) {
          const filterValue = String(filters[key]).toLowerCase();
          const entryValue = String(entry[key]).toLowerCase();

          if (key === 'datum') {
             if (!entryValue.startsWith(filterValue)) {
                return false;
             }
          }
          else if (key === 'arbeitsort' || key === 'projekt') {
              if (entryValue !== filterValue) {
                  return false;
              }
          }
          else if (!entryValue.includes(filterValue)) {
            return false;
          }
        }
      }
      return true;
    });
  }, [entries, filters]);

  // Sortierlogik (nach Datum, dann nach Beginnzeit)
  const sortedAndFilteredEntries = useMemo(() => {
    // Erstelle eine Kopie, um das ursprüngliche Array nicht zu verändern
    const sortableEntries = [...filteredEntries];

    sortableEntries.sort((a, b) => {
      // Sortiere nach Datum (string comparison funktioniert, da YYYY-MM-DD Format)
      if (a.datum < b.datum) return -1;
      if (a.datum > b.datum) return 1;

      // Wenn Datum gleich, sortiere nach Beginnzeit (string comparison funktioniert, da HH:MM Format)
      if (a.beginn < b.beginn) return -1;
      if (a.beginn > b.beginn) return 1;

      return 0; // Einträge sind gleich
    });

    return sortableEntries;
  }, [filteredEntries]);

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
  