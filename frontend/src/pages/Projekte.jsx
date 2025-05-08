import React, { useState, useEffect } from "react";
import { apiRequest } from "../utils/api";

const Projekte = () => {
  const [projekte, setProjekte] = useState([]);

  useEffect(() => {
    // 📝 Daten laden
    async function fetchProjekte() {
      try {
        const data = await apiRequest("/projekte");
        setProjekte(data);
      } catch (error) {
        console.error("Fehler beim Laden der Projekte:", error);
      }
    }

    fetchProjekte();
  }, []);

  const handleDelete = async (id) => {
    try {
      await apiRequest(`/projekte/${id}`, "DELETE");
      alert("Projekt erfolgreich gelöscht ✅");
      setProjekte(projekte.filter((projekt) => projekt.id !== id));
    } catch (error) {
      console.error("Fehler beim Löschen:", error);
    }
  };

  return (
    <div>
      <h2>Projekte</h2>
      {projekte.map((projekt) => (
        <div key={projekt.id}>
          {projekt.name}
          <button onClick={() => handleDelete(projekt.id)}>Löschen</button>
        </div>
      ))}
    </div>
  );
};

export default Projekte;
