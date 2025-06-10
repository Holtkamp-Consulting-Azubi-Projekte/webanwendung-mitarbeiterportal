import React, { useState, useEffect, useMemo } from "react";
import TimeMatrixTable from "../components/TimeMatrixTable";
import TimeEntryModal from "../components/TimeEntryModal";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = "/api/time-entries";
const PROJECTS_API_URL = "/api/projects"; // API-URL für Projekte
const PROFILE_API_URL = "/api/profile"; // API-URL für Profil

/**
 * `Zeitmatrix` Seite zur Anzeige und Verwaltung der Zeiteinträge.
 * Lädt Zeiteinträge, Projekte und Benutzerprofildaten vom Backend.
 * Integriert die TimeMatrixTable und das TimeEntryModal.
 * Bietet Funktionen zum Hinzufügen, Bearbeiten, Löschen, Filtern und Sortieren von Zeiteinträgen.
 */
const Zeitmatrix = () => {
  const [entries, setEntries] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [filters, setFilters] = useState({});
  const [newEntryInitialData, setNewEntryInitialData] = useState(null);
  
  // State für Benutzerprofildaten
  const [zeitmatrixUserData, setZeitmatrixUserData] = useState(null);

  const navigate = useNavigate();
  
  // Lade Projektliste
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(PROJECTS_API_URL, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Log für Debugging
        console.log("Geladene Projekte:", response.data);
        
        // Überprüfe ob Daten im erwarteten Format sind
        if (Array.isArray(response.data) && response.data.length > 0) {
          // Stelle sicher, dass jedes Projekt eine eindeutige ID hat
          const projekteWithIds = response.data.map(projekt => {
            // Falls keine ID vorhanden ist, generiere eine basierend auf dem Namen
            if (!projekt.id && !projekt.hk_project) {
              return {
                ...projekt,
                id: `project-${projekt.name || projekt.project_name}-${Math.random().toString(36).substr(2, 9)}`
              };
            }
            // Falls ID unter anderem Namen (z.B. hk_project) vorhanden ist
            if (!projekt.id && projekt.hk_project) {
              return {
                ...projekt,
                id: projekt.hk_project,
                name: projekt.project_name || projekt.name // Stelle sicher, dass name existiert
              };
            }
            return projekt;
          });
          
          setAvailableProjects(projekteWithIds);
        } else {
          console.error("Unerwartetes Datenformat von API:", response.data);
          setAvailableProjects([]);
        }
      } catch (err) {
        console.error("Fehler beim Laden der Projekte:", err);
        // Keine Fallback-Daten mehr, stattdessen leeres Array
        setAvailableProjects([]);
        
        // Bei 401 Unauthorized - zurück zum Login
        if (err.response && err.response.status === 401) {
          navigate('/');
        }
      }
    };
    
    fetchProjects();
  }, [navigate]);
  
  // Zeiteinträge und Profildaten laden
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('access_token');
        
        // Nur Zeiteinträge laden
        const entriesResponse = await axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setEntries(entriesResponse.data);
        
        // Optional: Auch Profildaten laden, falls benötigt
        try {
          const profileResponse = await axios.get(PROFILE_API_URL, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setZeitmatrixUserData(profileResponse.data);
        } catch (profileErr) {
          console.log("Profilabfrage fehlgeschlagen, verwende Standardwerte:", profileErr);
          setZeitmatrixUserData({
            coreHours: "09:00 - 17:00"
          });
        }
      } catch (err) {
        console.error("Fehler beim Laden der Zeiteinträge:", err);
        setError("Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.");
        
        // Bei 401 Unauthorized - zurück zum Login
        if (err.response && err.response.status === 401) {
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Filter-Funktion
  const handleFilterChange = (field, value) => {
    setFilters(prev => {
      if (value === "" || value === 'all') {
        const newFilters = { ...prev };
        delete newFilters[field];
        return newFilters;
      }
      return { ...prev, [field]: value };
    });
  };

  // Gefilterte Einträge
  const filteredEntries = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    
    return entries.filter(entry => {
      // Datum-Filter
      if (filters.datum && entry.datum !== filters.datum) {
        return false;
      }
      
      // Projekt-Filter
      if (filters.projekt && entry.projekt !== filters.projekt) {
        return false;
      }
      
      // Arbeitsort-Filter
      if (filters.arbeitsort && entry.arbeitsort !== filters.arbeitsort) {
        return false;
      }
      
      return true;
    });
  }, [entries, filters]);

  // Modal für neuen Eintrag öffnen
  const handleAddEntry = (date = null) => {
    setEditingEntry(null);
    
    // Standardwerte für neuen Eintrag
    const initialData = {
      datum: date || new Date().toISOString().split('T')[0],
      beginn: zeitmatrixUserData?.coreHours?.split('-')[0].trim() || '09:00',
      ende: zeitmatrixUserData?.coreHours?.split('-')[1].trim() || '17:00',
      pause: '30',
      projekt: [],
      arbeitsort: 'Büro',
      beschreibung: ''
    };
    
    setNewEntryInitialData(initialData);
    setModalOpen(true);
  };

  // Eintrag bearbeiten
  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setNewEntryInitialData(null);
    setModalOpen(true);
  };

  const handleSaveEntry = async (formData) => {
    try {
      setError(null);
      const token = localStorage.getItem('access_token');
      
      let response;
      if (editingEntry) {
        // Bestehenden Eintrag aktualisieren
        response = await axios.put(
          `${API_URL}/${editingEntry.id}`, 
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Neuen Eintrag erstellen
        response = await axios.post(
          API_URL, 
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      if (response.data.success) {
        // Nach erfolgreicher Speicherung Einträge komplett neu laden 
        // statt lokale State-Updates zu machen
        await fetchEntries();
        
        setModalOpen(false);
        setEditingEntry(null);
        setNewEntryInitialData(null);
      } else {
        setError(response.data.error || "Unbekannter Fehler beim Speichern");
      }
    } catch (err) {
      console.error("Fehler beim Speichern:", err);
      setError(`Fehler beim Speichern: ${err.response?.data?.error || err.message || 'Unbekannter Fehler'}`);
    }
  };

  // Die fetchEntries-Funktion solltest du optimieren, um Duplikate zu vermeiden:
  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Stellen sicher, dass keine Duplikate vorhanden sind, 
      // indem wir ein Map-Objekt basierend auf der ID verwenden
      const entriesMap = new Map();
      response.data.forEach(entry => {
        entriesMap.set(entry.id, entry);
      });
      
      // In ein Array zurückkonvertieren, um keine Duplikate zu haben
      const uniqueEntries = Array.from(entriesMap.values());
      
      setEntries(uniqueEntries);
      setLoading(false);
    } catch (err) {
      console.error("Fehler beim Laden der Einträge:", err);
      setError(`Fehler beim Laden der Einträge: ${err.response?.data?.error || err.message || 'Unbekannter Fehler'}`);
      setLoading(false);
    }
  };

  // Eintrag löschen
  const handleDeleteEntry = async (id) => {
    if (!window.confirm("Möchten Sie diesen Zeiteintrag wirklich löschen?")) {
      return;
    }
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.delete(
        `${API_URL}/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Eintrag aus dem lokalen State entfernen
        setEntries(prev => prev.filter(entry => entry.id !== id));
      }
    } catch (err) {
      console.error("Fehler beim Löschen:", err);
      alert("Der Eintrag konnte nicht gelöscht werden. Bitte versuchen Sie es später erneut.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Zeitmatrix</h1>
        <button 
          onClick={() => handleAddEntry()}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
        >
          Neuer Eintrag
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center">
          <svg className="animate-spin h-10 w-10 mx-auto text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-3 text-gray-600">Zeiteinträge werden geladen...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="py-10 text-center border rounded-lg bg-gray-50">
          <svg className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-3 text-lg font-medium text-gray-900">Keine Zeiteinträge vorhanden</h3>
          <p className="mt-1 text-gray-500">Erstelle deinen ersten Zeiteintrag mit dem Button "Neuer Eintrag".</p>
          <div className="mt-6">
            <button
              onClick={() => handleAddEntry()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Neuer Eintrag
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Filter-Bereich */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Filter</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Projekt-Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Projekt
                </label>
                <select
                  value={filters.projekt || ''}
                  onChange={(e) => handleFilterChange('projekt', e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option key="all-projects" value="">Alle Projekte</option>
                  {availableProjects.map((projekt) => (
                    <option 
                      key={projekt.id || projekt.hk_project || `projekt-${projekt.name || projekt.project_name}`} 
                      value={projekt.name || projekt.project_name}
                    >
                      {projekt.name || projekt.project_name} {projekt.customer ? `(${projekt.customer})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Zeitmatrix-Tabelle */}
          <TimeMatrixTable 
            entries={filteredEntries}
            onAddClick={handleAddEntry}
            onEditClick={handleEditEntry}
            onDeleteClick={handleDeleteEntry}
            filters={filters}
            onFilterChange={handleFilterChange}
            availableProjekte={availableProjects}
          />
        </>
      )}

      {/* Modal zum Hinzufügen/Bearbeiten von Einträgen */}
      <TimeEntryModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveEntry}
        initialData={editingEntry || newEntryInitialData}
        availableProjekte={availableProjects}
        userProfile={zeitmatrixUserData}
      />
    </div>
  );
};

export default Zeitmatrix;
