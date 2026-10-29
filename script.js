/* INTRO */
const intro = document.querySelector("#introduction");

if (intro) {
  const header = document.querySelector(".intro-header");
  const menuButton = header?.querySelector(".intro-menu-button");
  const nav = header?.querySelector(".intro-nav");
  const images = [...intro.querySelectorAll(".intro-image")];
  const links = [...intro.querySelectorAll(".intro-studio-links a")];
  const progress = intro.querySelector(".intro-progress span");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const duration = 5000;
  const studios = [
    { area: "58 SQ FT", detail: "NARROW CHARRED" },
    { area: "89 SQ FT", detail: "NARROW CHARRED" },
    { area: "119 SQ FT", detail: "NARROW CHARRED" }
  ];

  let current = 0;
  let slideTimer;
  let scrollTicking = false;

  /* NAVIGATION */
  function updateHeader() {
    header?.classList.toggle("scrolled", window.scrollY > 30);
  }

  function closeMenu() {
    if (!header || !menuButton) return;
    header.classList.remove("menu-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open menu");
  }

  menuButton?.addEventListener("click", () => {
    const open = header.classList.toggle("menu-open");
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  nav?.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMenu();
  });

  document.addEventListener("click", event => {
    if (header && !header.contains(event.target)) closeMenu();
  });

  /* PARALLAX + NAV COLOUR */
  function updateScroll() {
    const rect = intro.getBoundingClientRect();
    const offset = Math.max(-100, Math.min(100, -rect.top * .12));

    intro.style.setProperty("--hero-y", `${offset}px`);
    intro.style.setProperty("--veg-y", `${offset * -.6}px`);
    updateHeader();
    scrollTicking = false;
  }

  window.addEventListener("scroll", () => {
    if (!scrollTicking) {
      requestAnimationFrame(updateScroll);
      scrollTicking = true;
    }
  }, { passive: true });

  updateScroll();

  /* STUDIO SELECTOR */
  function showHeroStudio(index) {
    if (!images[index]) return;
    current = index;

    images.forEach((image, i) => image.classList.toggle("active", i === index));

    links.forEach((link, i) => {
      link.classList.toggle("active", i === index);
      if (i === index) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });

    const detail = intro.querySelector(".intro-detail");
    if (detail) detail.textContent = `${studios[index].area} / ${studios[index].detail}`;

    startSlideshow();
  }

  /* SLIDESHOW + PROGRESS */
  function startSlideshow() {
    clearTimeout(slideTimer);

    if (progress) {
      progress.classList.remove("running");
      void progress.offsetWidth;
    }

    if (reduceMotion.matches || images.length < 2) return;

    if (progress) progress.classList.add("running");

    slideTimer = setTimeout(() => showHeroStudio((current + 1) % images.length), duration);
  }

  links.forEach((link, index) => {
    link.addEventListener("click", event => {
      event.preventDefault();
      showHeroStudio(index);
    });
  });

  /* START ON STUDIO 90 / IMAGE 02 */
  showHeroStudio(1);

  reduceMotion.addEventListener("change", () => {
    clearTimeout(slideTimer);
    if (progress) progress.classList.remove("running");
    if (!reduceMotion.matches) startSlideshow();
  });
}

//PRICES
document.querySelectorAll("[data-price]").forEach(el => {
  const studio = typeof CONFIG !== "undefined" ? CONFIG.studios?.[el.dataset.price] : null;

  if (studio) {
    el.textContent = new Intl.NumberFormat(CONFIG.locale, {
      style: "currency",
      currency: CONFIG.currency,
      maximumFractionDigits: 0
    }).format(studio.price);
  }
});

// DETAILS
(() => {
  const section = document.querySelector("#details");
  if (!section) return;

  const image = section.querySelector("#details-image");
  const vegetationImage = section.querySelector("#details-vegetation");
  const hotspots = section.querySelector("#details-hotspots");
  const specs = section.querySelector("#details-specs");
  const popup = section.querySelector("#details-popup");
  const closeButton = section.querySelector("#details-close");
  const materialLabel = section.querySelector(".details-image-material");
  const priceLabel = section.querySelector("#details-price");
  const buttons = [...section.querySelectorAll(".details-buttons button")];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const commonSpecs = [
    ["02 / Structure", "Precision-built insulated construction."],
    ["03 / Exterior", "Premium timber cladding."],
    ["04 / Interior", "Natural birch plywood finish."],
    ["05 / Glazing", "High-performance glazing."],
    ["06 / Comfort", "Designed for year-round use."]
  ];
  const commonHotspots = [
    { x: 25, y: 35, title: "Exterior", text: "Premium timber cladding." },
    { x: 65, y: 55, title: "Glazing", text: "High-performance glazing." },
    { x: 45, y: 75, title: "Interior", text: "Natural birch plywood finish." }
  ];
  const data = {
    60: {
      image: "images/home/macro/04.webp", vegetation: "images/home/04-veg.png", material: "WIDE ASH",
      specs: [["01 / Size", "58 sq ft. A compact space for work or relaxation."], ...commonSpecs],
      hotspots: commonHotspots
    },
    90: {
      image: "images/home/macro/05.webp", vegetation: "images/home/05-veg.png", material: "WIDE ASH",
      specs: [["01 / Size", "89 sq ft. More room to work, create or relax."], ...commonSpecs],
      hotspots: commonHotspots
    },
    120: {
      image: "images/home/macro/06.webp", vegetation: "images/home/06-veg.png", material: "WIDE ASH",
      specs: [["01 / Size", "119 sq ft. Our largest studio, with generous space."], ...commonSpecs],
      hotspots: commonHotspots
    }
  };

  if (!image || !vegetationImage || !hotspots || !specs || !popup || !materialLabel) {
    console.error("Details section is missing a required element. Check the #details HTML IDs.");
    return;
  }

  let currentSize = "";
  let requestId = 0;
  let parallaxFrame = 0;

  function preload(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  async function showDetails(size) {
    size = String(size);
    const studio = data[size];
    if (!studio) return;

    currentSize = size;
    const request = ++requestId;

    const configuredStudio = typeof CONFIG !== "undefined" ? CONFIG.studios?.[size] : null;
    if (priceLabel && configuredStudio) {
      priceLabel.textContent = new Intl.NumberFormat(CONFIG.locale, {
        style: "currency",
        currency: CONFIG.currency,
        maximumFractionDigits: 0
      }).format(configuredStudio.price);
    }
    buttons.forEach(button => {
      const active = button.dataset.studio === size;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    specs.replaceChildren(...studio.specs.map(([title, text]) => {
      const row = document.createElement("div");
      row.className = "details-spec";
      const heading = document.createElement("h3");
      heading.textContent = title;
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      row.append(heading, paragraph);
      return row;
    }));

    hotspots.replaceChildren(...studio.hotspots.map((spot, index) => {
      const button = document.createElement("button");
      button.className = "details-hotspot";
      button.type = "button";
      button.style.left = `${spot.x}%`;
      button.style.top = `${spot.y}%`;
      button.dataset.hotspot = String(index);
      button.setAttribute("aria-label", spot.title);
      button.textContent = "+";
      return button;
    }));

    popup.classList.remove("open");
    materialLabel.textContent = studio.material;

    const [imageLoaded, vegetationLoaded] = await Promise.all([
      preload(studio.image), preload(studio.vegetation)
    ]);
    if (request !== requestId) return;

    if (!reduceMotion.matches) {
      image.classList.add("is-fading");
      vegetationImage.classList.add("is-fading");
      await new Promise(resolve => setTimeout(resolve, 180));
    }

    if (request !== requestId) return;
    if (imageLoaded) image.src = studio.image;
    if (vegetationLoaded) vegetationImage.src = studio.vegetation;
    image.alt = `Studio ${size}`;
    image.classList.remove("is-fading");
    vegetationImage.classList.remove("is-fading");
  }

  buttons.forEach(button => button.addEventListener("click", () => showDetails(button.dataset.studio)));

  hotspots.addEventListener("click", event => {
    const button = event.target.closest("[data-hotspot]");
    if (!button) return;
    const spot = data[currentSize]?.hotspots[Number(button.dataset.hotspot)];
    if (!spot) return;
    popup.querySelector(".details-popup-title").textContent = spot.title;
    popup.querySelector(".details-popup-text").textContent = spot.text;
    popup.classList.add("open");
  });

  closeButton?.addEventListener("click", () => popup.classList.remove("open"));

  function updateParallax() {
    parallaxFrame = 0;
    if (reduceMotion.matches) return;
    const rect = section.getBoundingClientRect();
    const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
    section.style.setProperty("--image-y", `${-offset * 22}px`);
    section.style.setProperty("--veg-y", `${-offset * 48}px`);
  }

  function requestParallax() {
    if (!parallaxFrame) parallaxFrame = requestAnimationFrame(updateParallax);
  }

  window.addEventListener("scroll", requestParallax, { passive: true });
  window.addEventListener("resize", requestParallax);
  reduceMotion.addEventListener("change", requestParallax);
  showDetails("120");
  updateParallax();
})();

//GALLERY

const gallery = document.querySelector("#gallery");
const galleryBackground = gallery?.querySelector(".gallery-background");
const vegetation = gallery?.querySelector(".vegetation");

let galleryFrame = 0;
function moveGallery() {
  if (!gallery || galleryFrame) return;
  galleryFrame = requestAnimationFrame(() => {
    galleryFrame = 0;
    const rect = gallery.getBoundingClientRect();
    const offset = (innerHeight - rect.top) / (innerHeight + rect.height) - .5;
    galleryBackground?.style.setProperty("--bg-y", `${offset * -gallery.offsetHeight * .15}px`);
    vegetation?.style.setProperty("--veg-y", `${offset * -gallery.offsetHeight * .3}px`);
  });
}

window.addEventListener("scroll", moveGallery, { passive: true });
window.addEventListener("resize", moveGallery);
moveGallery();

// FAQ
document.querySelectorAll(".faq-item").forEach(item => {
  const summary = item.querySelector("summary");
  const content = item.querySelector(".faq-content");
  if (!summary || !content) return;

  content.dataset.state = item.open ? "open" : "closed";
  content.style.height = item.open ? "auto" : "0px";

  content.addEventListener("transitionend", event => {
    if (event.propertyName !== "height") return;

    if (content.dataset.state === "opening") {
      content.dataset.state = "open";
      content.style.height = "auto";
    } else if (content.dataset.state === "closing") {
      content.dataset.state = "closed";
      item.open = false;
    }
  });

  summary.addEventListener("click", event => {
    event.preventDefault();

    const isOpening = !item.open || content.dataset.state === "closing";

    if (isOpening) {
      const currentHeight = content.getBoundingClientRect().height;
      item.open = true;
      content.dataset.state = "opening";
      content.style.height = `${currentHeight}px`;
      requestAnimationFrame(() => {
        if (content.dataset.state === "opening") {
          content.style.height = `${content.scrollHeight}px`;
        }
      });
    } else {
      const currentHeight = content.getBoundingClientRect().height;
      content.dataset.state = "closing";
      content.style.height = `${currentHeight}px`;
      requestAnimationFrame(() => {
        if (content.dataset.state === "closing") content.style.height = "0px";
      });
    }
  });
});