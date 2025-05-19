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