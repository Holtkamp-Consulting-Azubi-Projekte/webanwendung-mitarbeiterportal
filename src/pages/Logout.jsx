import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Logout() {
  const navigate = useNavigate();
  const email = localStorage.getItem("email");

  useEffect(() => {
    const logout = async () => {
      try {
        const response = await fetch("http://localhost:5050/api/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const daten = await response.json();
        alert(daten.message || "Logout erfolgreich");

        localStorage.removeItem("email");
      } catch (err) {
        console.error("Fehler beim Logout:", err);
        alert("Logout fehlgeschlagen");
      }

      navigate("/login");
    };

    logout();
  }, [email, navigate]);

  return (
    <div className="mt-32 text-center text-lg">
      Logging out...
    </div>
  );
}

export default Logout;
