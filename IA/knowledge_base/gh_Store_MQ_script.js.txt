function startGame() {
  cambiarPantalla("inicio", "nivel1");
}

function accion(tipo) {
  let texto = "";

  if (tipo === "fumar") {
    texto = "Sientes algo… pero dura poco.";
  } else if (tipo === "sexo") {
    texto = "Lo buscas… pero no te llena.";
  } else if (tipo === "contenido") {
    texto = "Te distraes… pero sigues vacío.";
  } else if (tipo === "dormir") {
    texto = "Escapas… pero todo sigue ahí.";
  }

  document.getElementById("resultado").innerText = texto;
  document.getElementById("continuar").style.display = "block";
}

function mostrarJuego() {
  cambiarPantalla("nivel1", "minijuego");
}

function cambiarPantalla(actual, siguiente) {
  document.getElementById(actual).classList.remove("active");
  document.getElementById(siguiente).classList.add("active");
}

// MINI JUEGO

let orden = 1;

function clickNum(num) {
  if (num === orden) {
    orden++;

    if (orden > 4) {
      document.getElementById("feedback").innerText =
        "Tu mente busca orden… pero tú decides si dárselo.";
    }
  } else {
    orden = 1;
    document.getElementById("feedback").innerText =
      "Te adelantaste. Intenta de nuevo.";
  }
}