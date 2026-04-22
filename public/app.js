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
const previewImageEl = document.getElementById("previewImage");
const previewTitleEl = document.getElementById("previewTitle");
const previewDescriptionEl = document.getElementById("previewDescription");
const previewPriceEl = document.getElementById("previewPrice");
const previewAddBtn = document.getElementById("previewAddBtn");

let products = [];
let cart = [];

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

async function fetchProducts() {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Impossible de charger les produits");
  return await res.json();
}

async function fetchConfig() {
  const res = await fetch("/api/config");
  if (!res.ok) return null;
  return await res.json();
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
  const customer = {
    name: formData.get("name"),
    phone: formData.get("phone"),
    city: formData.get("city"),
    address: formData.get("address"),
    notes: formData.get("notes")
  };

  const items = cart.map((it) => ({
    productId: it.productId,
    quantity: it.quantity,
    size: it.size || ""
  }));

  submitBtn.disabled = true;
  setStatus("Préparation de votre commande…", "info");

  try {
    const res = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer,
        items,
        payment: { method: "Airtel Money / Moov Money", afterConfirmation: true }
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Erreur lors de la création de la commande");

    setStatus("Ouverture de WhatsApp…", "info");
    window.location.href = data.waUrl;
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
