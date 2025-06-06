import React, { useState, useEffect, useMemo } from "react";
import TimeMatrixTable from "../components/TimeMatrixTable";
import TimeEntryModal from "../components/TimeEntryModal";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = "/api/time-entries";
const PROFILE_API_URL = "/api/profile"; // API-URL für Profil

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
  const [availableProjekte, setAvailableProjekte] = useState([]);

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
      const response = await axios.get('/api/profile', {
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

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch('/api/projects', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => setAvailableProjekte(
        data.map(p => ({
          id: p.hk_project,
          name: p.project_name,
          customer: p.customer_name
        }))
      ))
      .catch(err => {
        console.error("Fehler beim Laden der Projekte:", err);
        setAvailableProjekte([]);
      });
  }, []);

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
    console.log("Bearbeiten:", entry); // <--- Prüfen!
    setEditingEntry(entry);
    setNewEntryInitialData(null);
    setModalOpen(true);
  };

  const handleSaveEntry = (entryData) => {
    const dataToSave = { ...entryData };

    // ID aus editingEntry übernehmen, falls vorhanden
    if (editingEntry && editingEntry.id) {
      dataToSave.id = editingEntry.id;
    }

    // Datum prüfen/formatieren
    if (dataToSave.datum instanceof Date) {
      dataToSave.datum = dataToSave.datum.toISOString().split('T')[0];
    } else if (
      typeof dataToSave.datum !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dataToSave.datum)
    ) {
      console.error("Ungültiges Datumsformat vor dem Speichern:", dataToSave.datum);
      setError("Ungültiges Datumsformat. Eintrag kann nicht gespeichert werden.");
      setModalOpen(false);
      setEditingEntry(null);
      return;
    }
  
    // Einfach dataToSave verwenden! (keine neue Variable backendData nötig)
    console.log("Daten, die an das Backend gesendet werden:", dataToSave);
    console.log("Speichern/Bearbeiten:", dataToSave);
  
    let method;
    let url;
  
    if (editingEntry) {
      method = "PUT";
      url = `${API_URL}/${dataToSave.id}`; // <-- dataToSave.id muss existieren!
    } else {
      method = "POST";
      url = API_URL;
    }
  
    const token = localStorage.getItem('access_token');
  
    fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(dataToSave),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          console.error("HTTP Error Response Status:", res.status);
          console.error("HTTP Error Response Data:", errorData);
  
          if (errorData?.details) {
            console.error("Validierungsdetails vom Backend (aus Response Data):");
            console.error(errorData.details);
          } else if (errorData) {
            console.warn("'details' property not found in HTTP Error Response Data. Full data logged above.");
          }
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
        console.error(err);
        const errorMessage = err.message || "Ein unerwarteter Fehler ist beim Speichern aufgetreten.";
        setError(errorMessage);
        setModalOpen(false);
        setEditingEntry(null);
      });
  };

  const handleDeleteClick = (entryId) => {
    if (window.confirm("Soll dieser Eintrag wirklich gelöscht werden?")) {
      const token = localStorage.getItem('access_token'); // Token aus localStorage abrufen

      fetch(`${API_URL}/${entryId}`, {
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

  const getProjectNameById = (projectId) => {
    const project = availableProjekte.find(p => String(p.id) === String(projectId));
    return project
      ? `${project.name}${project.customer ? " (Kunde: " + project.customer + ")" : ""}`
      : projectId;
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
          {/* Dropdown für Projekt-Filter */}
          <select
            value={filters.projekt || ''}
            onChange={(e) => handleFilterChange('projekt', e.target.value)}
            className="w-full px-1 py-0.5 text-sm border rounded"
          >
            <option value="">Alle</option>
            {availableProjekte && availableProjekte.length > 0 ? (
              availableProjekte.map((projekt) => (
                <option
                  key={projekt.id}
                  value={projekt.id}
                >
                  {projekt.name} {projekt.customer ? `(Kunde: ${projekt.customer})` : ""}
                </option>
              ))
            ) : (
              <option value="">Lade Projekte...</option>
            )}
          </select>
        </div>
      )}
      <TimeEntryModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveEntry}   
        initialData={editingEntry || newEntryInitialData}
        availableProjekte={availableProjekte}
        userProfile={userProfile}
      />
    </div>
  );
}

export default Zeitmatrix;
