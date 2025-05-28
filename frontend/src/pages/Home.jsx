import { useEffect, useState } from "react";

/**
 * `Home` Seite.
 * Dient als Standard-Seite nach erfolgreichem Login und leitet zum Dashboard weiter.
 */
const Home = () => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://192.168.188.39:5050/api/ping")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("Fehler beim Backend-Aufruf"));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <h1 className="text-3xl font-bold mb-4 text-purple-700">Willkommen im Mitarbeiterportal</h1>
      <p className="text-gray-700 text-center max-w-md">
        {message ? `🔗 ${message}` : "Backend wird kontaktiert..."}
      </p>
    </div>
  );
}

export default Home;
