import { NavLink } from "react-router-dom";
import logo from "../assets/logo.png";
import Button from "./Button";

export default function Header({ onLogout }) {
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
            to="/app/dashboard"
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
