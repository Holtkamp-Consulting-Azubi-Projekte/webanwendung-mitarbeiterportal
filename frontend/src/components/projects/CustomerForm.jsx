import React, { useState } from "react";
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

export default function CustomerForm({ open, onClose, onAdded }) {
  const [form, setForm] = useState({
    customer_name: "",
    address: "",
    contact_person: ""
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
      .then((res) => res.json())
      .then((kunde) => {
        onAdded && onAdded(kunde); // Callback für die Hauptseite
        setForm({ customer_name: "", address: "", contact_person: "" });
        onClose();
      });
  }

  return (
    <SimpleModal open={open} onClose={onClose}>
      <h2 className="text-lg font-bold mb-4 text-primary">Neuen Kunden anlegen</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="customer_name"
          placeholder="Kundenname"
          value={form.customer_name}
          onChange={handleChange}
          required
          className="p-2 mb-2 border rounded w-full"
        />
        <input
          name="address"
          placeholder="Adresse (optional)"
          value={form.address}
          onChange={handleChange}
          className="p-2 mb-2 border rounded w-full"
        />
        <input
          name="contact_person"
          placeholder="Ansprechpartner (optional)"
          value={form.contact_person}
          onChange={handleChange}
          className="p-2 mb-4 border rounded w-full"
        />
        <div className="flex gap-2">
          <Button type="submit">Kunde anlegen</Button>
          <Button type="button" onClick={onClose} className="bg-gray-400 hover:bg-gray-500">Abbrechen</Button>
        </div>
      </form>
    </SimpleModal>
  );
}
