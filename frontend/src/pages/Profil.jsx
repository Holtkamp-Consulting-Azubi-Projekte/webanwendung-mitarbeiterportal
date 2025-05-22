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

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUserData();
    fetchProjects(); // Projektliste beim Laden der Komponente abrufen
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
    // Wenn Profildaten geladen werden, coreHours aufsplitten
    if (userData.coreHours && (!userData.coreHoursStart || !userData.coreHoursEnd)) {
      const [start, end] = userData.coreHours.split('-');
      setUserData(prev => ({
        ...prev,
        coreHoursStart: start || '',
        coreHoursEnd: end || '',
      }));
    }
    // eslint-disable-next-line
  }, [userData.coreHours]);

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

  const fetchUserData = async () => {
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
      setUserData(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        navigate('/login');
      } else {
        setError('Fehler beim Laden der Benutzerdaten');
        console.error('Fehler beim Laden der Benutzerdaten:', err);
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
        const response = await axios.get('http://localhost:5050/api/projects', {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    // Kernarbeitszeit-Validierung vor dem Speichern
    if (!validateCoreHours(userData.coreHoursStart, userData.coreHoursEnd)) {
      setError('Bitte korrigiere die Kernarbeitszeit.');
      return;
    }
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }
      await axios.put('http://localhost:5050/api/profile', userData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      setSuccess('Profil erfolgreich aktualisiert');
      setIsEditing(false);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        navigate('/login');
      } else {
        setError('Fehler beim Speichern der Änderungen');
        console.error('Fehler beim Speichern:', err);
      }
    }
  };

  // Neue Funktion zum Ändern des Passworts
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Neues Passwort und Bestätigung stimmen nicht überein.');
      return;
    }

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        setPasswordError('Bitte füllen Sie alle Passwortfelder aus.');
        return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      await axios.put('http://localhost:5050/api/change-password', {
        currentPassword: currentPassword,
        newPassword: newPassword
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      setPasswordSuccess('Passwort erfolgreich geändert');
      // Felder leeren nach erfolgreicher Änderung
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Fehler beim Ändern des Passworts');
      console.error('Fehler beim Passwort ändern:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">👤 Mein Profil</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
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
                  {projects.map((project, index) => (
                    <option key={index} value={project}>{project}</option>
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
              <p className="mt-1 text-lg">{userData.currentProject || '-'}</p>
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
  