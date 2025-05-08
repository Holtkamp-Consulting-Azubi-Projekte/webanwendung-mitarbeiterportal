const startTimeTracking = async (projekt) => {
  try {
    await apiRequest("/zeiten/start", "POST", { projekt });
    alert("Zeiterfassung gestartet ✅");
  } catch (error) {
    alert("Starten fehlgeschlagen ❌");
  }
};
