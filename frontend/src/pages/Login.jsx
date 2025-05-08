const handleLogin = async (email, passwort) => {
  try {
    const response = await fetch("http://localhost:5050/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, passwort }),
    });

    if (response.ok) {
      alert("Login erfolgreich ✅");
      localStorage.setItem("email", email);
      window.location.href = "/dashboard";  // Weiterleitung zum Dashboard
    } else {
      alert("Login fehlgeschlagen ❌");
    }
  } catch (error) {
    alert("Fehler beim Login ❌");
    console.error(error);
  }
};