import React, { useMemo, useState, useEffect } from "react";
import ProjectForm from "./ProjectForm";
import Button from "../Button";

// Einfaches Modal, wie gehabt
function SimpleModal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="relative bg-white p-6 rounded-xl shadow-xl min-w-[320px] max-w-lg w-full">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-xl"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

export default function EditProjectModal({
  open,
  projekt,
  kunden,
  onClose,
  onUpdate,
  onDelete
}) {
  const [formData, setFormData] = useState({});

  // Verhindert Endlosschleifen in ProjectForm!
  const stableInitialValues = useMemo(() => projekt, [projekt]);

  useEffect(() => {
    if (projekt) {
      loadProjectDetails(projekt.hk_project);
    }
  }, [projekt]);

  if (!open || !projekt) return null;

  function handleSubmit(formData) {
    const formDataToSubmit = {
      ...formData,
      description: formData.description || "",
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      budget_days: formData.budget_days === "" ? null : formData.budget_days,
    };

    // PUT-Request an API
    fetch(`/api/projects/${projekt.hk_project}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formDataToSubmit)
    })
      .then((res) => res.json())
      .then(() => {
        onUpdate && onUpdate();
        onClose();
      });
  }

  function handleDelete() {
    if (!window.confirm("Wirklich löschen?")) return;
    
    fetch(`/api/projects/${projekt.hk_project}`, {
      method: "DELETE"
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(data => {
            throw new Error(data.error || "Fehler beim Löschen");
          });
        }
        return res.json();
      })
      .then(() => {
        onDelete && onDelete();
        onClose();
      })
      .catch(error => {
        console.error("Fehler beim Löschen:", error);
        alert(error.message || "Fehler beim Löschen des Projekts");
      });
  }

  function loadProjectDetails(projectId) {
    fetch(`/api/projects/${projectId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP Fehler: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        // Stelle sicher, dass Datumsformate korrekt sind
        const formattedData = {
          ...data,
          start_date: data.start_date ? data.start_date.split('T')[0] : "",
          end_date: data.end_date ? data.end_date.split('T')[0] : ""
        };
        
        setFormData(formattedData);
      })
      .catch(error => {
        console.error("Fehler beim Laden des Projekts:", error);
        // Optional: Benutzerfreundliche Fehlermeldung anzeigen
        alert("Projekt konnte nicht geladen werden.");
        onClose(); // Schließe das Modal bei Fehler
      });
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  }

  return (
    <SimpleModal open={open} onClose={onClose}>
      <ProjectForm
        initialValues={stableInitialValues}
        kunden={kunden}
        onSubmit={handleSubmit}
        submitText="Speichern"
      />
      <input
        type="text"
        value={formData.project_name || ""}
        onChange={handleChange}
      />
      <div className="flex gap-2 mt-2">
        <Button type="button" onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
          Löschen
        </Button>
        <Button type="button" onClick={onClose} className="bg-gray-400 hover:bg-gray-500">
          Abbrechen
        </Button>
      </div>
    </SimpleModal>
  );
}
