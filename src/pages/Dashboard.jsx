import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Dashboard() {
  const [email, setEmail] = useState(null);
  const navigate = useNavigate();

  // 🔐 Weiterleitung, falls kein Login
  useEffect(() => {
    const gespeicherteEmail = localStorage.getItem("email");
    if (!gespeicherteEmail) {
      navigate("/login");
    } else {
      setEmail(gespeicherteEmail);
    }
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-center px-4">
      {/* 
        🔷 Hauptschriftzug oben
        ✏️ Anpassbar:
          - text-purple-700 → andere Farbe (z. B. text-blue-700)
          - text-3xl → größer (z. B. text-4xl) oder kleiner (text-2xl)
          - mb-8 → mehr oder weniger Abstand zum Begrüßungsfeld
      */}
      <h1 className="text-gray-800 font-bold text-3xl mb-8">
        Mitarbeiterportal
      </h1>

      {/* 
        🔷 Begrüßungskarte 
        ✏️ Anpassbar:
          - max-w-md → schmaler oder breiter (z. B. max-w-lg)
          - p-8 → Innenabstand (Padding)
          - shadow-md → Schattenstärke (shadow-lg für mehr)
      */}
      <div className="bg-white p-8 rounded shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Willkommen, {email} 👋
        </h2>
        <p className="mb-4 text-gray-700">
          Du bist jetzt eingeloggt.
        </p>

        {/* 
          🔷 Logout-Link 
          ✏️ Anpassbar:
            - mt-4 → Abstand nach oben
            - text-purple-700 → Linkfarbe
            - hover:underline → Hover-Effekt
        */}
        <Link
          to="/logout"
          className="px-3 py-2 rounded hover:bg-purple-800 hover:text-gray-100 transition duration-200"
        >
          Logout
        </Link>
      </div>
    </div>
  );
}
