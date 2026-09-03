(function () {
  "use strict";

  const WHATSAPP_NUMBER = "24100000000";

  const $ = (sel) => document.querySelector(sel);

  function initYear() {
    const el = $("#year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    els.forEach((el) => observer.observe(el));
  }

  function initMobileNav() {
    const btn = $("#menuBtn");
    const nav = $("#mobileNav");
    if (!btn || !nav) return;

    btn.addEventListener("click", () => {
      const open = nav.hidden;
      nav.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.hidden = true;
        btn.setAttribute("aria-expanded", "false");
      });
    });
  }

  function initContactForm() {
    const form = $("#contactForm");
    if (!form) return;

    const dealLabels = {
      vente: "Vente / closing client",
      partenariat: "Partenariat B2B",
      achat: "Achat / fournisseur",
      investissement: "Investissement / levée",
      autre: "Autre"
    };

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const phone = String(data.get("phone") || "").trim();
      const deal = String(data.get("deal") || "");
      const message = String(data.get("message") || "").trim();
      const dealLabel = dealLabels[deal] || deal;

      const lines = [
        "Bonjour, je souhaite travailler sur un deal.",
        "",
        `Nom : ${name}`,
        `WhatsApp : ${phone}`,
        `Type : ${dealLabel}`
      ];
      if (message) {
        lines.push("", "Contexte :", message);
      }
      lines.push("", "— Envoyé depuis L'Art du Deal");

      const url = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${encodeURIComponent(lines.join("\n"))}`;
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  initYear();
  initReveal();
  initMobileNav();
  initContactForm();
})();
