document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("nav-toggle");
  const menu = document.querySelector(".mainnav");

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      menu.classList.toggle("open");
    });
  } else {
    console.log("Erreur : nav-toggle ou mainnav introuvable");
  }
});
