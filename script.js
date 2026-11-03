/* Shared utilities */
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const money = value => new Intl.NumberFormat(CONFIG.locale, {
  style: "currency",
  currency: CONFIG.currency,
  maximumFractionDigits: 0
}).format(value);

$$('[data-price]').forEach(element => {
  const studio = CONFIG.studios[element.dataset.price];
  if (studio) element.textContent = money(studio.price);
});

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Viewport reveal */
const fadeElements = $$('.fade-in');
if (!reduceMotion && "IntersectionObserver" in window && fadeElements.length) {
  document.documentElement.classList.add("motion-ready");
  const fadeObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -32px 0px" });
  fadeElements.forEach(element => fadeObserver.observe(element));
} else {
  fadeElements.forEach(element => element.classList.add("is-visible"));
}

/* Navigation */
const header = $('.intro-header');
if (header) {
  const menuButton = $('.intro-menu-button', header);
  const navigation = $('.intro-nav', header);
  const mobileMenu = window.matchMedia("(max-width: 860px)");

  if (menuButton && navigation) {
    const setMenu = (open, returnFocus = false) => {
      const isOpen = Boolean(open && mobileMenu.matches);
      header.classList.toggle("menu-open", isOpen);
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
      if (returnFocus) menuButton.focus();
    };

    menuButton.addEventListener("click", () => {
      setMenu(menuButton.getAttribute("aria-expanded") !== "true");
    });
    navigation.addEventListener("click", event => {
      if (event.target.closest("a")) setMenu(false);
    });
    document.addEventListener("click", event => {
      if (!header.contains(event.target)) setMenu(false);
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && header.classList.contains("menu-open")) {
        setMenu(false, true);
      }
    });
    mobileMenu.addEventListener("change", () => setMenu(false));
  }

  const updateHeader = () => header.classList.toggle("scrolled", window.scrollY > 30);
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();
}

/* Hero slideshow */
const hero = $('#introduction');
if (hero) {
  const images = $$('.intro-image', hero);
  const links = $$('.intro-studio-links a', hero);
  const progress = $('.intro-progress', hero);
  const detail = $('.intro-detail', hero);
  const duration = 6500;
  let activeIndex = Math.max(0, images.findIndex(image => image.classList.contains("active")));
  let heroTimer;
  let paused = false;

  const stopHero = () => {
    window.clearTimeout(heroTimer);
    if (progress) progress.classList.remove("running");
  };

  const scheduleHero = () => {
    stopHero();
    if (reduceMotion || paused || document.hidden || images.length < 2) return;
    if (progress) {
      void progress.offsetWidth;
      progress.classList.add("running");
    }
    heroTimer = window.setTimeout(() => showHero(activeIndex + 1), duration);
  };

  const showHero = index => {
    if (!images.length || images.length !== links.length) return;
    activeIndex = (index + images.length) % images.length;
    images.forEach((image, i) => image.classList.toggle("active", i === activeIndex));
    links.forEach((link, i) => {
      const active = i === activeIndex;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });

    const studio = CONFIG.studios[links[activeIndex].dataset.studio];
    if (detail && studio) detail.textContent = `${studio.sqft} sq ft / ${detail.dataset.finish}`;
    scheduleHero();
  };

  links.forEach((link, index) => link.addEventListener("click", event => {
    event.preventDefault();
    paused = false;
    showHero(index);
  }));

  hero.addEventListener("focusin", () => {
    paused = true;
    stopHero();
  });
  hero.addEventListener("focusout", event => {
    if (!hero.contains(event.relatedTarget)) {
      paused = false;
      scheduleHero();
    }
  });
  document.addEventListener("visibilitychange", scheduleHero);

  if (images.length && images.length === links.length) showHero(activeIndex);
}

/* Studio details and hotspots */
const details = $('#details');
if (details) {
  const photo = $('#details-image', details);
  const nextPhoto = $('#details-image-next', details);
  const mobileImages = window.matchMedia("(max-width: 600px)");
  const price = $('#details-price', details);
  const sizeText = $('#details-size', details);
  const buttons = $$('.details-buttons button', details);
  const hotspotSets = $$('.hotspot-set', details);
  const hotspots = $$('.hotspot', details);
  let photoRequest = 0;

  const preloadImage = src => new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = src;
  });

  const showDetails = async size => {
    const studio = CONFIG.studios[size];
    if (!studio || !photo) return;
    const folder = mobileImages.matches ? "micro" : "macro";
    const imageSrc = `images/home/${folder}/${studio.photo}.webp`;

    const request = ++photoRequest;

    if (price) price.textContent = money(studio.price);
    if (sizeText) sizeText.textContent = `${studio.sqft} sq ft. ${studio.description}`;
    buttons.forEach(button => {
      const active = button.dataset.studio === String(size);
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    hotspotSets.forEach(set => {
      set.hidden = set.dataset.studio !== String(size);
      $$('.hotspot', set).forEach(button => button.setAttribute("aria-expanded", "false"));
    });

    if (photo.getAttribute("src") === imageSrc) return;
    const loaded = await preloadImage(imageSrc);
    if (request !== photoRequest || !loaded) return;

    if (!nextPhoto) {
      photo.src = imageSrc;
      photo.alt = `Studio ${size} exterior`;
      return;
    }

    // Load the incoming frame underneath the current one, then crossfade.
    nextPhoto.src = imageSrc;
    nextPhoto.alt = "";
    if (nextPhoto.decode) {
      try { await nextPhoto.decode(); } catch { /* preload already confirmed the image */ }
    }
    if (request !== photoRequest) return;

    details.classList.add("is-crossfading");
    await new Promise(resolve => window.setTimeout(resolve, reduceMotion ? 0 : 550));
    if (request !== photoRequest) {
      details.classList.remove("is-crossfading");
      return;
    }

    photo.src = imageSrc;
    photo.alt = `Studio ${size} exterior`;
    details.classList.remove("is-crossfading");
  };

  buttons.forEach(button => button.addEventListener("click", () => showDetails(button.dataset.studio)));
  $$('.studio-explore-link').forEach(link => link.addEventListener("click", () => showDetails(link.dataset.size)));
  hotspots.forEach(button => button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") !== "true";
    hotspots.forEach(other => other.setAttribute("aria-expanded", "false"));
    button.setAttribute("aria-expanded", String(open));
  }));
  showDetails(120);
  mobileImages.addEventListener("change", () => {
    const active = buttons.find(button => button.classList.contains("active"));
    showDetails(active?.dataset.studio || "120");
  });
}


/* FAQ: animate both opening and closing before changing the native details state */
$$('.faq-item').forEach(item => {
  const summary = $('summary', item);
  if (!summary) return;

  summary.addEventListener("click", event => {
    if (item.classList.contains("is-closing")) {
      event.preventDefault();
      return;
    }

    if (item.open) {
      event.preventDefault();
      item.classList.add("is-closing");
      window.setTimeout(() => {
        item.open = false;
        item.classList.remove("is-closing");
      }, reduceMotion ? 0 : 320);
      return;
    }

    event.preventDefault();
    item.open = true;
    item.classList.remove("is-closing");
  });
});

/* Restrained vegetation depth effect */
const depthSections = $$('.depth');
if (!reduceMotion && depthSections.length && "IntersectionObserver" in window) {
  const visibleSections = new Set();
  let framePending = false;
  const updateDepth = () => {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(() => {
      visibleSections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const position = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
        section.style.setProperty("--p", Math.max(-1, Math.min(1, position)).toFixed(3));
      });
      framePending = false;
    });
  };
  const depthObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) visibleSections.add(entry.target);
      else visibleSections.delete(entry.target);
    });
    updateDepth();
  }, { rootMargin: "100px 0px" });
  depthSections.forEach(section => depthObserver.observe(section));
  window.addEventListener("scroll", updateDepth, { passive: true });
  window.addEventListener("resize", updateDepth);
  updateDepth();
}
