import logo from "@/assets/logo.png";

export default function Header() {
  return (
    <header className="bg-white shadow border-b border-purple-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="h-10" />
          <span className="font-bold text-xl text-purple-700">Holtkamp Consulting</span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm text-gray-800">
          <a href="#" className="hover:text-purple-700">Data & Analytics</a>
          <a href="#" className="hover:text-purple-700">SAP-Basis</a>
          <a href="#" className="hover:text-purple-700">Business Intelligence</a>
          <a href="#" className="hover:text-purple-700">Karriere</a>
        </nav>
        <button className="bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-800 text-sm">
          Jetzt Kontaktieren
        </button>
      </div>
    </header>
  );
}
