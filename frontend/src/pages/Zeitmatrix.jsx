import React, { useState, useEffect, useMemo } from "react";
import TimeMatrixTable from "../components/TimeMatrixTable";
import TimeEntryModal from "../components/TimeEntryModal";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = "http://localhost:5050/api/time-entries/";
const PROFILE_API_URL = "http://localhost:5050/api/profile"; // API-URL für Profil

// Temporäre Liste von Projekten für Testzwecke (könnte vom Backend kommen)
const TEMPORARY_TEST_PROJEKTE = [
  '', // Option für 'Alle' / Leere Auswahl im Modal
  "Mitarbeiterportal (Kunde: Holtkamp Consulting)",
  "SAP Administration (Kunde: Winkelmann AG)",
  "Treasor (Kunde: Agentur für Arbeit)",
  "Data Vault (Kunde: APO Bank)",
];

/**
 * `Zeitmatrix` Seite zur Anzeige und Verwaltung der Zeiteinträge.
 * Lädt Zeiteinträge und Benutzerprofildaten vom Backend.
 * Integriert die TimeMatrixTable und das TimeEntryModal.
 * Bietet Funktionen zum Hinzufügen, Bearbeiten, Löschen, Filtern und Sortieren von Zeiteinträgen.
 */
const Zeitmatrix = () => {
  const [entries, setEntries] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [filters, setFilters] = useState({});
  const [newEntryInitialData, setNewEntryInitialData] = useState(null);
  
  // State für Benutzerprofildaten
  const [zeitmatrixUserData, setZeitmatrixUserData] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // NEU: Profil-Daten

  const navigate = useNavigate();

  // Einträge vom Backend laden
  const fetchEntries = () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('access_token');

    if (!token) {
      navigate('/login');
      return;
    }

    fetch(API_URL, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then((res) => {
        if (res.status === 401) {
           localStorage.removeItem('access_token');
           navigate('/login');
           throw new Error("Nicht autorisiert"); // Beende die Ausführung nach Weiterleitung
        }
        if (!res.ok) throw new Error("Netzwerkantwort war nicht ok.");
        return res.json();
      })
      .then((data) => {
        setEntries(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fehler beim Laden der Einträge:", err);
        if (err.message !== "Nicht autorisiert") {
          setError("Fehler beim Laden der Einträge");
        }
        setLoading(false);
      });
  };

  // Benutzerprofildaten vom Backend laden
  const fetchZeitmatrixUserData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        // Weiterleitung erfolgt bereits in fetchEntries
        return;
      }

      const response = await axios.get(PROFILE_API_URL, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      setZeitmatrixUserData(response.data);
    } catch (err) {
      console.error('Fehler beim Laden der Benutzerdaten für Zeitmatrix:', err);
      // Fehlerbehandlung wie in Profil.jsx kann hier integriert werden, falls nötig
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await axios.get('http://localhost:5050/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      setUserProfile(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        navigate('/login');
      } else {
        setError('Fehler beim Laden der Profil-Daten');
        console.error('Fehler beim Laden der Profil-Daten:', err);
      }
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchZeitmatrixUserData(); // Benutzerdaten beim Laden der Komponente abrufen
    fetchUserProfile(); // NEU: Profil-Daten laden
  }, [navigate]);

  // Liste der verfügbaren Projekte
  const availableProjekte = TEMPORARY_TEST_PROJEKTE; // Oder später vom Backend laden

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

  const handleAddClick = (dateString) => {
    setEditingEntry(null);
    const [start, end] = userProfile?.coreHours?.split('-') || ['', ''];
    // Erstelle initialData für neuen Eintrag mit Backend-Feldnamen
    const initialDataForNewEntry = {
      datum: dateString, // Datum des Tages
      beginn: start, // Beginn aus Kernarbeitszeit
      ende: end, // Ende aus Kernarbeitszeit
      pause: "0", // Pause standardmäßig als String "0"
      projekt: [userProfile?.currentProject].filter(p => p) || [], // Projekt als Array, Standard aus userProfile
      arbeitsort: 'Büro', // Arbeitsort standardmäßig 'Büro'
      beschreibung: '', // Beschreibung leer
      mitarbeiter: zeitmatrixUserData ? `${zeitmatrixUserData.firstName} ${zeitmatrixUserData.lastName}` : '', // Mitarbeiter
      // Keine ID für neuen Eintrag
    };
    setNewEntryInitialData(initialDataForNewEntry);
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
    // Stelle sicher, dass das Datum im korrekten Format ist
    const dataToSave = { ...entryData };
    if (dataToSave.date instanceof Date) {
       dataToSave.date = dataToSave.date.toISOString().split('T')[0]; // Datum als YYYY-MM-DD String formatieren
    } else if (typeof dataToSave.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dataToSave.date)) {
        console.error("Ungültiges Datumsformat vor dem Speichern:", dataToSave.date);
        setError("Ungültiges Datumsformat. Eintrag kann nicht gespeichert werden.");
        setModalOpen(false); // Modal schließen bei ungültigem Datum
        setEditingEntry(null);
        return; // Speichern abbrechen
    }

    // Feldnamen von Frontend zu Backend anpassen
    const backendData = {
        datum: dataToSave.date, // date wird zu datum
        beginn: dataToSave.startTime, // startTime wird zu beginn
        ende: dataToSave.endTime, // endTime wird zu ende
        pause: String(dataToSave.breakDuration || 0), // breakDuration wird zu pause (als String)
        projekt: Array.isArray(dataToSave.project) ? dataToSave.project : [dataToSave.project].filter(p => p), // project wird zu projekt (als Array)
        arbeitsort: dataToSave.workLocation || '', // workLocation wird zu arbeitsort
        beschreibung: dataToSave.description || '', // description wird zu beschreibung
        mitarbeiter: dataToSave.mitarbeiter, // mitarbeiter bleibt gleich
        // id nur hinzufügen, wenn es ein bestehender Eintrag ist
        ...(dataToSave.id && { id: dataToSave.id })
    };

    console.log("Daten, die an das Backend gesendet werden:", backendData); // Logge die zu sendenden Daten

    let method;
    let url;

    if (editingEntry) {
      // Wenn wir einen bestehenden Eintrag bearbeiten
      method = "PUT";
      // Verwende die ID aus den übergebenen entryData
      url = `${API_URL}${dataToSave.id}`;
    } else {
      // Wenn wir einen neuen Eintrag hinzufügen
      method = "POST";
      url = API_URL; // Basis-URL für POST
    }

    const token = localStorage.getItem('access_token');

    fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(backendData), // backendData verwenden
    })
      .then(async (res) => {
        if (!res.ok) {
          // Versuche, die Fehlerdaten aus der Response zu lesen
          const errorData = await res.json().catch(() => null); // Versuche JSON zu parsen, fange Fehler wenn nicht JSON
          console.error("HTTP Error Response Status:", res.status);
          console.error("HTTP Error Response Data:", errorData);

          // Logge Validierungsdetails, falls vorhanden im errorData
          if (errorData?.details) {
              console.error("Validierungsdetails vom Backend (aus Response Data):");
              console.error(errorData.details);
          } else if (errorData) {
              console.warn("'details' property not found in HTTP Error Response Data. Full data logged above.");
          }
           // Wir werfen immer noch einen Fehler, damit der catch-Block ausgeführt wird
          throw new Error(errorData?.error || `HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(() => {
        fetchEntries();
        setModalOpen(false);
        setEditingEntry(null);
        setError(null);
      })
      .catch((err) => {
        console.error("Fehler beim Speichern/Aktualisieren des Eintrags (im Catch-Block):");
        // Hier loggen wir nur noch den Fehler selbst, da die Response-Details im then-Block geloggt werden sollten
        console.error(err);

        const errorMessage = err.message || "Ein unerwarteter Fehler ist beim Speichern aufgetreten.";
        setError(errorMessage);

        // Schließe das Modal bei jedem Fehler im Catch-Block
        setModalOpen(false);
        setEditingEntry(null);
      });
  };

  const handleDeleteClick = (entryId) => {
    if (window.confirm("Soll dieser Eintrag wirklich gelöscht werden?")) {
      const token = localStorage.getItem('access_token'); // Token aus localStorage abrufen

      fetch(`${API_URL}${entryId}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
    <div className="p-8 flex flex-col h-screen">
      {/* <h1 className="text-2xl font-bold text-primary mb-6">⌛️ Zeitmatrix</h1> */}
      {/* Der Inhalt dieses Containers soll den verfügbaren Platz ausfüllen und scrollbar sein */}
      {loading ? (
        <div className="flex-grow flex items-center justify-center">Lade Einträge...</div>
      ) : error ? (
        <div className="text-red-600 flex-grow">{error}</div>
      ) : (
        <div className="flex-grow overflow-y-auto">
          <TimeMatrixTable
            entries={sortedEntries}
            onAddClick={handleAddClick}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
            filters={filters}
            onFilterChange={handleFilterChange}
            availableProjekte={availableProjekte}
          />
        </div>
      )}
      <TimeEntryModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveEntry}
        initialData={editingEntry || newEntryInitialData}
        availableProjekte={availableProjekte}
        coreHours={userProfile?.coreHours}
        userProfile={userProfile}
      />
    </div>
  );
}
  