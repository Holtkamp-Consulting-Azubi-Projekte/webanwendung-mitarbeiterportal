/**
 * `TimeMatrix` Komponente (veraltet, siehe Zeitmatrix.jsx Seite).
 * Diese Komponente war ursprünglich für die Zeiterfassung gedacht, wird aber jetzt durch die Zeitmatrix.jsx Seite ersetzt.
 */
const TimeMatrix = () => {
  // ... existing code ...

  return (
    <table className="table-auto">
      <thead>
        <tr>
          <th className="px-4 py-2">Mitarbeiter</th>
          <th className="px-4 py-2">Datum</th>
          <th className="px-4 py-2">Beginn</th>
          <th className="px-4 py-2">Ende</th>
          <th className="px-4 py-2">Pause</th>
          <th className="px-4 py-2">Projekt</th>
          <th className="px-4 py-2">Arbeitsort</th>
          <th className="px-4 py-2">Aktionen</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.id}>
            <td className="border px-4 py-2">{entry.mitarbeiter}</td>
            <td className="border px-4 py-2">{entry.datum}</td>
            <td className="border px-4 py-2">{entry.beginn}</td>
            <td className="border px-4 py-2">{entry.ende}</td>
            <td className="border px-4 py-2">{entry.pause}</td>
            <td className="border px-4 py-2">
              {Array.isArray(entry.projekt) ? entry.projekt.join(", ") : entry.projekt}
            </td>
            <td className="border px-4 py-2">{entry.arbeitsort}</td>
            <td className="border px-4 py-2">
              <button
                onClick={() => handleEdit(entry)}
                className="text-blue-600 hover:text-blue-800 mr-2"
              >
                Bearbeiten
              </button>
              <button
                onClick={() => handleDelete(entry.id)}
                className="text-red-600 hover:text-red-800"
              >
                Löschen
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TimeMatrix; 