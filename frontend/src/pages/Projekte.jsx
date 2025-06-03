import React, { useEffect, useState } from "react";

export default function Projekte() {
  const [projekte, setProjekte] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        setProjekte(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-2xl shadow-xl">
      <h1 className="text-2xl font-bold mb-6">Projektverwaltung</h1>
      {loading ? (
        <p>Lade Projekte...</p>
      ) : (
        <table className="w-full table-auto border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Projektname</th>
              <th className="p-2 text-left">Kunde</th>
              <th className="p-2 text-left">Start</th>
              <th className="p-2 text-left">Ende</th>
              <th className="p-2 text-left">Budget (Tage)</th>
              <th className="p-2 text-left">Beschreibung</th>
            </tr>
          </thead>
          <tbody>
            {projekte.map((projekt) => (
              <tr key={projekt.hk_project} className="border-t">
                <td className="p-2">{projekt.project_name}</td>
                <td className="p-2">{projekt.customer_name}</td>
                <td className="p-2">{projekt.start_date ?? "-"}</td>
                <td className="p-2">{projekt.end_date ?? "-"}</td>
                <td className="p-2">{projekt.budget_days ?? "-"}</td>
                <td className="p-2">{projekt.description ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
