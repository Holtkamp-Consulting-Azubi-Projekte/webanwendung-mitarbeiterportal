import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import Projekte from "./pages/Projekte";
import Profil from "./pages/Profil";
import Zeitmatrix from "./pages/Zeitmatrix";
import Einstellungen from "./pages/Einstellungen";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projekte" element={<Projekte />} />
        <Route path="/zeitmatrix" element={<Zeitmatrix />} />
        <Route path="/profil" element={<Profil />} />
        <Route path="/einstellungen" element={<Einstellungen />} />
        {/* Optional: Fallback-Seite */}
        <Route path="*" element={<div className="p-8 text-red-600">Seite nicht gefunden</div>} />
      </Routes>
    </Layout>
  );
}
