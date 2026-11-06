/*---HELPERS---*/

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const money = value => new Intl.NumberFormat("en-GB", {
  style: "currency", currency: "GBP", maximumFractionDigits: 0
}).format(value);

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

$$("[data-price]").forEach(el => {
  const price = PRICES[el.dataset.price];
  if (price) el.textContent = money(price);
});


/*---SCROLL REVEAL---*/

const fadeElements = $$(".fade-in");
const studioCards = $$(".studio");

if (!reduceMotion && "IntersectionObserver" in window) {
  document.documentElement.classList.add("motion-ready");

  const reveal = (elements, options) => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, options);

    elements.forEach(el => observer.observe(el));
  };

  reveal(fadeElements, {
    threshold: .25,
    rootMargin: "0px 0px -32px 0px"
  });

  reveal(studioCards, {
    threshold: .15,
    rootMargin: "0px 0px -40px 0px"
  });

} else {
  [...fadeElements, ...studioCards].forEach(el => el.classList.add("is-visible"));
}


/*---NAVIGATION---*/

const header = $(".intro-header");

if (header) {
  const menu = $(".intro-menu-button", header);
  const nav = $(".intro-nav", header);
  const mobile = matchMedia("(max-width: 860px)");

  const closeMenu = () => {
    header.classList.remove("menu-open");
    menu?.setAttribute("aria-expanded", "false");
    menu?.setAttribute("aria-label", "Open menu");
  };

  menu?.addEventListener("click", () => {
    const open = !header.classList.contains("menu-open") && mobile.matches;

    header.classList.toggle("menu-open", open);
    menu.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  nav?.addEventListener("click", e => {
    if (e.target.closest("a")) closeMenu();
  });

  document.addEventListener("click", e => {
    if (!header.contains(e.target)) closeMenu();
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && header.classList.contains("menu-open")) {
      closeMenu();
      menu?.focus();
    }
  });

  mobile.addEventListener("change", closeMenu);

  const updateHeader = () => {
    header.classList.toggle("scrolled", scrollY > 30);
  };

  addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();
}


/*---HERO SLIDESHOW---*/

const hero = $("#introduction");

if (hero) {
  const images = $$(".intro-image", hero);
  const links = $$(".intro-studio-links a", hero);
  const progress = $(".intro-progress", hero);
  const detail = $(".intro-detail", hero);

  const duration = 6500;

  let index = Math.max(0, images.findIndex(el => el.classList.contains("active")));
  let timer;
  let paused = false;

  const stop = () => {
    clearTimeout(timer);
    progress?.classList.remove("running");
  };

  const show = next => {
    if (images.length !== links.length || !images.length) return;

    index = (next + images.length) % images.length;

    images.forEach((el, i) => {
      el.classList.toggle("active", i === index);
    });

    links.forEach((el, i) => {
      const active = i === index;

      el.classList.toggle("active", active);

      if (active) {
        el.setAttribute("aria-current", "true");
      } else {
        el.removeAttribute("aria-current");
      }
    });

    const studio = $(`#studio-${links[index].dataset.studio}`);

    if (detail && studio) {
      const sqft = studio.dataset.sqft ||
        $(".dimensions span:last-child", studio)?.textContent.split(" ")[0];

      detail.textContent = `${sqft} sq ft / ${detail.dataset.finish}`;
    }

    stop();

    if (!reduceMotion && !paused && !document.hidden) {
      void progress?.offsetWidth;
      progress?.classList.add("running");
      timer = setTimeout(() => show(index + 1), duration);
    }
  };

  links.forEach((link, i) => {
    link.addEventListener("click", e => {
      e.preventDefault();
      paused = false;
      show(i);
    });
  });

  hero.addEventListener("focusin", () => {
    paused = true;
    stop();
  });

  hero.addEventListener("focusout", e => {
    if (!hero.contains(e.relatedTarget)) {
      paused = false;
      show(index);
    }
  });

  document.addEventListener("visibilitychange", () => show(index));

  show(index);
}


/*---STUDIO DETAILS AND HOTSPOTS---*/

const details = $("#details");

if (details) {
  const frame = $(".details-image", details);

  const photo = $("#details-image");
  const nextPhoto = $("#details-image-next");

  const mobilePhoto = $("#details-image-mobile");
  const nextMobilePhoto = $("#details-image-next-mobile");

  // Match the 720px breakpoint in the HTML picture elements.
  const mobile = matchMedia("(max-width: 720px)");

  const price = $("#details-price");
  const sizeText = $("#details-size");

  const buttons = $$(".details-buttons button", details);
  const hotspotSets = $$(".hotspot-set", details);
  const caption = $(".hotspot-description", details);

  let request = 0;

  const load = src => new Promise(resolve => {
    const image = new Image();

    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);

    image.src = src;
  });

  const showDetails = async size => {
    const button = buttons.find(el => el.dataset.studio === String(size));

    if (!button) return;

    const macro = button.dataset.imageMacro;
    const micro = button.dataset.imageMicro;
    const src = mobile.matches ? micro : macro;

    const current = ++request;

    // Update information.

    if (price) price.textContent = money(PRICES[size]);

    if (sizeText) {
      sizeText.textContent = `${button.dataset.sqft} sq ft. ${button.dataset.description}`;
    }

    // Update active studio button.

    buttons.forEach(el => {
      const active = el === button;

      el.classList.toggle("active", active);
      el.setAttribute("aria-pressed", String(active));
    });

    // Update hotspots.

    hotspotSets.forEach(set => {
      set.hidden = set.dataset.studio !== String(size);

      $$(".hotspot", set).forEach(el => {
        el.setAttribute("aria-expanded", "false");
      });
    });

    if (caption) {
      caption.hidden = true;
      caption.textContent = "";
    }

    // Already showing this image.

    if (photo.currentSrc.endsWith(src)) {
      frame.classList.remove("is-crossfading");
      return;
    }

    // Load incoming image before starting transition.

    if (!await load(src) || current !== request) {
      if (current === request) frame.classList.remove("is-crossfading");
      return;
    }

    // Set incoming desktop and mobile sources.

    nextPhoto.src = macro;

    if (nextMobilePhoto) {
      nextMobilePhoto.srcset = micro;
    }

    nextPhoto.alt = "";

    try {
      await nextPhoto.decode();
    } catch {}

    if (current !== request) return;

    // Fade incoming image over the current image.

    frame.classList.add("is-crossfading");

    await new Promise(resolve => {
      setTimeout(resolve, reduceMotion ? 0 : 550);
    });

    if (current !== request) return;

    // Replace underlying image once fade is complete.

    photo.src = macro;
    photo.alt = `Studio ${size} exterior`;

    if (mobilePhoto) {
      mobilePhoto.srcset = micro;
    }

    try {
      await photo.decode();
    } catch {}

    if (current !== request) return;

    // Fade out the temporary image.

    frame.classList.remove("is-crossfading");
  };

  // Studio selection buttons.

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      showDetails(button.dataset.studio);
    });
  });

  // Explore links from studio cards.

  $$(".studio-explore-link").forEach(link => {
    link.addEventListener("click", () => {
      showDetails(link.dataset.size);
    });
  });

  // Hotspot interactions.

  $$(".hotspot", details).forEach(button => {
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") !== "true";

      $$(".hotspot", details).forEach(el => {
        el.setAttribute("aria-expanded", "false");
      });

      button.setAttribute("aria-expanded", String(open));

      if (caption) {
        caption.textContent = open ? button.dataset.note : "";
        caption.hidden = !open;
      }
    });
  });

  // Initial studio.

  showDetails(120);

  // Update image when crossing responsive breakpoint.

  mobile.addEventListener("change", () => {
    const active = buttons.find(el => el.classList.contains("active"));
    showDetails(active?.dataset.studio || 120);
  });
}


/*---FAQ---*/

$$(".faq-item").forEach(item => {
  const summary = $("summary", item);
  const answer = $(".faq-answer", item);

  if (!summary || !answer) return;

  summary.addEventListener("click", e => {
    e.preventDefault();

    if (item.open) {
      answer.style.height = `${answer.scrollHeight}px`;

      requestAnimationFrame(() => {
        answer.style.height = "0px";
      });

      answer.addEventListener("transitionend", function close() {
        item.open = false;
        answer.style.height = "";
      }, { once: true });

    } else {
      item.open = true;
      answer.style.height = "0px";

      requestAnimationFrame(() => {
        answer.style.height = `${answer.scrollHeight}px`;
      });

      answer.addEventListener("transitionend", function finish() {
        answer.style.height = "auto";
      }, { once: true });
    }
  });
});


/*---VEGETATION DEPTH---*/

const depthSections = $$(".depth");

if (!reduceMotion && depthSections.length && "IntersectionObserver" in window) {
  const visible = new Set();
  let pending = false;

  const update = () => {
    if (pending) return;

    pending = true;

    requestAnimationFrame(() => {
      visible.forEach(section => {
        const rect = section.getBoundingClientRect();

        const position = (
          rect.top + rect.height / 2 - innerHeight / 2
        ) / innerHeight;

        section.style.setProperty(
          "--p",
          Math.max(-1, Math.min(1, position)).toFixed(3)
        );
      });

      pending = false;
    });
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        visible.add(entry.target);
      } else {
        visible.delete(entry.target);
      }
    });

    update();
  }, {
    rootMargin: "100px 0px"
  });

  depthSections.forEach(section => observer.observe(section));

  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);

  update();
}