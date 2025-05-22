import React from 'react';
import AuthModal from '../components/auth/AuthModal';
import logo from '../assets/logo.png';

/**
 * `LandingPage` Seite, die als Einstiegspunkt der Anwendung dient.
 * Zeigt eine Willkommensnachricht und einen Button zum Öffnen des Authentifizierungs-Modals.
 */
const LandingPage = ({ onLoginSuccess }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary to-white">
      {/* Vereinfachter Header */}
      <header className="bg-white shadow-sm border-b-2 border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-center">
            <img
              src={logo}
              alt="Holtkamp Consulting Logo"
              className="h-16 w-auto"
            />
          </div>
        </div>
      </header>

      {/* Hauptinhalt */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Willkommen im Mitarbeiterportal
          </h1>
          <h2 className="text-2xl text-accent mb-8">
            von Holtkamp Consulting
          </h2>
        </div>
      </main>

      {/* Auth Modal - immer sichtbar */}
      <AuthModal
        isOpen={true}
        onClose={() => {}} // Leere Funktion, da das Modal nicht geschlossen werden soll
        onLoginSuccess={onLoginSuccess} // onLoginSuccess-Prop weitergeben
      />
    </div>
  );
};

export default LandingPage; 