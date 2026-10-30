
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

  const updateHeader = () =>
    header.classList.toggle("scrolled", window.scrollY > 30);

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

  let activeHero = Math.max(
    0,
    heroImages.findIndex(image => image.classList.contains("active"))
  );

  let heroTimer;

  function showHero(index) {
    if (!heroImages.length || !heroLinks.length) return;

    activeHero = (index + heroImages.length) % heroImages.length;

    heroImages.forEach((image, i) =>
      image.classList.toggle("active", i === activeHero)
    );

    heroLinks.forEach((link, i) => {
      const active = i === activeHero;

      link.classList.toggle("active", active);

      if (active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });

    const studio = CONFIG.studios[heroLinks[activeHero]?.dataset.studio];

    if (heroDetail && studio) {
      heroDetail.textContent =
        `${studio.sqft} sq ft / ${heroDetail.dataset.finish}`;
    }

    clearInterval(heroTimer);

    if (progress) {
      progress.classList.remove("running");
      void progress.offsetWidth;
      progress.classList.add("running");
    }

    heroTimer = setInterval(() => showHero(activeHero + 1), duration);
  }

  heroLinks.forEach((link, index) => {
    link.addEventListener("click", event => {
      event.preventDefault();
      showHero(index);
    });
  });

  if (heroImages.length) showHero(activeHero);
}


/* STUDIO DETAILS */
const details = document.querySelector("#details");

if (details) {
  const studios = {
    60: {
      photo: "04",
      description: "Compact and composed, made for focused work."
    },
    90: {
      photo: "05",
      description: "Space to work, create and unwind in comfort."
    },
    120: {
      photo: "06",
      description: "Our largest studio, generous in proportion."
    }
  };

  const photo = details.querySelector("#details-image");
  const price = details.querySelector("#details-price");
  const sizeText = details.querySelector("#details-size");
  const buttons = [...details.querySelectorAll(".details-buttons button")];
  const hotspotSets = [...details.querySelectorAll(".hotspot-set")];
  const hotspots = [...details.querySelectorAll(".hotspot")];

  let photoRequest = 0;

  function updateDetailsHotspots(size) {
    hotspotSets.forEach(set => {
      set.hidden = set.dataset.studio !== String(size);

      set.querySelectorAll(".hotspot").forEach(button => {
        button.setAttribute("aria-expanded", "false");
      });
    });
  }

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

    if (price) {
      price.textContent = money(config.price);
    }

    if (sizeText) {
      sizeText.textContent =
        `${config.sqft} sq ft. ${studio.description}`;
    }

    buttons.forEach(button => {
      const active = button.dataset.studio === String(size);

      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    updateDetailsHotspots(size);

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

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      showDetails(button.dataset.studio);
    });
  });

  document.querySelectorAll(".studio-explore-link").forEach(link => {
    link.addEventListener("click", () => {
      showDetails(link.dataset.size);
    });
  });

  hotspots.forEach(button => {
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") !== "true";

      hotspots.forEach(other => {
        other.setAttribute("aria-expanded", "false");
      });

      button.setAttribute("aria-expanded", String(open));
    });
  });

  showDetails(120);
}



/* MOBILE HIGHLIGHTS */
const highlights = [...document.querySelectorAll(".highlight")];

if (highlights.length) {
  const mobileHighlights = window.matchMedia("(max-width: 600px)");

  highlights.forEach(item => {
    const button = item.querySelector(".highlight-label");
    if (!button) return;

    button.disabled = !mobileHighlights.matches;

    button.addEventListener("click", () => {
      if (!mobileHighlights.matches) return;

      const willOpen = !item.classList.contains("is-open");

      highlights.forEach(other => {
        other.classList.remove("is-open");
        other.querySelector(".highlight-label")?.setAttribute("aria-expanded", "false");
      });

      if (willOpen) {
        item.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });

  const resetHighlights = () => {
    highlights.forEach(item => {
      item.classList.remove("is-open");
      const button = item.querySelector(".highlight-label");
      button?.setAttribute("aria-expanded", "false");
      if (button) button.disabled = !mobileHighlights.matches;
    });
  };

  mobileHighlights.addEventListener("change", resetHighlights);
}


/* FAQ ACCORDION */
document.querySelectorAll(".faq-item").forEach(item => {
  const summary = item.querySelector("summary");
  const answer = item.querySelector(":scope > p");

  if (!summary || !answer) return;

  summary.setAttribute("aria-expanded", String(item.open));

  summary.addEventListener("click", event => {
    event.preventDefault();

    item.open = !item.open;
    summary.setAttribute("aria-expanded", String(item.open));
  });
});

/* SHARED VEGETATION PARALLAX */
const depthSections = [...document.querySelectorAll(".depth")];

if (
  depthSections.length &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  const visibleSections = new Set();
  let framePending = false;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        visibleSections.add(entry.target);
      } else {
        visibleSections.delete(entry.target);
      }
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

        const position =
          (rect.top + rect.height / 2 - window.innerHeight / 2) /
          window.innerHeight;

        section.style.setProperty(
          "--p",
          Math.max(-1, Math.min(1, position)).toFixed(3)
        );
      });

      framePending = false;
    });
  }

  window.addEventListener("scroll", updateDepth, { passive: true });
  window.addEventListener("resize", updateDepth);

  updateDepth();
}