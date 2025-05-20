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
  const [newEntryInitialData, setNewEntryInitialData] = useState(null);

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

  // Liste der verfügbaren Projekte
  const availableProjekte = TEMPORARY_TEST_PROJEKTE;

  // Filterlogik
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      for (const key in filters) {
        const filterValue = filters[key];

        if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
          const lowerCaseFilterValue = String(filterValue).toLowerCase().trim();

          if (key === 'projekt') {
            const entryProjects = Array.isArray(entry.projekt)
              ? entry.projekt.map(p => String(p).toLowerCase().trim())
              : [String(entry.projekt).toLowerCase().trim()];

            const projectMatch = entryProjects.some(proj => proj.includes(lowerCaseFilterValue));
            if (!projectMatch) return false;
          }
          else if (key === 'datum') {
            const entryValue = String(entry[key]).toLowerCase();
            if (!entryValue.startsWith(lowerCaseFilterValue)) return false;
          }
          else if (key === 'arbeitsort') {
            const entryValue = String(entry[key]).toLowerCase().trim();
            if (entryValue !== lowerCaseFilterValue) return false;
          }
          else {
            const entryValue = String(entry[key]).toLowerCase().trim();
            if (!entryValue.includes(lowerCaseFilterValue)) return false;
          }
        }
      }
      return true;
    });
  }, [entries, filters]);

  // Chronologische Sortierung (nach Datum und Beginnzeit)
  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      // Zuerst nach Datum sortieren
      const dateA = new Date(a.datum);
      const dateB = new Date(b.datum);
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      
      // Bei gleichem Datum nach Beginnzeit sortieren
      const timeA = new Date(`1970-01-01T${a.beginn}`);
      const timeB = new Date(`1970-01-01T${b.beginn}`);
      return timeA - timeB;
    });
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

  const handleAddClick = (initialDateData) => {
    setEditingEntry(null);
    setNewEntryInitialData(initialDateData || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingEntry(null);
    setNewEntryInitialData(null);
  };

  const handleEditClick = (entry) => {
    setEditingEntry(entry);
    setNewEntryInitialData(null);
    setModalOpen(true);
  };

  const handleSaveEntry = (entryData) => {
    if (!editingEntry) {
      // Beim Hinzufügen: Mitarbeiter festlegen (kann später durch Login ersetzt werden)
      entryData.mitarbeiter = "Marco";
    }

    let method;
    let url;

    if (editingEntry) {
      // Wenn wir einen bestehenden Eintrag bearbeiten
      method = "PUT";
      // Verwende die ID aus den übergebenen entryData
      url = `${API_URL}${entryData.id}`;
    } else {
      // Wenn wir einen neuen Eintrag hinzufügen
      method = "POST";
      url = API_URL; // Basis-URL für POST
    }

    fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entryData),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then(data => {
            console.error("Backend-Fehlerdaten:", data);
            throw new Error(data.error || "Fehler beim Speichern: Unbekannter Fehler");
          });
        }
        return res.json();
      })
      .then(() => {
        fetchEntries();
        setModalOpen(false);
        setEditingEntry(null);
      })
      .catch((err) => {
        console.error("Fehler beim Speichern/Aktualisieren des Eintrags:", err);
        setError(err.message);
        if (!err.message.includes("Validierungsfehler")) {
          setModalOpen(false);
          setEditingEntry(null);
        }
      });
  };

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
          entries={sortedEntries}
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
        initialData={editingEntry || newEntryInitialData}
        availableProjekte={availableProjekte}
      />
    </div>
  );
}
  