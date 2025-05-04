import { useState } from "react";
import { Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [fehler, setFehler] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !passwort) {
      setFehler("Bitte fülle alle Felder aus.");
      return;
    }

    if (!email.includes("@")) {
      setFehler("Bitte gib eine gültige E-Mail-Adresse ein.");
      return;
    }

    // Simulierter Login (hier später API)
    if (email === "admin@example.com" && passwort === "passwort123") {
      setFehler("");
      alert("Login erfolgreich 🎉");
    } else {
      setFehler("Login fehlgeschlagen. Bitte überprüfe deine Daten.");
    }
  };

  return (
    <div className="mt-32 mx-auto max-w-sm p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-6 text-center text-purple-800">Login</h2>

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

        {fehler && <p className="text-red-600 text-sm">{fehler}</p>}

        <button
          type="submit"
          className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800 transition"
        >
          Anmelden
        </button>
      </form>

      {/* Link zur Registrierung */}
      <p className="mt-4 text-sm text-center">
        Noch keinen Account?{" "}
        <Link to="/register" className="text-purple-700 hover:underline">
          Jetzt registrieren
        </Link>
      </p>
    </div>
  );
}
