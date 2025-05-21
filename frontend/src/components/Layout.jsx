import React, { useState } from 'react';
import Header from "./Header";
import Footer from "./Footer";
import { useNavigate } from 'react-router-dom';
import LogoutConfirmationModal from './auth/LogoutConfirmationModal';

// onLogout wird nun von App.jsx übergeben
export default function Layout({ children, onLogout }) {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Funktion, die vom Header aufgerufen wird, um das Modal zu öffnen
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  // Funktion, die vom Modal aufgerufen wird, wenn der Benutzer bestätigt
  const handleConfirmLogout = () => {
    onLogout(); // Rufe die übergebene Logout-Funktion aus App.jsx auf
    console.log('Logout bestätigt!');
    setShowLogoutModal(false); // Modal schließen
    navigate('/'); // Weiterleitung zur LandingPage (Login/Registrierung)
  };

  // Funktion, die vom Modal aufgerufen wird, wenn der Benutzer abbricht
  const handleCancelLogout = () => {
    setShowLogoutModal(false); // Modal schließen
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      <Header onLogout={handleLogoutClick} />
      <main className="flex-grow max-w-7xl mx-auto w-full p-4 pt-28">{children}</main>
      <Footer />

      {/* Logout Bestätigungs-Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </div>
  );
}
