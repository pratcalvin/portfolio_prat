const root = document.documentElement;

// localStorage peut être bloqué (navigation privée, cookies désactivés)
const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { } }
};


/* ---------- Langue ----------
   Le texte français est dans le HTML ; la traduction anglaise est dans
   data-en (contenu) ou data-en-<attribut> (placeholder, aria-label, alt...). */

const TRANSLATED_ATTRS = ["placeholder", "aria-label", "alt", "content"];
let lang = "fr";
const t = (fr, en) => (lang === "en" ? en : fr);

function applyLang(next) {
    lang = next;
    root.lang = next;

    document.querySelectorAll("[data-en]").forEach(el => {
        if (el.dataset.fr === undefined) el.dataset.fr = el.innerHTML;
        el.innerHTML = next === "en" ? el.dataset.en : el.dataset.fr;
    });

    TRANSLATED_ATTRS.forEach(attr => {
        document.querySelectorAll(`[data-en-${attr}]`).forEach(el => {
            const frAttr = `data-fr-${attr}`;
            if (!el.hasAttribute(frAttr)) el.setAttribute(frAttr, el.getAttribute(attr) || "");
            el.setAttribute(attr, el.getAttribute(next === "en" ? `data-en-${attr}` : frAttr));
        });
    });

    langBtn.lang = next === "en" ? "fr" : "en";
    updateThemeLabel();
    store.set("lang", next);
}

const langBtn = document.getElementById("lang-toggle");
langBtn.addEventListener("click", () => applyLang(lang === "fr" ? "en" : "fr"));


/* ---------- Thème ---------- */

const themeBtn = document.getElementById("theme-toggle");
const isLight = () => root.dataset.theme === "light";

function updateThemeLabel() {
    themeBtn.setAttribute("aria-label", isLight()
        ? t("Activer le thème sombre", "Switch to dark theme")
        : t("Activer le thème clair", "Switch to light theme"));
}

themeBtn.addEventListener("click", () => {
    if (isLight()) delete root.dataset.theme;
    else root.dataset.theme = "light";
    store.set("theme", isLight() ? "light" : "dark");
    updateThemeLabel();
});


/* ---------- Navigation ---------- */

const navbar = document.querySelector(".navbar");
const burger = document.querySelector(".nav-burger");
const navLinks = document.querySelectorAll(".nav-links a");

function setMenu(open) {
    navbar.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
}

burger.addEventListener("click", () => setMenu(!navbar.classList.contains("is-open")));
navLinks.forEach(a => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("click", e => { if (!navbar.contains(e.target)) setMenu(false); });
document.addEventListener("keydown", e => {
    if (e.key === "Escape" && navbar.classList.contains("is-open")) {
        setMenu(false);
        burger.focus();
    }
});

// Au passage desktop ↔ mobile : referme le menu sans animer son apparition/disparition
const mobileNav = window.matchMedia("(max-width: 960px)");
mobileNav.addEventListener("change", () => {
    navbar.classList.add("no-anim");
    setMenu(false);
    requestAnimationFrame(() => requestAnimationFrame(() => navbar.classList.remove("no-anim")));
});

const onScroll =() => navbar.classList.toggle("is-scrolled", window.scrollY > 10);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Surligne le lien de la section visible au centre de l'écran
const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(a => {
            const current = a.hash === "#" + entry.target.id;
            a.classList.toggle("active", current);
            if (current) a.setAttribute("aria-current", "true");
            else a.removeAttribute("aria-current");
        });
    });
}, { rootMargin: "-45% 0px -50% 0px" });
document.querySelectorAll("main section[id]").forEach(section => spy.observe(section));


/* ---------- Apparition au scroll ---------- */

const revealer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
    });
}, { threshold: 0.1 });

document.querySelectorAll(".project, .project-coming, .skillcard, .about-text p, .timeline li").forEach(el => {
    el.classList.add("reveal");
    revealer.observe(el);
});


/* ---------- Modèle 3D : chargé seulement à la demande ---------- */

document.getElementById("sketch-load").addEventListener("click", () => {
    const iframe = document.createElement("iframe");
    iframe.title = t("Modèle 3D interactif réalisé sous Blender", "Interactive 3D model made with Blender");
    iframe.src = "https://sketchfab.com/models/d87344b70f38430fbfbac42477e3aadb/embed?autostart=1&ui_theme=dark";
    iframe.allow = "autoplay; fullscreen; xr-spatial-tracking";
    iframe.allowFullscreen = true;
    document.getElementById("sketch-frame").replaceChildren(iframe);
    iframe.focus(); // le bouton a disparu : on garde le focus clavier au même endroit
});


/* ---------- Formulaire de contact (ouvre la messagerie du visiteur) ---------- */

document.getElementById("contact-form").addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("fname").value.trim();
    const email = document.getElementById("femail").value.trim();
    const message = document.getElementById("fmsg").value.trim();

    const subject = t("Contact portfolio — ", "Portfolio contact — ") + name;
    const body = `${message}\n\n— ${name} (${email})`;
    window.location.href = `mailto:calvin.prat@icloud.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    document.getElementById("form-status").hidden = false;
});


/* ---------- Initialisation ---------- */

document.getElementById("year").textContent = new Date().getFullYear();
if (store.get("lang") === "en") applyLang("en");
else updateThemeLabel();
