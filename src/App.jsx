import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Login from "./pages/Login";
import Register from "./pages/Register";


function App() {
  return (
    <div>
      <Header />
      <main className="pt-24">
        <Routes>
          <Route path="/" element={<h1 className="text-3xl font-bold text-center text-purple-700">Startseite</h1>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

        </Routes>
      </main>
    </div>
  );
}

export default App;
