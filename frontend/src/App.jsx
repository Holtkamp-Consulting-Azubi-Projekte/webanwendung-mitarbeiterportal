import { Routes, Route, Navigate } from "react-router-dom";
import React, { useState } from 'react';
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";

import Dashboard from "./pages/Dashboard";
import Projekte from "./pages/Projekte";
import Profil from "./pages/Profil";
import Einstellungen from "./pages/Einstellungen";
import Zeitmatrix from "./pages/Zeitmatrix"; // Zeitmatrix importieren
import Admin from "./pages/Admin"; // Importiere den Admin-Bereich

// PrivateRoute Komponente zum Schutz von Routen
const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('access_token');
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

export default function App() {
  // Initialen Authentifizierungsstatus basierend auf localStorage prüfen
  // const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));

  // Funktion zum Setzen des Authentifizierungsstatus und Speichern des Tokens
  const handleLoginSuccess = (token) => {
    localStorage.setItem('access_token', token);
    // setIsAuthenticated(true);
  };

  // Funktion zum Entfernen des Tokens beim Logout
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    // setIsAuthenticated(false);
  };

  return (
    <Routes>
      {/* Die LandingPage ist immer zugänglich */}
      <Route path="/" element={<LandingPage onLoginSuccess={handleLoginSuccess} />} />
      {/* Route für /login, die ebenfalls auf die LandingPage verweist */}
      <Route path="/login" element={<LandingPage onLoginSuccess={handleLoginSuccess} />} />

      {/* Geschützte Routen, die ein Layout verwenden */}
      <Route path="/app/*" element={
        <PrivateRoute>
          {/* Übergabe von handleLogout an Layout, damit es im Header verwendet werden kann */}
          <Layout onLogout={handleLogout}>
            <Routes>
              {/* Untergeordnete Routen unter /app */} {/* Diese Route /app/ sollte auch das Dashboard anzeigen */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/projekte" element={<Projekte />} />
              <Route path="/profil" element={<Profil />} />
              <Route path="/einstellungen" element={<Einstellungen />} />
              <Route path="/zeitmatrix" element={<Zeitmatrix />} /> {/* Hier die Zeitmatrix-Route hinzufügen */}
              <Route path="/admin" element={<Admin />} /> {/* Diese Zeile hinzufügen */}
            </Routes>
          </Layout>
        </PrivateRoute>
      } />

      {/* Optional: Fallback-Seite */}
      <Route path="*" element={<div className="p-8 text-red-600">Seite nicht gefunden</div>} />
    </Routes>
  );
}
