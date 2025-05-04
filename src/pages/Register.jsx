import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [fehler, setFehler] = useState("");

  // ✅ Weiterleitung, wenn bereits eingeloggt
  useEffect(() => {
    const eingeloggt = localStorage.getItem("email");
    if (eingeloggt) {
      navigate("/");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !passwort) {
      setFehler("Bitte fülle alle Felder aus.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5050/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, passwort }),
      });

      const daten = await response.json();

      if (!response.ok) {
        setFehler(daten.error || "Registrierung fehlgeschlagen");
      } else {
        setFehler("");
        localStorage.setItem("email", email);
        navigate("/");
      }
    } catch (err) {
      setFehler("Verbindung zum Server fehlgeschlagen");
      console.error(err);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-purple-700">Registrieren</h2>

        <label className="block mb-2 text-sm font-medium">E-Mail</label>
        <input
          type="email"
          className="w-full px-3 py-2 mb-4 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="block mb-2 text-sm font-medium">Passwort</label>
        <input
          type="password"
          className="w-full px-3 py-2 mb-4 border rounded"
          value={passwort}
          onChange={(e) => setPasswort(e.target.value)}
          required
        />

        {fehler && <p className="text-red-600 text-sm mb-4">{fehler}</p>}

        <div className="flex justify-center mt-4">
          <button
            type="submit"
            className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200"
          >
            Registrieren
          </button>
        </div>

        <p className="mt-4 text-sm text-center">
          Schon ein Konto?{" "}
          <Link to="/login" className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200">
            Jetzt einloggen
          </Link>
        </p>
      </form>
    </div>
  );
}
