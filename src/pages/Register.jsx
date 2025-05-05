import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [formDaten, setFormDaten] = useState({
    vorname: "",
    nachname: "",
    email: "",
    passwort: "",
    eintrittsdatum: "",
  });
  const [fehlermeldung, setFehlermeldung] = useState("");

  const handleChange = (e) => {
    setFormDaten({
      ...formDaten,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFehlermeldung("");

    const { vorname, nachname, email, passwort, eintrittsdatum } = formDaten;

    if (!vorname || !nachname || !email || !passwort || !eintrittsdatum) {
      setFehlermeldung("Bitte alle Felder ausfüllen.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5050/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formDaten, rolle: "user" }),
      });

      if (!res.ok) {
        if (res.status === 409) {
          throw new Error("Benutzer existiert bereits.");
        }
        throw new Error("Registrierung fehlgeschlagen.");
      }

      localStorage.setItem("email", email); // ✅ Speichern für spätere API-Aufrufe
      navigate("/"); // ✅ Weiterleitung ins Dashboard

    } catch (err) {
      setFehlermeldung(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">Registrieren</h2>

      {fehlermeldung && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-4 border border-red-300 text-sm text-center">
          {fehlermeldung}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="vorname"
          placeholder="Vorname"
          value={formDaten.vorname}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="text"
          name="nachname"
          placeholder="Nachname"
          value={formDaten.nachname}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="E-Mail"
          value={formDaten.email}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="password"
          name="passwort"
          placeholder="Passwort"
          value={formDaten.passwort}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="date"
          name="eintrittsdatum"
          value={formDaten.eintrittsdatum}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        />
        <button
          type="submit"
          className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200 border text-gray-700 w-full"
        >
          Registrieren
        </button>
      </form>

      <p className="mt-4 text-sm text-center">
        Bereits einen Account?{" "}
        <Link to="/login" className="text-purple-700 hover:underline">
          Zum Login
        </Link>
      </p>
    </div>
  );
}
