/* PRICES */
const money = n => new Intl.NumberFormat(CONFIG.locale, {
  style: "currency", currency: CONFIG.currency, maximumFractionDigits: 0
}).format(n);
document.querySelectorAll("[data-price]").forEach(el => {
  el.textContent = money(CONFIG.studios[el.dataset.price].price);
});

/* NAV */
const header = document.querySelector(".intro-header");
const menu = header.querySelector(".intro-menu-button");
const setMenu = open => {
  header.classList.toggle("menu-open", open);
  menu.setAttribute("aria-expanded", open);
  menu.setAttribute("aria-label", open ? "Close menu" : "Open menu");
};
menu.addEventListener("click", () => setMenu(!header.classList.contains("menu-open")));
header.querySelectorAll("nav a").forEach(a => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });
document.addEventListener("click", e => { if (!header.contains(e.target)) setMenu(false); });
const updateHeader = () => header.classList.toggle("scrolled", scrollY > 30);
addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

/* HERO: auto-rotate, with manual selection and progress */
const hero = document.querySelector("#introduction");
const images = [...hero.querySelectorAll(".intro-image")];
const links = [...hero.querySelectorAll(".intro-studio-links a")];
const progress = hero.querySelector(".intro-progress");
const detail = hero.querySelector(".intro-detail");
let active = 1, timer;
function showHero(index, restart = true) {
  active = index;
  images.forEach((img, i) => img.classList.toggle("active", i === index));
  links.forEach((link, i) => {
    link.classList.toggle("active", i === index);
    if (i === index) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  });
  detail.textContent = `${CONFIG.studios[links[index].dataset.studio].sqft} sq ft / ${detail.dataset.finish}`;
  if (restart) {
    clearInterval(timer);
    progress.classList.remove("running");
    void progress.offsetWidth;
    progress.classList.add("running");
    timer = setInterval(() => showHero((active + 1) % images.length), 6000);
  }
}
links.forEach((link, i) => link.addEventListener("click", e => {
  e.preventDefault();
  showHero(i);
}));
showHero(1);

/* DETAILS */
const details = document.querySelector("#details");
const sizes = {
  60: { photo: "04", text: "A compact space for work or relaxation." },
  90: { photo: "05", text: "More room to work, create or relax." },
  120: { photo: "06", text: "Our largest studio, with generous space." }
};
const photo = details.querySelector("#details-image");
const foliage = details.querySelector("#details-vegetation");
const price = details.querySelector("#details-price");
const sizeText = details.querySelector("#details-size");
const detailButtons = [...details.querySelectorAll(".details-buttons button")];
let request = 0;
const loadImage = src => new Promise(done => {
  const img = new Image();
  img.onload = () => done(true);
  img.onerror = () => done(false);
  img.src = src;
});
async function showDetails(size) {
  const studio = sizes[size], photoSrc = `images/home/macro/${studio.photo}.webp`;
  const foliageSrc = `images/home/${studio.photo}-veg.png`, id = ++request;
  price.textContent = money(CONFIG.studios[size].price);
  sizeText.textContent = `${CONFIG.studios[size].sqft} sq ft. ${studio.text}`;
  detailButtons.forEach(button => {
    const on = button.dataset.studio === String(size);
    button.classList.toggle("active", on);
    button.setAttribute("aria-pressed", on);
  });
  if (photo.getAttribute("src") === photoSrc) return;
  const [photoOK, foliageOK] = await Promise.all([loadImage(photoSrc), loadImage(foliageSrc)]);
  if (id !== request) return;
  details.classList.add("is-fading");
  await new Promise(done => setTimeout(done, 300));
  if (id !== request) return;
  if (photoOK) photo.src = photoSrc;
  if (foliageOK) foliage.src = foliageSrc;
  photo.alt = `Studio ${size}`;
  details.classList.remove("is-fading");
}
detailButtons.forEach(button => button.addEventListener("click", () => showDetails(button.dataset.studio)));
document.querySelectorAll(".studio-explore-link").forEach(link =>
  link.addEventListener("click", () => showDetails(link.dataset.size))
);
showDetails(90);

/* HOTSPOTS */
details.querySelectorAll(".hotspot").forEach(button => button.addEventListener("click", () => {
  const open = button.getAttribute("aria-expanded") !== "true";
  details.querySelectorAll(".hotspot").forEach(other => other.setAttribute("aria-expanded", "false"));
  button.setAttribute("aria-expanded", open);
}));

/* SHARED IMAGE PARALLAX */
const depthSections = [...document.querySelectorAll(".depth")];
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const visibleSections = new Set();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) visibleSections.add(entry.target);
      else visibleSections.delete(entry.target);
    });
  }, { rootMargin: "100px 0px" });
  depthSections.forEach(section => observer.observe(section));
  let waiting = false;
  function updateDepth() {
    visibleSections.forEach(section => {
      const box = section.getBoundingClientRect();
      section.style.setProperty("--p", Math.max(-1, Math.min(1,
        (box.top + box.height / 2 - innerHeight / 2) / innerHeight
      )).toFixed(3));
    });
    waiting = false;
  }
  addEventListener("scroll", () => {
    if (!waiting) {
      waiting = true;
      requestAnimationFrame(updateDepth);
    }
  }, { passive: true });
  addEventListener("resize", updateDepth);
  updateDepth();
}
