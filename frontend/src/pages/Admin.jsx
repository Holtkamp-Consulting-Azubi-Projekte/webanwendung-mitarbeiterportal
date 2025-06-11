import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

const initialForm = {
  email: "",
  firstName: "",
  lastName: "",
  position: "",
  coreHours: "",
  phone: "",
  isAdmin: false,
  password: "",
};

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editMode, setEditMode] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setError("Keine Berechtigung für den Admin-Bereich");
        setTimeout(() => navigate("/app"), 3000);
      } else {
        setError(`Fehler beim Laden der Benutzerdaten: ${err.message}`);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddUser = () => {
    setForm(initialForm);
    setEditMode(false);
    setShowForm(true);
  };

  const handleEditUser = (user) => {
    setForm({
      email: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      position: user.position || "",
      coreHours: user.coreHours || "",
      phone: user.phone || "",
      isAdmin: user.isAdmin,
      password: "",
    });
    setEditUserId(user.id);
    setEditMode(true);
    setShowForm(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Benutzer wirklich löschen?")) return;
    try {
      const token = localStorage.getItem("access_token");
      await axios.delete(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      alert("Fehler beim Löschen: " + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    try {
      if (editMode) {
        await axios.put(`/api/admin/users/${editUserId}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post("/api/admin/users", form, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      alert("Fehler beim Speichern: " + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return <div className="p-8">Lade Benutzer...</div>;
  }
  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Benutzerverwaltung</h1>
      <button
        onClick={handleAddUser}
        className="flex items-center gap-2 mb-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition"
      >
        {/* Plus-Icon wie in TimeMatrixTable */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Neuer Benutzer
      </button>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Alle Benutzer</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th>Name</th>
                <th>E-Mail</th>
                <th>Position</th>
                <th>Kernarbeitszeit</th>
                <th>Admin</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center">Keine Benutzer gefunden.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.firstName} {user.lastName}</td>
                    <td>{user.id}</td>
                    <td>{user.position || "-"}</td>
                    <td>{user.coreHours || "-"}</td>
                    <td>{user.isAdmin ? "Ja" : "Nein"}</td>
                    <td className="flex gap-2">
                      {/* Bearbeiten-Icon */}
                      <button
                        title="Bearbeiten"
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {/* Löschen-Icon */}
                      <button
                        title="Löschen"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Benutzer-Formular */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 min-w-[350px]">
            <h2 className="text-xl font-bold mb-4">{editMode ? "Benutzer bearbeiten" : "Benutzer anlegen"}</h2>
            <div className="mb-2">
              <label className="block text-sm">E-Mail</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleInputChange}
                required
                disabled={editMode}
                className="border rounded px-2 py-1 w-full"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm">Vorname</label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleInputChange}
                required
                className="border rounded px-2 py-1 w-full"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm">Nachname</label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleInputChange}
                required
                className="border rounded px-2 py-1 w-full"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm">Position</label>
              <input
                type="text"
                name="position"
                value={form.position}
                onChange={handleInputChange}
                className="border rounded px-2 py-1 w-full"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm">Kernarbeitszeit</label>
              <input
                type="text"
                name="coreHours"
                value={form.coreHours}
                onChange={handleInputChange}
                className="border rounded px-2 py-1 w-full"
                placeholder="z.B. 08:00 - 17:00"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm">Telefon</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleInputChange}
                className="border rounded px-2 py-1 w-full"
              />
            </div>
            <div className="mb-2 flex items-center">
              <input
                type="checkbox"
                name="isAdmin"
                checked={form.isAdmin}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label>Adminrechte</label>
            </div>
            {!editMode && (
              <div className="mb-2">
                <label className="block text-sm">Passwort</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleInputChange}
                  required
                  className="border rounded px-2 py-1 w-full"
                />
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <Button type="submit">{editMode ? "Speichern" : "Anlegen"}</Button>
              <Button type="button" onClick={() => setShowForm(false)} style={{background: "#aaa"}}>Abbrechen</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Admin;