import React, { useMemo } from "react";
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
  // Verhindert Endlosschleifen in ProjectForm!
  const stableInitialValues = useMemo(() => projekt, [projekt]);

  if (!open || !projekt) return null;

  function handleSubmit(formData) {
    // PUT-Request an API
    fetch(`/api/projects/${projekt.hk_project}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
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
      .then((res) => res.json())
      .then(() => {
        onDelete && onDelete();
        onClose();
      });
  }

  return (
    <SimpleModal open={open} onClose={onClose}>
      <ProjectForm
        initialValues={stableInitialValues}
        kunden={kunden}
        onSubmit={handleSubmit}
        submitText="Speichern"
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
