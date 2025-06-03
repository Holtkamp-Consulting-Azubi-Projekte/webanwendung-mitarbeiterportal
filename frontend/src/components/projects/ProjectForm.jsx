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

// ProjectForm für Anlegen & Editieren (über initialValues)
export default function ProjectForm({
  initialValues = {},
  kunden = [],
  onSubmit,
  submitText = "Projekt anlegen",
  disabled = false
}) {
  const [form, setForm] = useState({
    ...LEERES_PROJEKT,
    ...initialValues // Überschreibt Defaults beim Bearbeiten
  });

  // Wenn initialValues sich ändern (Edit-Dialog öffnet sich neu)
  useEffect(() => {
    setForm({
      ...LEERES_PROJEKT,
      ...initialValues
    });
  }, [initialValues]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (onSubmit) onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-4 rounded-xl shadow">
      <h2 className="text-2xl font-bold text-primary mb-4">
        {submitText}
      </h2>
      <input
        name="project_name"
        value={form.project_name}
        onChange={handleChange}
        placeholder="Projektname"
        required
        className="mb-2 p-2 border rounded w-full"
        disabled={disabled}
      />
      <div className="flex gap-2 mb-2">
        <select
          name="customer_id"
          value={form.customer_id}
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
        value={form.description}
        onChange={handleChange}
        placeholder="Beschreibung"
        className="mb-2 p-2 border rounded w-full"
        disabled={disabled}
      />
      <div className="flex gap-2 mb-2">
        <input
          type="date"
          name="start_date"
          value={form.start_date}
          onChange={handleChange}
          className="p-2 border rounded w-full"
          disabled={disabled}
        />
        <input
          type="date"
          name="end_date"
          value={form.end_date}
          onChange={handleChange}
          className="p-2 border rounded w-full"
          disabled={disabled}
        />
      </div>
      <input
        type="number"
        name="budget_days"
        value={form.budget_days}
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
