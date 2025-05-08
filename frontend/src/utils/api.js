// 📝 Zentrale Fehlerbehandlungsfunktion
function handleApiError(error) {
  console.error("API Fehler:", error);  // Fehler in der Konsole anzeigen

  // Benutzerwarnung anzeigen
  if (error.message) {
    alert("Ein Fehler ist aufgetreten: " + error.message);
  } else {
    alert("Ein unbekannter Fehler ist aufgetreten.");
  }
}

// 📝 API Anfragefunktion mit zentraler Fehlerbehandlung
export async function apiRequest(endpoint, method = "GET", body = null) {
  try {
    // Anfrageoptionen vorbereiten
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };
    // Falls ein Request-Body vorhanden ist, hinzufügen
    if (body) {
      options.body = JSON.stringify(body);
    }

    // Anfrage an die API senden
    const response = await fetch(`http://localhost:5050/api${endpoint}`, options);

    // Fehlerhafte Antwort abfangen
    if (!response.ok) {
      // Fehler werfen, um ins Catch zu springen
      throw new Error(`Fehler: ${response.status} ${response.statusText}`);
    }

    // Antwort als JSON zurückgeben
    return await response.json();
  } catch (error) {
    // Fehler zentral verarbeiten
    handleApiError(error);
    // Fehler weiterreichen, falls die aufrufende Funktion damit arbeiten möchte
    throw error;
  }
}
