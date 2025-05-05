import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Header() {
  const location = useLocation();

  // Nur auf Login- oder Register-Seiten → keine Navigation anzeigen
  const istAuthSeite = ["/login", "/register"].includes(location.pathname);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-gray-100 border-b-2 border-purple-700 py-4">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
        
        {/* 🔧 Logo-Bereich */}
        <div className="flex items-center space-x-2">
          <img
            src={logo}
            alt="Firmenlogo"
            className="h-16 w-50 object-contain"
          />
        </div>

        {/* 🔧 Navigation nur wenn NICHT auf Login oder Register */}
        {!istAuthSeite && (
          <nav className="space-x-6 text-gray-800 font-medium">
            <Link to="/" className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200">
              Start
            </Link>
            <Link to="/mitarbeiter" className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200">
              Mitarbeiter
            </Link>
            <Link to="/projekte" className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200">
              Projekte
            </Link>
            <Link to="/zeiten" className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200">
              Zeiterfassung
            </Link>
            <Link to="/einstellungen" className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200">
              Einstellungen
            </Link>
            <Link to="/logout" className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200">
              Logout
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
