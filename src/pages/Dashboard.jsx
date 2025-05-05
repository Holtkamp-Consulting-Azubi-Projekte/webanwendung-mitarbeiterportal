import React from "react";

export default function Dashboard() {
  const vorname = localStorage.getItem("vorname");

  return (
    <div className="max-w-3xl mx-auto mt-10 text-center">
      <h1 className="text-2xl font-bold mb-4">
        Willkommen, {vorname || "Benutzer"} 👋
      </h1>
      <p className="text-gray-600">
        Schön, dass du wieder da bist. Nutze das Menü, um deine Aufgaben zu erledigen.
      </p>
    </div>
  );
}
