const productsEl = document.getElementById("products");
const cartEl = document.getElementById("cart");
const orderForm = document.getElementById("orderForm");
const itemsJsonEl = document.getElementById("itemsJson");
const searchEl = document.getElementById("search");
const clearBtn = document.getElementById("clearBtn");
const submitBtn = document.getElementById("submitBtn");
const statusEl = document.getElementById("status");
const shopNameDisplay = document.getElementById("shopNameDisplay");
const productPreviewEl = document.getElementById("productPreview");
const phoneInputEl = orderForm?.querySelector('input[name="phone"]');
const cityInputEl = orderForm?.querySelector('input[name="city"]');
const addressInputEl = orderForm?.querySelector('input[name="address"]');
const notesInputEl = orderForm?.querySelector('textarea[name="notes"]');
const previewImageEl = document.getElementById("previewImage");
const previewTitleEl = document.getElementById("previewTitle");
const previewDescriptionEl = document.getElementById("previewDescription");
const previewPriceEl = document.getElementById("previewPrice");
const previewAddBtn = document.getElementById("previewAddBtn");

let products = [];
let cart = [];
let siteConfig = {};

function makeFieldFullyFreeText(field) {
  if (!field) return;
  field.removeAttribute("pattern");
  field.removeAttribute("minlength");
  field.removeAttribute("maxlength");
  field.removeAttribute("title");
  field.setCustomValidity("");
}

if (phoneInputEl) {
  // Accept any phone format (+, spaces, local style, etc.).
  phoneInputEl.setAttribute("type", "text");
  makeFieldFullyFreeText(phoneInputEl);
}

if (cityInputEl) {
  makeFieldFullyFreeText(cityInputEl);
}

if (addressInputEl) {
  addressInputEl.setAttribute("type", "text");
  makeFieldFullyFreeText(addressInputEl);
}

if (notesInputEl) {
  makeFieldFullyFreeText(notesInputEl);
}

function formatAmount(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  return new Intl.NumberFormat("fr-FR").format(n);
}

function priceLabel(p) {
  const sym = p.currencySymbol || "";
  return `${formatAmount(p.price)} ${sym}`.trim();
}

function cartCurrencySymbol() {
  for (const it of cart) {
    const p = products.find((x) => String(x.id) === String(it.productId));
    if (p?.currencySymbol) return p.currencySymbol;
  }
  return "";
}

function cartTotal() {
  let total = 0;
  for (const it of cart) {
    const p = products.find((x) => String(x.id) === String(it.productId));
    if (!p) continue;
    total += (p.price || 0) * (it.quantity || 1);
  }
  return total;
}

function setStatus(msg, variant = "info") {
  statusEl.textContent = msg;
  statusEl.classList.remove("status--error", "status--ok");
  if (variant === "error") statusEl.classList.add("status--error");
  if (variant === "ok") statusEl.classList.add("status--ok");
}

function openPreview(product) {
  if (!product || !productPreviewEl) return;
  const fallbackImage = `https://via.placeholder.com/900x600/f1f5f9/64748b?text=${encodeURIComponent(product.name || "Produit")}`;
  previewImageEl.src = product.imageUrl || fallbackImage;
  previewImageEl.alt = product.name || "Produit";
  previewTitleEl.textContent = product.name || "Produit";
  previewDescriptionEl.textContent = product.description || "";
  previewPriceEl.textContent = priceLabel(product);
  previewAddBtn.dataset.productId = String(product.id);
  productPreviewEl.hidden = false;
  document.body.style.overflow = "hidden";
}

function closePreview() {
  if (!productPreviewEl) return;
  productPreviewEl.hidden = true;
  document.body.style.overflow = "";
}

function renderCart() {
  if (!cart.length) {
    cartEl.innerHTML =
      '<p class="muted cart__empty">Votre panier est vide. Ajoutez des articles depuis le catalogue.</p>';
    submitBtn.disabled = true;
    return;
  }

  const total = cartTotal();
  const sym = cartCurrencySymbol();
  const lines = cart.map((it) => {
    const p = products.find((x) => String(x.id) === String(it.productId));
    if (!p) return "";
    const hasSizes = Array.isArray(p.sizes) && p.sizes.length > 0;
    const sizeSelect = hasSizes
      ? `
        <label class="field" style="margin-top:6px; width:min(160px, 100%);">
          <span class="field__label">Taille / pointure</span>
          <select data-role="size" data-product-id="${p.id}" class="input">
            ${p.sizes.map((s) => `<option value="${s}" ${String(it.size || "") === String(s) ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </label>
      `
      : "";

    return `
      <div class="cartLine">
        <div class="cartLine__left">
          <div class="cartLine__name">${escapeHtml(p.name)}</div>
          <div class="cartLine__meta">Prix unitaire : ${priceLabel(p)}</div>
          <div style="display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap;">
            <label class="field" style="width:min(120px, 100%);">
              <span class="field__label">Quantité</span>
              <input
                class="input"
                type="number"
                min="1"
                step="1"
                data-role="qty"
                data-product-id="${p.id}"
                value="${it.quantity}"
              />
            </label>
            ${sizeSelect}
          </div>
        </div>
        <div class="cartLine__right">
          <div class="cartLine__price">${formatAmount((p.price || 0) * (it.quantity || 1))} ${sym}</div>
          <button class="cartLine__remove" type="button" data-role="remove" data-product-id="${p.id}">
            Retirer
          </button>
        </div>
      </div>
    `;
  }).join("");

  cartEl.innerHTML = `
    ${lines}
    <div class="cart-total">
      <span class="cart-total__label">Total estimé</span>
      <span class="cart-total__value">${formatAmount(total)} ${sym}</span>
    </div>
  `;

  submitBtn.disabled = false;
  bindCartLineEvents();
  updateItemsJson();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function updateItemsJson() {
  itemsJsonEl.value = JSON.stringify(cart);
}

function addToCart(product) {
  const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
  const size = hasSizes ? product.sizes[0] : "";

  const existing = cart.find(
    (x) => String(x.productId) === String(product.id) && String(x.size || "") === String(size || "")
  );
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    cart.push({
      productId: product.id,
      quantity: 1,
      size
    });
  }
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter((x) => String(x.productId) !== String(productId));
  renderCart();
}

function bindCartLineEvents() {
  cartEl.querySelectorAll('input[data-role="qty"]').forEach((el) => {
    el.addEventListener("change", () => {
      const productId = el.getAttribute("data-product-id");
      const qty = Math.max(1, Number(el.value || 1));
      for (const it of cart) {
        if (String(it.productId) === String(productId)) it.quantity = qty;
      }
      renderCart();
    });
  });

  cartEl.querySelectorAll('select[data-role="size"]').forEach((el) => {
    el.addEventListener("change", () => {
      const productId = el.getAttribute("data-product-id");
      const size = el.value || "";
      const target = cart.find((x) => String(x.productId) === String(productId));
      if (!target) return;
      target.size = size;
      renderCart();
    });
  });

  cartEl.querySelectorAll('button[data-role="remove"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const productId = btn.getAttribute("data-product-id");
      removeFromCart(productId);
    });
  });
}

function renderProducts(list) {
  if (!list.length) {
    productsEl.innerHTML = '<p class="empty">Aucun produit ne correspond à votre recherche.</p>';
    return;
  }

  productsEl.innerHTML = list
    .map((p) => {
      const sizesBadge =
        Array.isArray(p.sizes) && p.sizes.length > 0 ? "Variantes disponibles" : "Sans variante";
      const fallback = `https://via.placeholder.com/600x450/f1f5f9/64748b?text=${encodeURIComponent(p.name)}`;
      const img = p.imageUrl || fallback;
      return `
        <article class="product" role="listitem">
          <div class="product__img">
            <button class="product__previewBtn" type="button" data-role="preview" data-product-id="${p.id}" aria-label="Agrandir : ${escapeHtml(p.name)}">
              <img
                src="${img}"
                alt="${escapeHtml(p.name)}"
                loading="lazy"
                onerror="this.onerror=null;this.src='${fallback}'"
              />
            </button>
          </div>
          <div class="product__body">
            <div class="product__title">${escapeHtml(p.name)}</div>
            <div class="product__desc">${escapeHtml(p.description || "")}</div>
            <div class="product__meta">
              <div>
                <div class="product__price">${priceLabel(p)}</div>
                <span class="badge" style="margin-top:6px; display:inline-block;">${sizesBadge}</span>
              </div>
              <button class="btn btn--primary" type="button" data-role="add" data-product-id="${p.id}">
                Ajouter
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  productsEl.querySelectorAll("button[data-role='add']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const productId = btn.getAttribute("data-product-id");
      const p = products.find((x) => String(x.id) === String(productId));
      if (!p) return;
      addToCart(p);
      setStatus("Article ajouté au panier.", "ok");
    });
  });

  productsEl.querySelectorAll("button[data-role='preview']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const productId = btn.getAttribute("data-product-id");
      const p = products.find((x) => String(x.id) === String(productId));
      if (!p) return;
      openPreview(p);
    });
  });
}

/**
 * Lecture JSON tolérante pour les fichiers statiques (site.json, etc.) : ne lance jamais.
 * @returns {object|null}
 */
async function tryFetchJsonObject(url, labelForLog = url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    const raw = await res.text();
    const trimmed = raw.trim();

    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn(`[${labelForLog}] HTTP ${res.status} — ${url}`);
      return null;
    }
    if (!trimmed) {
      // eslint-disable-next-line no-console
      console.warn(`[${labelForLog}] corps vide — ${url}`);
      return null;
    }
    if (trimmed.startsWith("<") || /not found|the page could not be found/i.test(trimmed)) {
      // eslint-disable-next-line no-console
      console.warn(
        `[${labelForLog}] réponse HTML au lieu de JSON (souvent rewrite SPA vers index.html) — ${url}`
      );
      return null;
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    } catch (e) {
      const preview = trimmed.slice(0, 120).replace(/\s+/g, " ");
      // eslint-disable-next-line no-console
      console.warn(
        `[${labelForLog}] JSON.parse impossible — ${url} — ${e?.message || "erreur"} — aperçu : ${preview}${trimmed.length > 120 ? "…" : ""}`
      );
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[${labelForLog}] fetch impossible — ${url}`, e);
  }
  return null;
}

async function parseJsonResponse(res, { label = "réponse", notOkMessage, requireOk = true } = {}) {
  const contentType = String(res.headers.get("content-type") || "").toLowerCase();
  const raw = await res.text();
  const trimmed = raw.trim();

  if (!trimmed) {
    throw new Error(
      `${label} : réponse vide (HTTP ${res.status}). ` +
        "Sur Vercel sans API, vérifiez que /api/order existe ou utilisez le mode WhatsApp côté client (data/site.json)."
    );
  }

  if (requireOk && !res.ok) {
    const hint =
      trimmed.startsWith("<") || /not found|the page/i.test(trimmed)
        ? ` (${label} : page HTML reçue au lieu de JSON — vérifiez l’URL ou le déploiement.)`
        : "";
    throw new Error(`${notOkMessage || `Erreur HTTP ${res.status}`}${hint}`);
  }

  if (trimmed.startsWith("<")) {
    throw new Error(
      `${label} : le serveur a renvoyé du HTML (souvent une 404 ou une SPA). ` +
        "Vérifiez que public/data/products.json est bien déployé et que /data/products.json n’est pas redirigé vers index.html."
    );
  }

  if (contentType && !contentType.includes("json") && !trimmed.startsWith("[")) {
    // eslint-disable-next-line no-console
    console.warn(`[${label}] Content-Type inattendu:`, contentType);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    const preview =
      trimmed.length > 0
        ? `${trimmed.slice(0, 100).replace(/\s+/g, " ")}${trimmed.length > 100 ? "…" : ""}`
        : `(corps vide après trim, ${raw.length} caractères bruts)`;
    throw new Error(
      `${label} : ce n’est pas du JSON valide (HTTP ${res.status}). ` +
        `Début de réponse : « ${preview} ». ` +
        `Erreur parse : ${e?.message || "inconnue"}.`
    );
  }

  return parsed;
}

async function fetchProducts() {
  const url = "/data/products.json";
  const res = await fetch(url, { cache: "no-store" });
  const data = await parseJsonResponse(res, {
    label: "Catalogue",
    notOkMessage: `Impossible de charger ${url} (${res.status})`
  });
  if (!Array.isArray(data)) {
    throw new Error("Catalogue : le fichier JSON doit être un tableau de produits.");
  }
  return data;
}

async function fetchConfig() {
  const merged = {};
  const site = await tryFetchJsonObject("/data/site.json", "data/site.json");
  if (site) Object.assign(merged, site);
  const api = await tryFetchJsonObject("/api/config", "api/config");
  if (api) Object.assign(merged, api);
  siteConfig = merged;
  return Object.keys(merged).length ? merged : null;
}

function toWaDigits(input) {
  return String(input || "").replace(/[^\d]/g, "");
}

function buildWhatsAppOrderText({
  shopName,
  defaultCurrency,
  orderId,
  customer,
  items,
  payment
}) {
  const lines = [];
  lines.push(`Bonjour, je viens de passer une commande sur ${shopName}.`);
  lines.push(`Commande ID: ${orderId}`);
  lines.push("");

  lines.push("Client:");
  lines.push(`- Nom: ${customer.name || "-"}`);
  lines.push(`- Téléphone: ${customer.phone || "-"}`);
  lines.push(`- Ville: ${customer.city || "-"}`);
  if (customer.address) lines.push(`- Adresse: ${customer.address}`);
  if (customer.notes) lines.push(`- Notes: ${customer.notes}`);
  lines.push("");

  lines.push("Articles:");
  let total = 0;
  for (const it of items) {
    const qty = Number.isFinite(it.quantity) && it.quantity > 0 ? it.quantity : 1;
    const unitPrice = Number.isFinite(it.unitPrice) ? it.unitPrice : 0;
    const productName = it.productName || it.productId || "Article";
    const cur = it.currencySymbol || defaultCurrency || "XAF";
    const sizePart = it.size ? ` (${it.size})` : "";
    lines.push(`- ${productName}${sizePart} x${qty} = ${unitPrice * qty} ${cur}`);
    total += unitPrice * qty;
  }

  lines.push("");
  lines.push(`Total: ${total} ${defaultCurrency || "XAF"}`);
  lines.push("");

  if (payment?.afterConfirmation !== false) {
    lines.push("Paiement:");
    lines.push(`- Méthode: ${payment?.method || "Airtel Money / Moov Money"}`);
    lines.push("- Paiement après confirmation (je te réponds avec le numéro Airtel Money et le montant).");
  } else {
    lines.push("Paiement:");
    lines.push(`- Méthode: ${payment?.method || "-"}`);
  }

  return lines.join("\n");
}

function buildWhatsAppUrlFromOrder({
  whatsappSeller,
  shopName,
  defaultCurrency,
  customer,
  items,
  payment
}) {
  const digits = toWaDigits(whatsappSeller);
  if (!digits) {
    throw new Error(
      "Numéro vendeur WhatsApp manquant. Ajoutez « whatsappSeller » dans public/data/site.json (chiffres, ex. 24104012017)."
    );
  }
  const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const text = buildWhatsAppOrderText({
    shopName: shopName || "Boutique",
    defaultCurrency: defaultCurrency || "XAF",
    orderId,
    customer,
    items,
    payment
  });
  return { waUrl: `https://wa.me/${digits}?text=${encodeURIComponent(text)}`, orderId };
}

function filterProducts(query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return products;
  return products.filter((p) => {
    return (
      String(p.name || "").toLowerCase().includes(q) ||
      String(p.description || "").toLowerCase().includes(q)
    );
  });
}

clearBtn.addEventListener("click", () => {
  cart = [];
  renderCart();
  setStatus("Panier vidé.", "info");
});

searchEl.addEventListener("input", () => {
  renderProducts(filterProducts(searchEl.value));
});

document.querySelectorAll('[data-role="preview-close"]').forEach((el) => {
  el.addEventListener("click", closePreview);
});

previewAddBtn.addEventListener("click", () => {
  const id = previewAddBtn.dataset.productId;
  const p = products.find((x) => String(x.id) === String(id));
  if (!p) return;
  addToCart(p);
  closePreview();
  setStatus("Article ajouté au panier.", "ok");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && productPreviewEl && !productPreviewEl.hidden) {
    closePreview();
  }
});

orderForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!cart.length) return;

  const formData = new FormData(orderForm);
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  // Keep validation intentionally permissive for free-text fields like city/address.
  const customer = {
    name,
    phone,
    city,
    address,
    notes
  };

  const items = cart
    .map((it) => {
      const p = products.find((x) => String(x.id) === String(it.productId));
      if (!p) return null;
      return {
        productId: it.productId,
        productName: p.name,
        unitPrice: Number(p.price || 0),
        currencySymbol: p.currencySymbol || "",
        quantity: it.quantity,
        size: it.size || ""
      };
    })
    .filter(Boolean);

  submitBtn.disabled = true;
  setStatus("Préparation de votre commande…", "info");

  const payment = { method: "Airtel Money / Moov Money", afterConfirmation: true };

  try {
    await fetchConfig();

    let openedFromServer = false;
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          items,
          payment
        })
      });
      const raw = await res.text();
      const trimmed = raw.trim();
      const ct = String(res.headers.get("content-type") || "").toLowerCase();
      const looksLikeJson =
        trimmed.startsWith("{") &&
        (ct.includes("json") || !trimmed.startsWith("<"));

      if (looksLikeJson) {
        let data;
        try {
          data = JSON.parse(raw);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn("[commande] /api/order : corps non JSON", e?.message, trimmed.slice(0, 120));
          data = null;
        }
        if (data && res.ok && String(data.waUrl || "").trim()) {
          setStatus("Ouverture de WhatsApp…", "info");
          window.location.assign(String(data.waUrl).trim());
          openedFromServer = true;
        } else if (data && !res.ok && data.error) {
          throw new Error(data.error);
        }
      } else if (trimmed) {
        // eslint-disable-next-line no-console
        console.warn(
          "[commande] /api/order ignoré (pas de JSON, souvent déploiement statique Vercel).",
          "HTTP",
          res.status,
          trimmed.slice(0, 80)
        );
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[commande] /api/order indisponible, utilisation du mode client.", e);
    }

    if (!openedFromServer) {
      const seller =
        siteConfig?.whatsappSeller ||
        siteConfig?.whatsapp ||
        siteConfig?.WHATSAPP_SELLER_NUMBER ||
        "";
      if (!toWaDigits(seller)) {
        throw new Error(
          "Impossible d’ouvrir WhatsApp : numéro vendeur introuvable. " +
            "Vérifiez que le fichier /data/site.json est bien servi (pas remplacé par index.html) " +
            "et qu’il contient « whatsappSeller » (ex. \"+24104012017\")."
        );
      }
      const { waUrl } = buildWhatsAppUrlFromOrder({
        whatsappSeller: seller,
        shopName: siteConfig?.shopName || shopNameDisplay?.textContent || "Boutique",
        defaultCurrency: siteConfig?.currency || "XAF",
        customer,
        items,
        payment
      });
      setStatus("Ouverture de WhatsApp…", "info");
      window.location.assign(waUrl);
    }
  } catch (err) {
    submitBtn.disabled = false;
    setStatus(err?.message || "Erreur", "error");
  }
});

renderCart();

(async () => {
  try {
    const cfg = await fetchConfig();
    if (cfg?.shopName && shopNameDisplay) {
      shopNameDisplay.textContent = cfg.shopName;
      document.title = `${cfg.shopName} — Commande WhatsApp`;
    }
  } catch {
    /* ignore */
  }

  try {
    products = await fetchProducts();
    renderProducts(products);
  } catch (err) {
    productsEl.innerHTML = `<p class="empty">Erreur : ${escapeHtml(err?.message || "chargement impossible")}</p>`;
  }
})();
