import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    vorname: '',
    nachname: '',
    email: '',
    passwort: '',
    rolle: ''
  });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const url = isLogin ? '/login' : '/register';
    try {
      const response = await axios.post(
        `http://127.0.0.1:5000/api${url}`,
        form,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      alert(response.data.message);
      if (isLogin) {
        navigate('/');
      }
    } catch (err) {
      console.error("Fehler beim API-Aufruf:", err);
      if (err.response) {
        console.error("Serverantwort:", err.response.data);
      }
      alert(err.response?.data?.message || 'Fehler');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-4 border rounded shadow">
      <h2 className="text-xl font-bold mb-4">{isLogin ? 'Login' : 'Registrierung'}</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        {!isLogin && (
          <>
            <input type="text" name="vorname" placeholder="Vorname" onChange={handleChange} className="input" />
            <input type="text" name="nachname" placeholder="Nachname" onChange={handleChange} className="input" />
            <input type="text" name="rolle" placeholder="Rolle (optional)" onChange={handleChange} className="input" />
          </>
        )}
        <input type="email" name="email" placeholder="E-Mail" onChange={handleChange} className="input" required />
        <input type="password" name="passwort" placeholder="Passwort" onChange={handleChange} className="input" required />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          {isLogin ? 'Einloggen' : 'Registrieren'}
        </button>
      </form>
      <button
        onClick={() => setIsLogin(!isLogin)}
        className="mt-4 text-sm text-blue-600 underline"
      >
        {isLogin ? 'Noch kein Konto? Registrieren' : 'Schon registriert? Login'}
      </button>
    </div>
  );
}
