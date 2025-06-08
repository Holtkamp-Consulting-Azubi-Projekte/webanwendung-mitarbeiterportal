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
  const [editingCustomer, setEditingCustomer] = useState(null); // Zustand für den zu bearbeitenden Kunden
  const [editForm, setEditForm] = useState({ // Formulardaten für die Bearbeitung
    customer_name: '',
    address: '',
    contact_person: ''
  });

  // Kunden laden
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

  // Kunde löschen
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

  // Kunde zur Bearbeitung vorbereiten
  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setEditForm({
      customer_name: customer.customer_name || '',
      address: customer.address || '',
      contact_person: customer.contact_person || ''
    });
  };

  // Änderungen im Bearbeitungsformular speichern
  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  // Bearbeitung abschicken
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/customers/${editingCustomer.hk_customer}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });
      
      if (response.ok) {
        // Aktualisierung erfolgreich, Liste neu laden
        ladeKunden();
        // Bearbeitungsdialog schließen
        setEditingCustomer(null);
        // Elternkomponente über Änderung informieren
        onUpdate && onUpdate();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Fehler beim Aktualisieren des Kunden');
      }
    } catch (error) {
      alert('Fehler beim Aktualisieren des Kunden');
    }
  };

  return (
    <SimpleModal open={open} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4 text-primary">Kundenverwaltung</h2>
      
      {/* Wenn ein Kunde bearbeitet wird, zeige das Bearbeitungsformular */}
      {editingCustomer ? (
        <div className="p-4">
          <h3 className="font-medium mb-3">Kunde bearbeiten</h3>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Kundenname *</label>
              <input 
                type="text" 
                name="customer_name" 
                value={editForm.customer_name} 
                onChange={handleEditChange} 
                required 
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Adresse</label>
              <textarea 
                name="address" 
                value={editForm.address || ''} 
                onChange={handleEditChange} 
                rows="3"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Kontaktperson</label>
              <input 
                type="text" 
                name="contact_person" 
                value={editForm.contact_person || ''} 
                onChange={handleEditChange} 
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                type="button"
                onClick={() => setEditingCustomer(null)} 
                className="!bg-gray-200 !text-gray-800"
              >
                Abbrechen
              </Button>
              <Button 
                type="submit" 
                className="!bg-blue-500 !text-white"
              >
                Speichern
              </Button>
            </div>
          </form>
        </div>
      ) : (
        // Ansonsten zeige die Kundenliste
        <>
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
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => openEditModal(kunde)}
                      className="!bg-blue-500 !text-white !border-blue-500 hover:!bg-blue-600 hover:!border-blue-600 !min-w-[80px]"
                    >
                      Bearbeiten
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleDeleteCustomer(kunde.hk_customer, kunde.customer_name)}
                      className="!bg-red-500 !text-white !border-red-500 hover:!bg-red-600 hover:!border-red-600 !min-w-[80px]"
                    >
                      Löschen
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </SimpleModal>
  );
}
