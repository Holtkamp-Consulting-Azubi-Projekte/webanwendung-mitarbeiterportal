import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="bg-gray-100 border-b-2 border-purple-700 fixed w-full top-0 left-0 z-50 flex items-center justify-between px-6 py-4 shadow">
      <div className="text-xl font-bold text-purple-800">Mitarbeiterportal</div>
      <nav>
        <ul className="flex gap-4 font-semibold text-sm">
          <li><Link to="/" className="hover:text-purple-800">Startseite</Link></li>
          <li><Link to="/zeiterfassung" className="hover:text-purple-800">Zeiterfassung</Link></li>
          <li><Link to="/projekte" className="hover:text-purple-800">Projekte</Link></li>
          <li><Link to="/profil" className="hover:text-purple-800">Profil</Link></li>
          <li><Link to="/logout" className="hover:text-purple-800">Abmelden</Link></li>
        </ul>
      </nav>
    </header>
  );
}
