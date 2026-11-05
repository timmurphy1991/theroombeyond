/* Helpers */
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const money = value => new Intl.NumberFormat("en-GB", {
  style: "currency", currency: "GBP", maximumFractionDigits: 0
}).format(value);

$$("[data-price]").forEach(el => {
  const price = PRICES[el.dataset.price];
  if (price) el.textContent = money(price);
});

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Reveal */
const fadeElements = $$(".fade-in");
if (!reduceMotion && "IntersectionObserver" in window) {
  document.documentElement.classList.add("motion-ready");
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }), { threshold: .25, rootMargin: "0px 0px -32px 0px" });
  fadeElements.forEach(el => observer.observe(el));
} else fadeElements.forEach(el => el.classList.add("is-visible"));

/* Navigation */
const header = $(".intro-header");
if (header) {
  const menu = $(".intro-menu-button", header), nav = $(".intro-nav", header);
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
  nav?.addEventListener("click", e => { if (e.target.closest("a")) closeMenu(); });
  document.addEventListener("click", e => { if (!header.contains(e.target)) closeMenu(); });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && header.classList.contains("menu-open")) {
      closeMenu();
      menu?.focus();
    }
  });
  mobile.addEventListener("change", closeMenu);
  const updateHeader = () => header.classList.toggle("scrolled", scrollY > 30);
  addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();
}

/* Hero slideshow */
const hero = $("#introduction");
if (hero) {
  const images = $$(".intro-image", hero), links = $$(".intro-studio-links a", hero);
  const progress = $(".intro-progress", hero), detail = $(".intro-detail", hero);
  const duration = 6500;
  let index = Math.max(0, images.findIndex(el => el.classList.contains("active")));
  let timer, paused = false;

  const stop = () => {
    clearTimeout(timer);
    progress?.classList.remove("running");
  };
  const show = next => {
    if (images.length !== links.length || !images.length) return;
    index = (next + images.length) % images.length;
    images.forEach((el, i) => el.classList.toggle("active", i === index));
    links.forEach((el, i) => {
      el.classList.toggle("active", i === index);
      i === index ? el.setAttribute("aria-current", "true") : el.removeAttribute("aria-current");
    });
    const studio = $(`#studio-${links[index].dataset.studio}`);
    if (detail && studio) detail.textContent = `${studio.dataset.sqft || studio.querySelector(".dimensions span:last-child").textContent.split(" ")[0]} sq ft / ${detail.dataset.finish}`;
    stop();
    if (!reduceMotion && !paused && !document.hidden) {
      void progress?.offsetWidth;
      progress?.classList.add("running");
      timer = setTimeout(() => show(index + 1), duration);
    }
  };
  links.forEach((link, i) => link.addEventListener("click", e => {
    e.preventDefault(); paused = false; show(i);
  }));
  hero.addEventListener("focusin", () => { paused = true; stop(); });
  hero.addEventListener("focusout", e => {
    if (!hero.contains(e.relatedTarget)) { paused = false; show(index); }
  });
  document.addEventListener("visibilitychange", () => show(index));
  show(index);
}

/* Studio details and hotspots */
const details = $("#details");
if (details) {
  const frame = $(".details-image", details);
  const photo = $("#details-image"), nextPhoto = $("#details-image-next");
  const mobilePhoto = $("#details-image-mobile"), nextMobilePhoto = $("#details-image-next-mobile");
  const mobile = matchMedia("(max-width: 600px)");
  const price = $("#details-price"), sizeText = $("#details-size");
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
    const macro = button.dataset.imageMacro, micro = button.dataset.imageMicro;
    const src = mobile.matches ? micro : macro;
    const current = ++request;

    if (price) price.textContent = money(PRICES[size]);
    if (sizeText) sizeText.textContent = `${button.dataset.sqft} sq ft. ${button.dataset.description}`;
    buttons.forEach(el => {
      const active = el === button;
      el.classList.toggle("active", active);
      el.setAttribute("aria-pressed", String(active));
    });
    hotspotSets.forEach(set => {
      set.hidden = set.dataset.studio !== String(size);
      $$(".hotspot", set).forEach(el => el.setAttribute("aria-expanded", "false"));
    });
    if (caption) { caption.hidden = true; caption.textContent = ""; }

    if (photo.src.endsWith(src)) return;
    if (!await load(src) || current !== request) return;
    nextPhoto.src = src;
    nextPhoto.alt = "";
    if (mobilePhoto) mobilePhoto.srcset = micro;
    if (nextMobilePhoto) nextMobilePhoto.srcset = micro;
    try { await nextPhoto.decode(); } catch {}
    if (current !== request) return;

    frame.classList.add("is-crossfading");
    await new Promise(resolve => setTimeout(resolve, reduceMotion ? 0 : 550));
    if (current !== request) { frame.classList.remove("is-crossfading"); return; }
    photo.src = src;
    photo.alt = `Studio ${size} exterior`;
    if (mobilePhoto) mobilePhoto.srcset = micro;
    frame.classList.remove("is-crossfading");
  };

  buttons.forEach(button => button.addEventListener("click", () => showDetails(button.dataset.studio)));
  $$(".studio-explore-link").forEach(link => link.addEventListener("click", () => showDetails(link.dataset.size)));
  $$(".hotspot", details).forEach(button => button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") !== "true";
    $$(".hotspot", details).forEach(el => el.setAttribute("aria-expanded", "false"));
    button.setAttribute("aria-expanded", String(open));
    if (caption) {
      caption.textContent = open ? button.dataset.note : "";
      caption.hidden = !open;
    }
  }));
  showDetails(120);
  mobile.addEventListener("change", () => showDetails(buttons.find(el => el.classList.contains("active"))?.dataset.studio || 120));
}


/* FAQ */

$$(".faq-item").forEach(item => {
  const summary = $("summary", item);
  const answer = $(".faq-answer", item);

  summary?.addEventListener("click", e => {
    e.preventDefault();

    if (item.open) {
      answer.style.height = answer.scrollHeight + "px";
      requestAnimationFrame(() => answer.style.height = "0px");

      answer.addEventListener("transitionend", function close() {
        item.open = false;
        answer.style.height = "";
        answer.removeEventListener("transitionend", close);
      }, { once: true });

    } else {
      item.open = true;
      answer.style.height = "0px";

      requestAnimationFrame(() => {
        answer.style.height = answer.scrollHeight + "px";
      });

      answer.addEventListener("transitionend", function finish() {
        answer.style.height = "auto";
        answer.removeEventListener("transitionend", finish);
      }, { once: true });
    }
  });
});


/* Vegetation depth */
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
        const position = (rect.top + rect.height / 2 - innerHeight / 2) / innerHeight;
        section.style.setProperty("--p", Math.max(-1, Math.min(1, position)).toFixed(3));
      });
      pending = false;
    });
  };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
    update();
  }, { rootMargin: "100px 0px" });
  depthSections.forEach(section => observer.observe(section));
  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);
  update();
}
