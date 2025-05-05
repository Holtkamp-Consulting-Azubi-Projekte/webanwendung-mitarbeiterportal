import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Mitarbeiter from "./pages/Mitarbeiter";
import Projekte from "./pages/Projekte";
import Zeiterfassung from "./pages/Zeiterfassung";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Logout from "./pages/Logout";

function App() {
  return (
    <>
      <Header />

      <main className="pt-24 pb-20 min-h-screen">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/mitarbeiter" element={<Mitarbeiter />} />
          <Route path="/projekte" element={<Projekte />} />
          <Route path="/zeiten" element={<Zeiterfassung />} />


        </Routes>
      </main>

      <footer className="fixed bottom-0 left-0 w-full z-50 bg-gray-100 text-center text-sm text-gray-600 py-4 border-t">
        © 2025 Holtkamp-Consulting GmbH – Mitarbeiterportal
      </footer>
    </>
  );
}

export default App;
