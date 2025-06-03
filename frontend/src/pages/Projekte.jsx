import React, { useState, useEffect } from "react";
import ProjectTable from "../components/projects/ProjectTable";
import ProjectForm from "../components/projects/ProjectForm";
import EditProjectModal from "../components/projects/EditProjectModal";
import CustomerForm from "../components/projects/CustomerForm";
import Button from "../components/Button";

export default function Projekte() {
  const [projekte, setProjekte] = useState([]);
  const [kunden, setKunden] = useState([]);
  const [editProjekt, setEditProjekt] = useState(null);
  const [showAddKunde, setShowAddKunde] = useState(false);
  const LEERES_PROJEKT = {
    project_name: "",
    customer_id: "",
    description: "",
    start_date: "",
    end_date: "",
    budget_days: ""
  };
  

  // Projekte laden
  function ladeProjekte() {
    fetch("/api/projects")
      .then(res => res.json())
      .then(setProjekte);
  }

  // Kunden laden
  function ladeKunden() {
    fetch("/api/customers")
      .then(res => res.json())
      .then(setKunden);
  }

  useEffect(() => {
    ladeProjekte();
    ladeKunden();
  }, []);

  // Projekt anlegen (Formular oben)
  function handleProjektAnlegen(form) {
    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
      .then(res => res.json())
      .then(() => {
        ladeProjekte();
      });
  }

  // Nach Anlage Kunde: Liste aktualisieren + ggf. für Dropdown setzen
  function handleKundeAdded(kunde) {
    setKunden(kunden => [...kunden, kunde]);
    // Optional: Neuen Kunden im Projekt-Formular auswählen (als State)
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-2xl shadow-xl">
      <h1 className="text-2xl font-bold mb-6 text-primary">Projektverwaltung</h1>
      
      <ProjectForm initialValues={LEERES_PROJEKT}/>
      
      <div className="mb-4 flex gap-2">
        <Button type="button" onClick={() => setShowAddKunde(true)}>
          + Neuen Kunden anlegen
        </Button>
      </div>
      
      <ProjectTable
        projekte={projekte}
        onEdit={setEditProjekt}
      />

      {/* Modal: Projekt bearbeiten/löschen */}
      <EditProjectModal
        open={!!editProjekt}
        projekt={editProjekt}
        kunden={kunden}
        onClose={() => setEditProjekt(null)}
        onUpdate={ladeProjekte}
        onDelete={ladeProjekte}
      />

      {/* Modal: Kunden anlegen */}
      <CustomerForm
        open={showAddKunde}
        onClose={() => setShowAddKunde(false)}
        onAdded={kunde => {
          handleKundeAdded(kunde);
          setShowAddKunde(false);
        }}
      />
    </div>
  );
}
