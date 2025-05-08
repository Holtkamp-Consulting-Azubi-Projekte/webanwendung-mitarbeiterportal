const handleLogin = async (email, passwort) => {
  try {
    const response = await apiRequest("/login", "POST", { email, passwort });
    alert("Login erfolgreich ✅");
  } catch (error) {
    alert("Login fehlgeschlagen ❌");
  }
};
