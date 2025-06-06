import React, { useEffect, useState } from "react";
import Button from "../Button";

// Modal-Wrapper wie in CustomerForm
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

export default function KundenVerwaltungModal({ open, onClose, onUpdate }) {
  const [kunden, setKunden] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function ladeKunden() {
    setLoading(true);
    setError(null);
    
    fetch("/api/customers")
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP Fehler: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setKunden(data || []);
        setLoading(false);
      })
      .catch(err => {
        setError("Kunden konnten nicht geladen werden: " + err.message);
        setLoading(false);
      });
  }

  useEffect(() => {
    if (open) ladeKunden();
  }, [open]);

  function handleDeleteCustomer(hk_customer, customerName) {
    if (!window.confirm(`Kunden "${customerName}" wirklich löschen?`)) return;
    
    fetch(`/api/customers/${hk_customer}`, { method: "DELETE" })
      .then(async res => {
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Kunde konnte nicht gelöscht werden");
        }
        
        // Kundenliste neu laden
        ladeKunden();
        
        // Elternkomponente (Projekte) über Änderung informieren
        onUpdate && onUpdate();
        
        return data;
      })
      .catch(err => {
        alert(err.message);
      });
  }

  return (
    <SimpleModal open={open} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4 text-primary">Kundenverwaltung</h2>
      {loading ? (
        <div>Laden...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : kunden.length === 0 ? (
        <div className="text-gray-500">Keine Kunden vorhanden.</div>
      ) : (
        <ul className="space-y-2">
          {kunden.map(kunde => (
            <li key={kunde.hk_customer} className="flex justify-between items-center border-b py-2">
              <span>{kunde.customer_name}</span>
              <Button
                type="button"
                onClick={() => handleDeleteCustomer(kunde.hk_customer, kunde.customer_name)}
                className="!bg-red-500 !text-white !border-red-500 hover:!bg-red-600 hover:!border-red-600 !min-w-[80px]"
              >
                Löschen
              </Button>
            </li>
          ))}
        </ul>
      )}
    </SimpleModal>
  );
}
