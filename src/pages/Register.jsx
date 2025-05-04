import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";


export default function Register() {
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [passwortWdh, setPasswortWdh] = useState("");
  const [fehler, setFehler] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!email || !passwort || !passwortWdh) {
      setFehler("Bitte fülle alle Felder aus.");
      return;
    }
  
    if (!email.includes("@")) {
      setFehler("Bitte gib eine gültige E-Mail-Adresse ein.");
      return;
    }
  
    if (passwort !== passwortWdh) {
      setFehler("Die Passwörter stimmen nicht überein.");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:5050/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, passwort }),
      });
  
      const daten = await response.json();
  
      if (!response.ok) {
        setFehler(daten.fehler || "Unbekannter Fehler");
      } else {
        setFehler("");
        alert(daten.nachricht || "Registrierung erfolgreich");
        navigate("/login");
            }
    } catch (err) {
      setFehler("Verbindung zum Server fehlgeschlagen");
      console.error(err);
    }
  };
  
  return (
    <div className="mt-32 mx-auto max-w-sm p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-6 text-center text-purple-800">Registrieren</h2>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium mb-1">E-Mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Passwort</label>
          <input
            type="password"
            value={passwort}
            onChange={(e) => setPasswort(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Passwort wiederholen</label>
          <input
            type="password"
            value={passwortWdh}
            onChange={(e) => setPasswortWdh(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        {fehler && <p className="text-red-600 text-sm">{fehler}</p>}
        <button
          type="submit"
          className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800 transition"
        >
          Registrieren
        </button>
      </form>
      <p className="mt-4 text-sm text-center">
        Bereits registriert?{" "}
        <Link to="/login" className="text-purple-700 hover:underline">Zum Login</Link>
      </p>
    </div>
  );
}
