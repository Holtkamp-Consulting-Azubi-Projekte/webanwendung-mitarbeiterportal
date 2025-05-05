import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [fehlermeldung, setFehlermeldung] = useState("");

  useEffect(() => {
    const eingeloggt = localStorage.getItem("email");
    if (eingeloggt) {
      navigate("/"); // 👉 Wenn schon eingeloggt, direkt weiter
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFehlermeldung("");

    try {
      const response = await fetch("http://localhost:5050/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, passwort }),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ Speichere die Email und lade die Benutzerdaten, um den Vornamen zu holen
        localStorage.setItem("email", email);

        // Optional: Vornamen vom Server holen und speichern
        const res = await fetch(`http://localhost:5050/api/user/${email}`);
        if (res.ok) {
          const userData = await res.json();
          localStorage.setItem("vorname", userData.vorname || "");
        }

        navigate("/");
      } else {
        setFehlermeldung(data.message || "Login fehlgeschlagen. Bitte registrieren Sie sich.");
      }
    } catch (err) {
      setFehlermeldung("Server nicht erreichbar");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

      {fehlermeldung && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-4 border border-red-300 text-sm text-center">
          {fehlermeldung}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="password"
          placeholder="Passwort"
          value={passwort}
          onChange={(e) => setPasswort(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
        <button
          type="submit"
          className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700 w-full"
        >
          Einloggen
        </button>
      </form>

      <p className="mt-4 text-sm text-center">
        Noch keinen Account?{" "}
        <Link to="/register" className="text-purple-700 hover:underline">
          Jetzt registrieren
        </Link>
      </p>
    </div>
  );
}
