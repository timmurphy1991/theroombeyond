/* SHARED UTILITIES */
const money = value => new Intl.NumberFormat(CONFIG.locale, {
  style: "currency",
  currency: CONFIG.currency,
  maximumFractionDigits: 0
}).format(value);

document.querySelectorAll("[data-price]").forEach(element => {
  const studio = CONFIG.studios[element.dataset.price];
  if (studio) element.textContent = money(studio.price);
});

/* NAVIGATION */
const header = document.querySelector(".intro-header");
const menuButton = header?.querySelector(".intro-menu-button");

if (header && menuButton) {
  const setMenu = open => {
    header.classList.toggle("menu-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  menuButton.addEventListener("click", () =>
    setMenu(!header.classList.contains("menu-open"))
  );
  header.querySelectorAll("nav a").forEach(link =>
    link.addEventListener("click", () => setMenu(false))
  );
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") setMenu(false);
  });
  document.addEventListener("click", event => {
    if (!header.contains(event.target)) setMenu(false);
  });

  const updateHeader = () => header.classList.toggle("scrolled", window.scrollY > 30);
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();
}

/* HERO SLIDESHOW */
const hero = document.querySelector("#introduction");

if (hero) {
  const heroImages = [...hero.querySelectorAll(".intro-image")];
  const heroLinks = [...hero.querySelectorAll(".intro-studio-links a")];
  const progress = hero.querySelector(".intro-progress");
  const heroDetail = hero.querySelector(".intro-detail");
  const duration = 6000;
  let activeHero = Math.max(0, heroImages.findIndex(image => image.classList.contains("active")));
  let heroTimer;

  function showHero(index) {
    if (!heroImages.length || !heroLinks.length) return;
    activeHero = (index + heroImages.length) % heroImages.length;

    heroImages.forEach((image, i) => image.classList.toggle("active", i === activeHero));
    heroLinks.forEach((link, i) => {
      const active = i === activeHero;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });

    const studio = CONFIG.studios[heroLinks[activeHero]?.dataset.studio];
    if (heroDetail && studio) {
      heroDetail.textContent = `${studio.sqft} sq ft / ${heroDetail.dataset.finish}`;
    }

    clearInterval(heroTimer);
    if (progress) {
      progress.classList.remove("running");
      void progress.offsetWidth;
      progress.classList.add("running");
    }
    heroTimer = setInterval(() => showHero(activeHero + 1), duration);
  }

  heroLinks.forEach((link, index) => link.addEventListener("click", event => {
    event.preventDefault();
    showHero(index);
  }));

  if (heroImages.length) showHero(activeHero);
}

/* STUDIO DETAILS */
const details = document.querySelector("#details");

if (details) {
  const studios = {
    60: {
      photo: "04",
      description: "A compact space for work or relaxation.",
      hotspots: [
        ["cladding", 22, 32, "Thermowood cladding, machined for a clean, consistent finish."],
        ["glazing", 52, 48, "High-performance glazing, made and fitted by our own team."],
        ["structure", 74, 73, "An insulated structure designed for comfortable, year-round use."]
      ]
    },
    90: {
      photo: "05",
      description: "More room to work, create or relax.",
      hotspots: [
        ["cladding", 28, 34, "Thermowood cladding, machined for a clean, consistent finish."],
        ["glazing", 58, 48, "High-performance glazing, made and fitted by our own team."],
        ["structure", 76, 72, "An insulated structure designed for comfortable, year-round use."]
      ]
    },
    120: {
      photo: "06",
      description: "Our largest studio, with generous space.",
      hotspots: [
        ["cladding", 18, 30, "Thermowood cladding, machined for a clean, consistent finish."],
        ["glazing", 48, 44, "High-performance glazing, made and fitted by our own team."],
        ["structure", 80, 75, "An insulated structure designed for comfortable, year-round use."]
      ]
    }
  };

  const photo = details.querySelector("#details-image");
  const price = details.querySelector("#details-price");
  const sizeText = details.querySelector("#details-size");
  const buttons = [...details.querySelectorAll(".details-buttons button")];
  const hotspots = [...details.querySelectorAll(".hotspot")];
  let photoRequest = 0;

  const setHotspots = studio => {
    hotspots.forEach(button => {
      const hotspot = studio.hotspots.find(([key]) => key === button.dataset.hotspot);
      if (!hotspot) return;
      const [, left, top, copy] = hotspot;
      button.style.left = `${left}%`;
      button.style.top = `${top}%`;
      const note = button.querySelector(".hotspot-note");
      if (note) note.textContent = copy;
      button.setAttribute("aria-expanded", "false");
    });
  };

  const preloadImage = src => new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = src;
  });

  async function showDetails(size) {
    const studio = studios[size];
    const config = CONFIG.studios[size];
    if (!studio || !config || !photo) return;

    const imageSrc = `images/home/macro/${studio.photo}.webp`;
    const request = ++photoRequest;

    if (price) price.textContent = money(config.price);
    if (sizeText) sizeText.textContent = `${config.sqft} sq ft. ${studio.description}`;

    buttons.forEach(button => {
      const active = button.dataset.studio === String(size);
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    setHotspots(studio);
    if (photo.getAttribute("src") === imageSrc) return;

    const imageLoaded = await preloadImage(imageSrc);
    if (request !== photoRequest) return;

    details.classList.add("is-fading");
    await new Promise(resolve => setTimeout(resolve, 180));
    if (request !== photoRequest) {
      details.classList.remove("is-fading");
      return;
    }

    if (imageLoaded) {
      photo.src = imageSrc;
      photo.alt = `Studio ${size}`;
    }
    details.classList.remove("is-fading");
  }

  buttons.forEach(button =>
    button.addEventListener("click", () => showDetails(button.dataset.studio))
  );

  document.querySelectorAll(".studio-explore-link").forEach(link =>
    link.addEventListener("click", () => showDetails(link.dataset.size))
  );

  hotspots.forEach(button => button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") !== "true";
    hotspots.forEach(other => other.setAttribute("aria-expanded", "false"));
    button.setAttribute("aria-expanded", String(open));
  }));

  showDetails(120);
}

/* SHARED VEGETATION PARALLAX */
const depthSections = [...document.querySelectorAll(".depth")];

if (depthSections.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const visibleSections = new Set();
  let framePending = false;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) visibleSections.add(entry.target);
      else visibleSections.delete(entry.target);
    });
    updateDepth();
  }, { rootMargin: "100px 0px" });

  depthSections.forEach(section => observer.observe(section));

  function updateDepth() {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(() => {
      visibleSections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const position = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
        section.style.setProperty("--p", Math.max(-1, Math.min(1, position)).toFixed(3));
      });
      framePending = false;
    });
  }

  window.addEventListener("scroll", updateDepth, { passive: true });
  window.addEventListener("resize", updateDepth);
  updateDepth();
}
