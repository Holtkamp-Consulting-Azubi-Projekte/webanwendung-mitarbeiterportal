// src/pages/Login.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/logo.png"; // Logo einbinden

const Login = () => {
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [fehlermeldung, setFehlermeldung] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const eingeloggt = localStorage.getItem("email");
    if (eingeloggt) {
      navigate("/");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5050/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, passwort }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("email", data.email);
        navigate("/");
      } else {
        setFehlermeldung(data.message || "Login fehlgeschlagen. Bitte registrieren sie sich");
      }
    } catch (error) {
      setFehlermeldung("Verbindung zum Server fehlgeschlagen");
    }
  };

  return (
    <div className="relative min-h-screen flex justify-center items-center bg-white">
      {/* 💧 Zentrales Wasserzeichen-Logo */}
      <img
        src={logo}
        alt="Firmenlogo"
        className="absolute w-64 opacity-10 pointer-events-none select-none"
        style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
      />

      {/* 🔐 Login-Formular */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 bg-white p-8 rounded shadow-md w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-purple-700">Anmelden</h2>

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

        {fehlermeldung && (
          <p className="text-red-600 text-sm mb-4">{fehlermeldung}</p>
        )}

        <div className="flex justify-center mt-4">
          <button
            type="submit"
            className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200"
          >
            Einloggen
          </button>
        </div>

        <p className="mt-4 text-sm text-center">
          Noch keinen Account?{" "}
          <Link
            to="/register"
            className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200"
          >
            Jetzt registrieren
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
