import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    position: '',
    currentProject: '',
    coreHours: '',
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
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
              <div>
                <label className="block text-sm font-medium text-gray-700">Kernarbeitszeit</label>
                <input
                  type="text"
                  name="coreHours"
                  value={userData.coreHours || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                />
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
              <p className="mt-1 text-lg">{userData.coreHours || '-'}</p>
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
  