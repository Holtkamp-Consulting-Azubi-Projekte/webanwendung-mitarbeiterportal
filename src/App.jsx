// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Logout from "./pages/Logout";

function App() {
  return (
    <>
      {/* Header wird immer angezeigt */}
      <Header />

      {/* Routen für Seiten */}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<Logout />} />
      </Routes>
    </>
  );
}

export default App;
