function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);

  try {
    localStorage.setItem("mq-theme", theme);
  } catch (error) {
    console.warn("[MQ_OS] No se pudo guardar el tema.", error);
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  setTheme(current === "dark" ? "light" : "dark");
}

(function loadSavedTheme() {
  try {
    const saved = localStorage.getItem("mq-theme");

    if (saved) {
      document.documentElement.setAttribute("data-theme", saved);
    }
  } catch (error) {
    console.warn("[MQ_OS] No se pudo leer el tema guardado.", error);
  }
})();
