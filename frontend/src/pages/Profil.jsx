import React from 'react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/**
 * `Profil` Seite zur Anzeige und Bearbeitung des Benutzerprofils.
 * Lädt Benutzerdaten vom Backend und ermöglicht die Aktualisierung von Informationen wie Name, Position, Projekt und Kernarbeitszeit.
 * Beinhaltet auch die Funktion zur Passwortänderung.
 */
export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    position: '',
    currentProject: '',
    coreHours: '',
    coreHoursStart: '',
    coreHoursEnd: '',
    telefon: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Neue States für Passwortänderung
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Neuer State für Projektliste
  const [projects, setProjects] = useState([]);

  const [coreHoursWarning, setCoreHoursWarning] = useState('');
  const [coreHoursError, setCoreHoursError] = useState('');

  const navigate = useNavigate();

  // Verbesserte initiale Datenladelogik
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Asynchrone selbstaufrufende Funktion zum Laden aller Daten
    (async () => {
      await fetchUserData();
      await fetchProjects();
    })();
  }, [navigate]);

  // Effekt zum automatischen Ausblenden der Erfolgsmeldung für Profil-Updates
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000); // Meldung nach 3 Sekunden ausblenden
      return () => clearTimeout(timer); // Timer beim Aufräumen löschen
    }
  }, [success]);

  // Effekt zum automatischen Ausblenden der Erfolgsmeldung für Passwortänderung
  useEffect(() => {
    if (passwordSuccess) {
      const timer = setTimeout(() => {
        setPasswordSuccess('');
      }, 3000); // Meldung nach 3 Sekunden ausblenden
      return () => clearTimeout(timer); // Timer beim Aufräumen löschen
    }
  }, [passwordSuccess]);

  useEffect(() => {
    // Wenn Profildaten geladen werden oder der Bearbeitungsmodus aktiviert wird,
    // stellen wir sicher, dass coreHours korrekt aufgespalten ist
    if (userData.coreHours && (!userData.coreHoursStart || !userData.coreHoursEnd)) {
      const [start, end] = userData.coreHours.split('-').map(time => time.trim());
      setUserData(prev => ({
        ...prev,
        coreHoursStart: start || '',
        coreHoursEnd: end || '',
      }));
    }
    // eslint-disable-next-line
  }, [userData.coreHours, isEditing]);

  useEffect(() => {
    // Validierung bei Änderung der Zeitfelder
    if (userData.coreHoursStart && userData.coreHoursEnd) {
      validateCoreHours(userData.coreHoursStart, userData.coreHoursEnd);
    } else {
      setCoreHoursError('');
      setCoreHoursWarning('');
    }
    // eslint-disable-next-line
  }, [userData.coreHoursStart, userData.coreHoursEnd]);

  // Verbesserte fetchUserData-Funktion
const fetchUserData = async () => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Sie sind nicht angemeldet');
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
    
    // Debug-Ausgabe
    console.log('Vom Server geladene Profildaten:', response.data);
    
    const data = response.data;
    
    // 1. Prüfe, ob im localStorage ein Projekt gespeichert ist
    const savedProject = localStorage.getItem('currentProject');
    console.log('Aus localStorage geladenes Projekt:', savedProject);
    
    // 2. Wenn vom Server kein Projekt kommt, verwende das aus dem localStorage
    if (!data.currentProject && savedProject) {
      console.log('Verwende gespeichertes Projekt aus localStorage:', savedProject);
      data.currentProject = savedProject;
    } 
    // 3. Wenn vom Server ein Projekt kommt, aktualisiere localStorage
    else if (data.currentProject) {
      console.log('Aktualisiere localStorage mit Projekt vom Server:', data.currentProject);
      localStorage.setItem('currentProject', data.currentProject);
    }
    
    if (data.coreHours && data.coreHours.includes('-')) {
      const [start, end] = data.coreHours.split('-').map(time => time.trim());
      data.coreHoursStart = start;
      data.coreHoursEnd = end;
    }
    
    setUserData(data);
    
    // Wenn ein Projekt gesetzt ist, stellen wir sicher, dass die Projektliste geladen ist
    if (data.currentProject && projects.length === 0) {
      await fetchProjects();
    }
    
    return data; // Daten zurückgeben für weitere Verarbeitung
  } catch (err) {
    console.error('Fehler beim Laden der Profildaten:', err);
    
    if (err.response?.status === 401) {
      setError('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.');
      navigate('/login');
    } else if (err.response?.status === 404) {
      setError('Benutzerprofil nicht gefunden. Bitte kontaktieren Sie den Administrator.');
    } else {
      setError('Fehler beim Laden der Profildaten. Bitte versuchen Sie es später erneut.');
    }
  }
};

  // Neue Funktion zum Abrufen der Projektliste
  const fetchProjects = async () => {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          // navigate('/login'); // Keine Weiterleitung hier, da es beim ersten Laden schon passiert
          return;
        }
        const response = await axios.get('/api/projects', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });
        setProjects(response.data);
    } catch (err) {
        console.error('Fehler beim Laden der Projekte:', err);
        // Optional: Fehlermeldung anzeigen
    }
};

// Verbesserte toggleEditMode-Funktion
const toggleEditMode = () => {
  if (!isEditing) {
    // Beim Wechsel in den Bearbeitungsmodus:
    // Sicherstellen, dass die Kernarbeitszeit korrekt aufgeteilt ist
    if (userData.coreHours && (!userData.coreHoursStart || !userData.coreHoursEnd)) {
      const [start, end] = userData.coreHours.split('-').map(time => time.trim());
      setUserData(prev => ({
        ...prev,
        coreHoursStart: start || '',
        coreHoursEnd: end || '',
      }));
    }
    
    // Sicherstellen, dass Projekte geladen sind, falls ein aktuelles Projekt gesetzt ist
    if (userData.currentProject && projects.length === 0) {
      fetchProjects();
    }
  } else {
    // Beim Verlassen des Bearbeitungsmodus
    // Kopie der aktuellen Daten speichern, damit das UI nicht flackert
    const originalData = { ...userData };
    
    // Daten vom Server neu laden
    fetchUserData().then(() => {
      // Wenn das Laden fehlschlägt oder die Projektreferenz verloren geht,
      // stellen wir sicher, dass das aktuelle Projekt erhalten bleibt
      if (originalData.currentProject) {
        setUserData(prev => {
          if (!prev.currentProject) {
            return { ...prev, currentProject: originalData.currentProject };
          }
          return prev;
        });
      }
    });
    
    // Projekte neu laden
    if (userData.currentProject) {
      fetchProjects();
    }
  }
  
  setIsEditing(!isEditing);
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'currentProject') {
      // Wenn sich das Projekt ändert, aktualisiere auch localStorage sofort
      if (value) {
        localStorage.setItem('currentProject', value);
      } else {
        localStorage.removeItem('currentProject');
      }
    }
    
    if (name === 'coreHoursStart' || name === 'coreHoursEnd') {
      const start = name === 'coreHoursStart' ? value : userData.coreHoursStart;
      const end = name === 'coreHoursEnd' ? value : userData.coreHoursEnd;
      setUserData(prev => ({
        ...prev,
        coreHoursStart: start,
        coreHoursEnd: end,
        coreHours: start && end ? `${start}-${end}` : ''
      }));
    } else {
      setUserData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Neue Funktion für Passwort-Input-Handling
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'currentPassword') {
      setCurrentPassword(value);
    } else if (name === 'newPassword') {
      setNewPassword(value);
    } else if (name === 'confirmNewPassword') {
      setConfirmNewPassword(value);
    }
  };

  const validateCoreHours = (start, end) => {
    setCoreHoursError('');
    setCoreHoursWarning('');
    if (!start || !end) return true;
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    if (endTime <= startTime) {
      setCoreHoursError('Die Endzeit muss nach der Startzeit liegen.');
      return false;
    }
    let diff = endTime - startTime;
    // Ab 6 Stunden Brutto-Arbeitszeit 30 Minuten Pause abziehen
    let pause = 0;
    if (diff > 360) {
      pause = 30;
      diff -= 30;
    }
    if (diff !== 480) {
      const stunden = Math.floor(diff / 60);
      const minuten = diff % 60;
      setCoreHoursWarning(`Die aktuelle Netto-Arbeitszeit beträgt ${stunden} Stunden${minuten > 0 ? ` und ${minuten} Minuten` : ''}. (Ab 6 Stunden wird 30 Minuten Pause abgezogen.) Die Kernarbeitszeit sollte genau 8 Stunden betragen.`);
    }
    return true;
  };

  // Neue Validierungsfunktion für Telefonnummern
  const validatePhoneNumber = (phone) => {
    // Einfache deutsche Telefonnummern-Validierung
    // Akzeptiert Formate wie: +49 123 456789, 0123 456789, +49123456789, etc.
    const regex = /^(\+[0-9]{2}|0)[0-9\s-]{7,}$/;
    return regex.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Kernarbeitszeit validieren
    if (userData.coreHoursStart && userData.coreHoursEnd) {
      const isValid = validateCoreHours(userData.coreHoursStart, userData.coreHoursEnd);
      if (coreHoursError) {
        return; // Formular nicht absenden, wenn Fehler vorliegen
      }
    }

    // Wenn Kernarbeitszeit vorhanden, formatiere sie für die API
    const formattedUserData = { ...userData };
    if (userData.coreHoursStart && userData.coreHoursEnd) {
      formattedUserData.coreHours = `${userData.coreHoursStart} - ${userData.coreHoursEnd}`;
    }

    // Das aktuelle Projekt explizit setzen
    const dataToSend = {
      ...formattedUserData,
      currentProject: formattedUserData.currentProject // Wichtig: Senden als currentProject
    };
    
    console.log('Sende Profildaten:', dataToSend);

    try {
      const response = await axios.put('/api/profile', dataToSend, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      // WICHTIG: Speichere das Projekt im localStorage
      if (dataToSend.currentProject) {
        console.log('Speichere Projekt in localStorage:', dataToSend.currentProject);
        localStorage.setItem('currentProject', dataToSend.currentProject);
      } else {
        console.log('Entferne Projekt aus localStorage');
        localStorage.removeItem('currentProject');
      }

      // Erfolgsmeldung anzeigen
      setSuccess('Profil erfolgreich aktualisiert');
      
      // Bearbeitungsmodus beenden
      setIsEditing(false);
      
      // WICHTIG: Speichere das aktuelle Projekt für den Vergleich
      const savedProject = dataToSend.currentProject;
      
      // Daten neu laden, um sicherzustellen, dass alles korrekt ist
      const updatedData = await fetchUserData();
      
      // WICHTIG NEU: Wenn das Projekt beim Neuladen nicht vorhanden ist, setze es manuell zurück
      if (savedProject && (!updatedData || !updatedData.currentProject)) {
        console.log('Projekt nach Neuladen nicht gefunden, setze zurück:', savedProject);
        setUserData(prev => ({
          ...prev,
          currentProject: savedProject
        }));
      }
      
      // Erfolgsmeldung nach einiger Zeit ausblenden
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Profils:', err);
      
      if (err.response?.status === 401) {
        setError('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.');
        navigate('/login');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      }
    }
  };

  // Neue Funktion zum Ändern des Passworts
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Die Passwörter stimmen nicht überein');
      return;
    }

    if (!currentPassword || !newPassword) {
      setPasswordError('Bitte füllen Sie alle Felder aus');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Das neue Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    const token = localStorage.getItem('access_token');

    try {
      const response = await axios.post('/api/change-password', {
        currentPassword,
        newPassword,
        confirmPassword: confirmNewPassword
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      setPasswordSuccess('Passwort erfolgreich geändert');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      console.error('Fehler beim Ändern des Passworts:', err);
      
      if (err.response?.status === 401) {
        setPasswordError('Das aktuelle Passwort ist falsch');
      } else if (err.response?.data?.message) {
        setPasswordError(err.response.data.message);
      } else if (err.response?.status === 500) {
        setPasswordError('Ein interner Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      } else {
        setPasswordError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      }
    }
  };

  // Debugging-Effekt für Projekt-Tracking
  useEffect(() => {
    console.log('Aktuelle Projektdaten:', {
      'userData.currentProject': userData.currentProject,
      'Projekt gefunden?': projects.length > 0 
        ? !!projects.find(p => p.hk_project === userData.currentProject) 
        : 'Projektliste leer',
      'Projektname': projects.length > 0 && userData.currentProject
        ? (projects.find(p => p.hk_project === userData.currentProject)?.project_name || 'Nicht gefunden')
        : 'Kein Projekt ausgewählt'
    });
  }, [userData.currentProject, projects]);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">👤 Mein Profil</h1>
          <button
            onClick={toggleEditMode}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
          >
            {isEditing ? 'Abbrechen' : 'Bearbeiten'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Vorname</label>
                <input
                  type="text"
                  name="firstName"
                  value={userData.firstName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nachname</label>
                <input
                  type="text"
                  name="lastName"
                  value={userData.lastName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">E-Mail</label>
                <input
                  type="email"
                  name="email"
                  value={userData.email}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Position</label>
                <input
                  type="text"
                  name="position"
                  value={userData.position || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Aktuelles Projekt</label>
                <select
                  name="currentProject"
                  value={userData.currentProject || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                >
                  <option value="">Projekt auswählen</option>
                  {projects.map((project) => (
                    <option key={project.hk_project} value={project.hk_project}>
                      {project.project_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Kernarbeitszeit</label>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Von</label>
                    <input
                      type="time"
                      name="coreHoursStart"
                      value={userData.coreHoursStart || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Bis</label>
                    <input
                      type="time"
                      name="coreHoursEnd"
                      value={userData.coreHoursEnd || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>
                {coreHoursError && (
                  <div className="mt-2 text-red-600 text-sm">{coreHoursError}</div>
                )}
                {coreHoursWarning && !coreHoursError && (
                  <div className="mt-2 text-yellow-600 text-sm">{coreHoursWarning}</div>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Die Kernarbeitszeit wird in der Zeitmatrix verwendet, um Zeiteinträge außerhalb dieser Zeit zu markieren.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefon</label>
                <input
                  type="tel"
                  name="telefon"
                  value={userData.telefon || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
              >
                Speichern
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Vorname</h3>
              <p className="mt-1 text-lg">{userData.firstName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Nachname</h3>
              <p className="mt-1 text-lg">{userData.lastName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">E-Mail</h3>
              <p className="mt-1 text-lg">{userData.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Position</h3>
              <p className="mt-1 text-lg">{userData.position || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Aktuelles Projekt</h3>
              <p className="mt-1 text-lg">
                {userData.currentProject ? 
                  (projects.length > 0 
                    ? (projects.find(p => p.hk_project === userData.currentProject)?.project_name || userData.currentProject)
                    : 'Projekt wird geladen...'
                  )
                  : '-'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Kernarbeitszeit</h3>
              <p className="mt-1 text-lg">
                {userData.coreHoursStart && userData.coreHoursEnd
                  ? `${userData.coreHoursStart} - ${userData.coreHoursEnd}`
                  : userData.coreHours || '-'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Telefon</h3>
              <p className="mt-1 text-lg">{userData.telefon || '-'}</p>
            </div>
          </div>
        )}

        {/* Passwort ändern Sektion */}
        <div className="mt-10 pt-6 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-primary mb-4">Passwort ändern</h2>

          {passwordError && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {passwordSuccess}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Aktuelles Passwort</label>
              <input
                type="password"
                name="currentPassword"
                value={currentPassword}
                onChange={handlePasswordInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Neues Passwort</label>
              <input
                type="password"
                name="newPassword"
                value={newPassword}
                onChange={handlePasswordInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Neues Passwort bestätigen</label>
              <input
                type="password"
                name="confirmNewPassword"
                value={confirmNewPassword}
                onChange={handlePasswordInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
              >
                Passwort ändern
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
