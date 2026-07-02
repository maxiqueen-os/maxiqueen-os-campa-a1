function openLightbox(src) {
  const lightbox = document.getElementById("mq-lightbox");
  const image = document.getElementById("mq-lightbox-img");

  if (!lightbox || !image) {
    return;
  }

  image.src = src;
  lightbox.classList.add("active");
  lightbox.setAttribute("aria-hidden", "false");
}

function closeLightbox() {
  const lightbox = document.getElementById("mq-lightbox");
  const image = document.getElementById("mq-lightbox-img");

  if (!lightbox || !image) {
    return;
  }

  lightbox.classList.remove("active");
  lightbox.setAttribute("aria-hidden", "true");
  image.removeAttribute("src");
}

document.addEventListener("DOMContentLoaded", () => {
  const lightbox = document.getElementById("mq-lightbox");

  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeLightbox();
    }
  });
});
