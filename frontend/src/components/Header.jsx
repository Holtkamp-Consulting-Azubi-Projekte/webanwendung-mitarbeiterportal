import React, { useState, useEffect } from 'react';
import { NavLink } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo.png";
import Button from "./Button";

/**
 * `Header` Komponente für die Kopfzeile der Anwendung.
 * Zeigt den Titel der Anwendung und ermöglicht die Navigation.
 * Beinhaltet auch die Logout-Funktionalität.
 */
const Header = ({ onLogout }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        
        const response = await axios.get('/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("Profil-Daten:", response.data);
        
        // Spezialfall für admin@admin.de, bis das Backend korrigiert ist
        if (response.data.email === 'admin@admin.de') {
          setIsAdmin(true);
          console.log("Admin-Status für admin@admin.de erzwungen");
          return;
        }
        
        setIsAdmin(response.data.isAdmin === true);
      } catch (err) {
        console.error('Fehler beim Prüfen des Admin-Status:', err);
      }
    };
    
    checkAdminStatus();
  }, []);

  return (
    <header className="fixed top-0 w-full z-50 bg-secondary shadow border-b-2 border-primary">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-4">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="h-16 w-auto" />
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex gap-10 text-sm text-base font-medium tracking-wide">
          <NavLink
            to="/app/"
            className={({ isActive }) =>
              isActive ? "text-primary font-bold" : "hover:text-primary"
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/app/projekte"
            className={({ isActive }) =>
              isActive ? "text-primary font-bold" : "hover:text-primary"
            }
          >
            Projekte
          </NavLink>
          <NavLink
            to="/app/zeitmatrix"
            className={({ isActive }) =>
              isActive ? "text-primary font-bold" : "hover:text-primary"
            }
          >
            Zeitmatrix
          </NavLink>
          <NavLink
            to="/app/profil"
            className={({ isActive }) =>
              isActive ? "text-primary font-bold" : "hover:text-primary"
            }
          >
            Profil
          </NavLink>
          
          {/* Admin-Link - nur für Administratoren sichtbar */}
          {isAdmin && (
            <NavLink
              to="/app/admin"
              className={({ isActive }) =>
                isActive ? "text-primary font-bold" : "hover:text-primary"
              }
            >
              Administration
            </NavLink>
          )}
          
          <NavLink
            to="/app/einstellungen"
            className={({ isActive }) =>
              isActive ? "text-primary font-bold" : "hover:text-primary"
            }
          >
            Einstellungen
          </NavLink>
        </nav>

        {/* CTA-Button */}
        <Button onClick={onLogout}>Logout</Button>
      </div>
    </header>
  );
}

export default Header;
