import React, { useState, useEffect } from "react";
import Button from "../Button";

// LEERES_PROJEKT-Konstante definieren
const LEERES_PROJEKT = {
  project_name: "",
  customer_id: "",
  description: "",
  start_date: "",
  end_date: "",
  budget_days: ""
};

// Hilfsfunktion zum Formatieren des Datums für input[type="date"]
function formatDateForInput(dateString) {
  if (!dateString) return "";
  
  // Wenn es bereits im richtigen Format ist (yyyy-MM-dd)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ""; // Ungültiges Datum
    
    // Format: yyyy-MM-dd
    return date.toISOString().split('T')[0];
  } catch (e) {
    console.error("Fehler beim Formatieren des Datums:", e);
    return "";
  }
}

// ProjectForm für Anlegen & Editieren (über initialValues)
export default function ProjectForm({
  initialValues = {},
  kunden = [],
  onSubmit,
  submitText = "Speichern",
  disabled = false
}) {
  const [formData, setFormData] = useState({
    project_name: initialValues?.project_name || "",
    customer_id: initialValues?.customer_id || "",
    description: initialValues?.description || "",
    start_date: initialValues?.start_date || "",
    end_date: initialValues?.end_date || "",
    budget_days: initialValues?.budget_days !== null ? initialValues.budget_days : ""
  });

  // Wenn initialValues sich ändern (Edit-Dialog öffnet sich neu)
  useEffect(() => {
    setFormData({
      project_name: initialValues?.project_name || "",
      customer_id: initialValues?.customer_id || "",
      description: initialValues?.description || "",
      start_date: initialValues?.start_date || "",
      end_date: initialValues?.end_date || "",
      budget_days: initialValues?.budget_days !== null ? initialValues.budget_days : ""
    });
  }, [initialValues]);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-4 rounded-xl shadow">
      <h2 className="text-2xl font-bold text-primary mb-4">
        {submitText}
      </h2>
      <input
        name="project_name"
        value={formData.project_name || ""}
        onChange={handleChange}
        placeholder="Projektname"
        required
        className="mb-2 p-2 border rounded w-full"
        disabled={disabled}
      />
      <div className="flex gap-2 mb-2">
        <select
          name="customer_id"
          value={formData.customer_id || ""}
          onChange={handleChange}
          required
          className="p-2 border rounded w-full"
          disabled={disabled}
        >
          <option value="">Kunde wählen</option>
          {kunden.map(k => (
            <option key={k.hk_customer} value={k.hk_customer}>
              {k.customer_name}
            </option>
          ))}
        </select>
        {/* Hier könntest du ein + Kunde-Button ergänzen, wie besprochen */}
      </div>
      <textarea
        name="description"
        value={formData.description || ""}
        onChange={handleChange}
        placeholder="Beschreibung"
        className="mb-2 p-2 border rounded w-full"
        disabled={disabled}
      />
      <div className="flex gap-2 mb-2">
        <input
          type="date"
          name="start_date"
          value={formatDateForInput(formData.start_date)}
          onChange={handleChange}
          className="p-2 border rounded w-full"
          disabled={disabled}
        />
        <input
          type="date"
          name="end_date"
          value={formatDateForInput(formData.end_date)}
          onChange={handleChange}
          className="p-2 border rounded w-full"
          disabled={disabled}
        />
      </div>
      <input
        type="number"
        name="budget_days"
        value={formData.budget_days !== null ? formData.budget_days : ""}
        onChange={handleChange}
        placeholder="Budget (Tage)"
        className="mb-4 p-2 border rounded w-full"
        disabled={disabled}
      />
      <Button type="submit" disabled={disabled}>
        {submitText}
      </Button>
    </form>
  );
}
