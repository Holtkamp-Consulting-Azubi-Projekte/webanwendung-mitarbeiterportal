import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * `AuthModal` Komponente für das Authentifizierungs-Modal (Login/Registrierung).
 * Steuert die Anzeige zwischen Login- und Registrierungsformularen.
 */
const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isLogin) {
      try {
        const response = await fetch('http://localhost:5050/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          setError('');
          const token = data.access_token;
          onLoginSuccess(token);
          setTimeout(() => {
            setSuccess(data.message || 'Anmeldung erfolgreich.');
            navigate('/app');
          }, 50);
        } else {
          setSuccess('');
          if (data.message && data.message.includes('nicht registriert')) {
            setError('Dieser Benutzer ist nicht registriert. Bitte registrieren Sie sich zuerst.');
            setTimeout(() => {
              setIsLogin(false);
            }, 3000);
          } else if (response.status === 401 || response.status === 404) {
            setError('Anmeldung fehlgeschlagen: Ungültige E-Mail oder Passwort.');
          } else if (data.message) {
            setError(data.message);
          } else {
            setError(`Fehler bei der Anmeldung: Status ${response.status}`);
          }
        }
      } catch (err) {
        console.error('Netzwerkfehler oder Fehler beim fetch:', err);
        setError('Verbindungsfehler. Bitte prüfen Sie Ihre Internetverbindung oder versuchen Sie es später erneut.');
        setSuccess('');
      }
    } else {
      if (formData.password !== formData.confirmPassword) {
        setError('Die Passwörter stimmen nicht überein');
        setSuccess('');
        return;
      }

      try {
        const response = await fetch('http://localhost:5050/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          setSuccess(data.message || 'Registrierung erfolgreich!');
          setError('');
          setTimeout(() => {
            setIsLogin(true);
            setFormData({
              firstName: '',
              lastName: '',
              email: '',
              password: '',
              confirmPassword: '',
            });
          }, 2000);
        } else {
          setSuccess('');
          if (data.message) {
            setError(data.message);
          } else {
            setError(`Fehler bei der Registrierung: Status ${response.status}`);
          }
        }
      } catch (err) {
        console.error('Netzwerkfehler oder Fehler beim fetch (Registrierung):', err);
        setError('Verbindungsfehler. Bitte prüfen Sie Ihre Internetverbindung oder versuchen Sie es später erneut.');
        setSuccess('');
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary">
            {isLogin ? 'Anmelden' : 'Registrieren'}
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-base">
                  Vorname
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required={!isLogin}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-base">
                  Nachname
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required={!isLogin}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-base">
              E-Mail
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-base">
              Passwort
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            />
          </div>

          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-base">
                Passwort bestätigen
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required={!isLogin}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              />
            </div>
          )}

          <div>
            <button
              type="submit"
              className="w-full text-primary border border-primary bg-transparent hover:text-white hover:bg-primary focus:ring-4 focus:outline-none focus:ring-primary font-medium rounded-lg text-sm px-5 py-2.5 text-center transition duration-200"
            >
              {isLogin ? 'Anmelden' : 'Registrieren'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-primary hover:text-accent"
            >
              {isLogin ? 'Noch kein Konto? Jetzt registrieren' : 'Bereits registriert? Jetzt anmelden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal; 