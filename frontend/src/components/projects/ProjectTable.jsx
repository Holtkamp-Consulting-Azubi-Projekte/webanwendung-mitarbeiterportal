import React from "react";
import Button from "../Button";

export default function ProjectTable({ projekte, onEdit }) {
  return (
    <div className="overflow-x-auto bg-white shadow rounded-lg">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-100 text-sm">
            <th className="px-4 py-2">Projektname</th>
            <th className="px-4 py-2">Kunde</th>
            <th className="px-4 py-2">Start</th>
            <th className="px-4 py-2">Ende</th>
            <th className="px-4 py-2">Budget (Tage)</th>
            <th className="px-4 py-2">Beschreibung</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {projekte.map((projekt) => (
            <tr key={projekt.hk_project} className="border-t">
              <td className="px-4 py-2">{projekt.project_name}</td>
              <td className="px-4 py-2">{projekt.customer_name}</td>
              <td className="px-4 py-2">{projekt.start_date ? new Date(projekt.start_date).toLocaleDateString("de-DE") : "-"}</td>
              <td className="px-4 py-2">{projekt.end_date ? new Date(projekt.end_date).toLocaleDateString("de-DE") : "-"}</td>
              <td className="px-4 py-2">{projekt.budget_days}</td>
              <td className="px-4 py-2">{projekt.description}</td>
              <td className="px-4 py-2">
                <Button onClick={() => onEdit(projekt)}>Bearbeiten</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
