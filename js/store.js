/* =========================================================
   VITRINE-ESPORTE — STORE.JS
   Catálogo, filtros, sacola, personalizador, checkout WhatsApp,
   SEO (meta + JSON-LD) e utilidades de UI. Zero dependências.
   Espera data/config.json e data/produtos.json no mesmo domínio.
   ========================================================= */

const Store = (() => {
  let CONFIG = null;
  let PRODUCTS = [];
  let cart = JSON.parse(localStorage.getItem("vitrine_cart") || "[]");

  /* ---------------- utils ---------------- */
  function currency(v) {
    return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  function saveCart() { localStorage.setItem("vitrine_cart", JSON.stringify(cart)); }
  function precoFinal(p) { return p.precoPromo != null ? p.precoPromo : p.preco; }
  function findProduct(sku) { return PRODUCTS.find(p => p.sku === sku); }
  function findBySlug(slug) { return PRODUCTS.find(p => p.slug === slug); }
  function qs(name) { return new URLSearchParams(location.search).get(name); }
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  const CATEGORY_LABELS = {
    futebol: "Futebol", futsal: "Futsal", society: "Society",
    jiujitsu: "Jiu-Jitsu", acessorios: "Acessórios",
  };

  /* ícone-rascunho genérico usado quando a foto do produto não existe */
  function placeholderSvg() {
    return `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="24" cy="24" r="18"/><path d="M24 12l7 5-3 8h-8l-3-8zM24 30v6M17 25l-9-1M31 25l9-1"/>
    </svg>`;
  }
  function mediaMarkup(imagens) {
    const src = imagens && imagens[0];
    return `${src ? `<img src="${src}" alt="" loading="lazy" onerror="this.style.display='none'">` : ""}${placeholderSvg()}`;
  }

  /* ---------------- carga de dados ---------------- */
  async function loadData() {
    const [cfgRes, prodRes] = await Promise.all([
      fetch("data/config.json"),
      fetch("data/produtos.json"),
    ]);
    CONFIG = await cfgRes.json();
    PRODUCTS = await prodRes.json();
    applyBranding();
    return { CONFIG, PRODUCTS };
  }

  function applyBranding() {
    if (CONFIG.corDestaque) {
      document.documentElement.style.setProperty("--accent", CONFIG.corDestaque);
    }
    document.querySelectorAll("[data-store-name]").forEach(el => el.textContent = CONFIG.nome);
    document.querySelectorAll("[data-store-tagline]").forEach(el => el.textContent = CONFIG.tagline);
    document.querySelectorAll("[data-store-cidade]").forEach(el => el.textContent = CONFIG.cidade);
    document.querySelectorAll("[data-store-logo]").forEach(el => el.src = CONFIG.logo);

    const waGeneric = waLink(CONFIG.greeting);
    document.querySelectorAll("[data-wa-link]").forEach(el => el.href = waGeneric);
    document.querySelectorAll("[data-ig-link]").forEach(el => el.href = CONFIG.instagram);

    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    injectLocalBusinessSchema();
  }

  function waLink(message) {
    return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;
  }

  /* ---------------- SEO ---------------- */
  function setMeta(name, content, attr = "name") {
    if (!content) return;
    let el = document.querySelector(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }
  function injectJsonLd(id, data) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
  }
  function injectLocalBusinessSchema() {
    injectJsonLd("ld-localbusiness", {
      "@context": "https://schema.org",
      "@type": "SportingGoodsStore",
      "name": CONFIG.nome,
      "description": CONFIG.descricao,
      "address": { "@type": "PostalAddress", "addressLocality": CONFIG.cidade },
      "telephone": `+${CONFIG.whatsapp}`,
      "sameAs": [CONFIG.instagram].filter(Boolean),
    });
  }
  function setPageSeo({ title, description, image }) {
    document.title = title;
    setMeta("description", description);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:type", "website", "property");
    if (image) setMeta("og:image", image, "property");
  }
  function setProductSeo(p) {
    const img = p.imagens && p.imagens[0];
    setPageSeo({
      title: `${p.nome} | ${CONFIG.nome}`,
      description: p.descricao,
      image: img,
    });
    injectJsonLd("ld-product", {
      "@context": "https://schema.org",
      "@type": "Product",
      "sku": p.sku,
      "name": p.nome,
      "description": p.descricao,
      "image": img ? [img] : [],
      "offers": {
        "@type": "Offer",
        "priceCurrency": "BRL",
        "price": precoFinal(p).toFixed(2),
        "availability": "https://schema.org/InStock",
      },
    });
  }

  /* ---------------- catálogo / render ---------------- */
  function productCardHtml(p) {
    const promo = p.precoPromo != null;
    return `
      <div class="product-card" data-sku="${p.sku}">
        ${promo ? `<span class="product-badge">OFERTA</span>` : ""}
        <a class="product-link" href="produto.html?p=${encodeURIComponent(p.slug)}">
          <div class="product-image">${mediaMarkup(p.imagens)}</div>
          <div class="product-info">
            <span class="product-cat">${CATEGORY_LABELS[p.categoria] || p.categoria}</span>
            <span class="product-name">${escapeHtml(p.nome)}</span>
            <div class="product-price-row">
              ${promo ? `<div class="product-price-old">${currency(p.preco)}</div>` : ""}
              <div class="product-price">${currency(precoFinal(p))}</div>
            </div>
          </div>
        </a>
      </div>`;
  }

  function renderGrid(elId, list) {
    const grid = document.getElementById(elId);
    if (!grid) return;
    if (!list.length) {
      grid.innerHTML = `<p class="filters-empty">Nenhum produto encontrado.</p>`;
      return;
    }
    grid.innerHTML = list.map(productCardHtml).join("");
  }

  /* ---------------- coleção: filtros ---------------- */
  function initCollection() {
    if (document.body.dataset.page !== "colecao") return;
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    const chipsEl = document.getElementById("categoryChips");
    const searchEl = document.getElementById("searchInput");
    const categorias = [...new Set(PRODUCTS.map(p => p.categoria))];

    let activeCategory = qs("categoria") || "todos";

    function chipHtml(value, label) {
      return `<button class="filter-chip" data-value="${value}" aria-pressed="${activeCategory === value}">${label}</button>`;
    }
    if (chipsEl) {
      chipsEl.innerHTML = [chipHtml("todos", "Todos")]
        .concat(categorias.map(c => chipHtml(c, CATEGORY_LABELS[c] || c)))
        .join("");
      chipsEl.querySelectorAll(".filter-chip").forEach(btn => {
        btn.addEventListener("click", () => {
          activeCategory = btn.dataset.value;
          chipsEl.querySelectorAll(".filter-chip").forEach(b => b.setAttribute("aria-pressed", String(b === btn)));
          applyFilters();
        });
      });
    }

    function applyFilters() {
      const term = (searchEl?.value || "").trim().toLowerCase();
      const list = PRODUCTS.filter(p => {
        const matchCat = activeCategory === "todos" || p.categoria === activeCategory;
        const matchTerm = !term || p.nome.toLowerCase().includes(term);
        return matchCat && matchTerm;
      });
      renderGrid("productsGrid", list);
    }

    searchEl?.addEventListener("input", applyFilters);
    applyFilters();
  }

  function initHome() {
    const grid = document.getElementById("productsGrid");
    if (!grid || document.body.dataset.page !== "home") return;
    renderGrid("productsGrid", PRODUCTS.filter(p => p.destaque));
  }

  /* ---------------- PDP ---------------- */
  function initPdp() {
    const root = document.getElementById("pdpRoot");
    if (!root) return;

    const slug = qs("p");
    const p = findBySlug(slug) || PRODUCTS[0];
    if (!p) { root.innerHTML = `<p class="filters-empty">Produto não encontrado.</p>`; return; }

    setProductSeo(p);

    let currentImage = 0;
    let selectedSize = null;
    let qty = 1;

    const mainImageEl = document.getElementById("pdpMainImage");
    const thumbsEl = document.getElementById("pdpThumbs");
    const sizeGridEl = document.getElementById("pdpSizeGrid");
    const personalizeEl = document.getElementById("pdpPersonalize");
    const qtyValueEl = document.getElementById("pdpQtyValue");
    const addBtn = document.getElementById("pdpAddBtn");
    const buyBtn = document.getElementById("pdpBuyBtn");
    const sizeError = document.getElementById("pdpSizeError");

    document.getElementById("pdpCat").textContent = CATEGORY_LABELS[p.categoria] || p.categoria;
    document.getElementById("pdpTitle").textContent = p.nome;
    document.getElementById("pdpSku").textContent = `SKU: ${p.sku}`;
    document.getElementById("pdpDesc").textContent = p.descricao;
    const oldPriceEl = document.getElementById("pdpPriceOld");
    if (p.precoPromo != null) {
      oldPriceEl.textContent = currency(p.preco);
      oldPriceEl.style.display = "";
    } else {
      oldPriceEl.style.display = "none";
    }
    document.getElementById("pdpPrice").textContent = currency(precoFinal(p));

    function renderGallery() {
      const imgs = p.imagens && p.imagens.length ? p.imagens : [null];
      const src = imgs[currentImage];
      mainImageEl.innerHTML = src
        ? `<img src="${src}" alt="${escapeHtml(p.nome)}" onerror="this.style.display='none'">`
        : placeholderSvg();
      thumbsEl.innerHTML = imgs.map((img, i) => `
        <button class="pdp-thumb" data-i="${i}" aria-current="${i === currentImage}" aria-label="Ver imagem ${i + 1} de ${p.nome}">
          ${img ? `<img src="${img}" alt="" onerror="this.style.display='none'">` : ""}
        </button>`).join("");
      thumbsEl.querySelectorAll(".pdp-thumb").forEach(btn => {
        btn.addEventListener("click", () => { currentImage = Number(btn.dataset.i); renderGallery(); });
      });
      if (imgs.length <= 1) thumbsEl.style.display = "none";
    }
    renderGallery();

    function renderSizes() {
      if (!p.tamanhos || !p.tamanhos.length) { sizeGridEl.closest(".pdp-block").style.display = "none"; return; }
      sizeGridEl.innerHTML = p.tamanhos.map(t => {
        const indisponivel = (p.tamanhosIndisponiveis || []).includes(t);
        return `<button class="size-opt" data-size="${t}" aria-pressed="false" ${indisponivel ? "disabled" : ""} aria-label="Tamanho ${t}${indisponivel ? " (indisponível)" : ""}">${t}</button>`;
      }).join("");
      sizeGridEl.querySelectorAll(".size-opt:not(:disabled)").forEach(btn => {
        btn.addEventListener("click", () => {
          selectedSize = btn.dataset.size;
          sizeGridEl.querySelectorAll(".size-opt").forEach(b => b.setAttribute("aria-pressed", String(b === btn)));
          sizeError.textContent = "";
        });
      });
    }
    renderSizes();

    if (p.personalizavel) {
      personalizeEl.style.display = "";
      personalizeEl.innerHTML = `
        <div class="personalize-row">
          <div class="field">
            <label for="pzNome">Nome (bordado/estampa)</label>
            <input type="text" id="pzNome" maxlength="20" placeholder="Ex.: SILVA">
          </div>
          <div class="field">
            <label for="pzNumero">Número</label>
            <input type="text" id="pzNumero" maxlength="3" inputmode="numeric" placeholder="Ex.: 10">
          </div>
        </div>
        <p class="field-hint">Personalização sob consulta de prazo. Deixe em branco se não quiser personalizar.</p>`;
    } else {
      personalizeEl.style.display = "none";
    }

    document.getElementById("pdpQtyDec").addEventListener("click", () => { qty = Math.max(1, qty - 1); qtyValueEl.textContent = qty; });
    document.getElementById("pdpQtyInc").addEventListener("click", () => { qty = Math.min(50, qty + 1); qtyValueEl.textContent = qty; });

    function buildLine() {
      if (p.tamanhos && p.tamanhos.length && !selectedSize) {
        sizeError.textContent = "Selecione um tamanho.";
        return null;
      }
      const personalizacao = p.personalizavel ? {
        nome: (document.getElementById("pzNome")?.value || "").trim(),
        numero: (document.getElementById("pzNumero")?.value || "").trim(),
      } : null;
      return { sku: p.sku, qty, tamanho: selectedSize, personalizacao };
    }

    addBtn.addEventListener("click", () => {
      const line = buildLine();
      if (!line) return;
      addToCart(line);
      showToast("Adicionado à sacola ✓");
    });
    buyBtn.addEventListener("click", () => {
      const line = buildLine();
      if (!line) return;
      addToCart(line);
      checkout();
    });

    document.getElementById("sizeGuideBtn")?.addEventListener("click", () => openModal("sizeGuideModal"));

    renderCart();
  }

  /* ---------------- sacola ---------------- */
  function lineKey(line) {
    return [line.sku, line.tamanho || "", JSON.stringify(line.personalizacao || null)].join("|");
  }
  function addToCart(line) {
    const key = lineKey(line);
    const existing = cart.find(i => lineKey(i) === key);
    if (existing) existing.qty += line.qty;
    else cart.push(line);
    saveCart();
    renderCart();
  }
  function changeQty(idx, delta) {
    const item = cart[idx];
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart.splice(idx, 1);
    saveCart();
    renderCart();
  }
  function removeFromCart(idx) {
    cart.splice(idx, 1);
    saveCart();
    renderCart();
  }
  function cartSubtotal() {
    return cart.reduce((sum, item) => {
      const p = findProduct(item.sku);
      return sum + (p ? precoFinal(p) * item.qty : 0);
    }, 0);
  }
  function cartCount() { return cart.reduce((sum, i) => sum + i.qty, 0); }

  function cartItemMeta(item) {
    const parts = [];
    if (item.tamanho) parts.push(`Tam. ${item.tamanho}`);
    if (item.personalizacao) {
      const { nome, numero } = item.personalizacao;
      if (nome) parts.push(`Nome: ${nome}`);
      if (numero) parts.push(`Nº ${numero}`);
    }
    return parts.join(" · ");
  }

  function renderCart() {
    const countEl = document.getElementById("cartCount");
    if (countEl) countEl.textContent = cartCount();

    const container = document.getElementById("cartItems");
    const subtotalEl = document.getElementById("cartSubtotal");
    const freteEl = document.getElementById("cartFreteMsg");
    const subtotal = cartSubtotal();
    if (subtotalEl) subtotalEl.textContent = currency(subtotal);
    if (freteEl && CONFIG) {
      const falta = CONFIG.freteGratisAcima - subtotal;
      freteEl.textContent = falta > 0
        ? `Faltam ${currency(falta)} para frete grátis*`
        : "Você garantiu frete grátis*";
    }

    if (!container) return;
    if (!cart.length) {
      container.innerHTML = `<p class="cart-empty">Sua sacola está vazia.</p>`;
      return;
    }
    container.innerHTML = cart.map((item, idx) => {
      const p = findProduct(item.sku);
      if (!p) return "";
      const meta = cartItemMeta(item);
      return `
        <div class="cart-item">
          <div class="cart-item-thumb">${mediaMarkup(p.imagens)}</div>
          <div class="cart-item-info">
            <span class="cart-item-name">${escapeHtml(p.nome)}</span>
            ${meta ? `<span class="cart-item-meta">${escapeHtml(meta)}</span>` : ""}
            <span class="cart-item-price">${currency(precoFinal(p))}</span>
            <div class="cart-item-qty">
              <button class="qty-btn" data-action="dec" data-idx="${idx}" aria-label="Diminuir quantidade">−</button>
              <span>${item.qty}</span>
              <button class="qty-btn" data-action="inc" data-idx="${idx}" aria-label="Aumentar quantidade">+</button>
            </div>
          </div>
          <button class="cart-item-remove" data-action="remove" data-idx="${idx}">Remover</button>
        </div>`;
    }).join("");

    container.querySelectorAll("[data-action]").forEach(btn => {
      const idx = Number(btn.dataset.idx);
      const action = btn.dataset.action;
      btn.addEventListener("click", () => {
        if (action === "inc") changeQty(idx, 1);
        if (action === "dec") changeQty(idx, -1);
        if (action === "remove") removeFromCart(idx);
      });
    });
  }

  /* ---------------- checkout whatsapp ---------------- */
  function buildWhatsappMessage() {
    const lines = [CONFIG.greeting, ""];
    cart.forEach(item => {
      const p = findProduct(item.sku);
      if (!p) return;
      const meta = cartItemMeta(item);
      lines.push(`• ${item.qty}x ${p.nome}${meta ? ` (${meta})` : ""} — ${currency(precoFinal(p))} un.`);
    });
    lines.push("");
    lines.push(`Total estimado: ${currency(cartSubtotal())}`);
    lines.push("");
    lines.push("Aguardo confirmação de disponibilidade, forma de pagamento e frete/retirada. Obrigado!");
    return lines.join("\n");
  }
  function checkout() {
    if (!cart.length) { showToast("Sua sacola está vazia."); return; }
    window.open(waLink(buildWhatsappMessage()), "_blank");
  }

  /* ---------------- UI: drawer, menu, modal, toast ---------------- */
  function openCart() { document.getElementById("cartDrawer")?.classList.add("open"); document.getElementById("cartOverlay")?.classList.add("active"); }
  function closeCart() { document.getElementById("cartDrawer")?.classList.remove("open"); document.getElementById("cartOverlay")?.classList.remove("active"); }

  function openModal(id) {
    const el = document.getElementById(id);
    el?.classList.add("open");
    el?.querySelector(".modal-close")?.focus();
  }
  function closeModal(id) { document.getElementById(id)?.classList.remove("open"); }

  let toastTimer;
  function showToast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function initUiChrome() {
    document.getElementById("menuToggle")?.addEventListener("click", () => {
      const nav = document.getElementById("mainNav");
      const overlay = document.getElementById("navOverlay");
      const expanded = nav.classList.toggle("show");
      overlay?.classList.toggle("active", expanded);
      document.getElementById("menuToggle").setAttribute("aria-expanded", String(expanded));
    });
    document.getElementById("navOverlay")?.addEventListener("click", () => {
      document.getElementById("mainNav")?.classList.remove("show");
      document.getElementById("navOverlay")?.classList.remove("active");
    });

    document.getElementById("cartBtn")?.addEventListener("click", openCart);
    document.getElementById("closeCart")?.addEventListener("click", closeCart);
    document.getElementById("cartOverlay")?.addEventListener("click", closeCart);
    document.getElementById("checkoutBtn")?.addEventListener("click", checkout);

    document.querySelectorAll("[data-modal-close]").forEach(btn => {
      btn.addEventListener("click", () => closeModal(btn.closest(".modal-overlay").id));
    });
    document.querySelectorAll(".modal-overlay").forEach(overlay => {
      overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(overlay.id); });
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      document.querySelectorAll(".modal-overlay.open").forEach(m => closeModal(m.id));
      closeCart();
    });

    initFaq();
    observeReveal();
  }

  function initFaq() {
    document.querySelectorAll(".faq-item").forEach(item => {
      item.querySelector(".faq-question")?.addEventListener("click", () => {
        const wasOpen = item.classList.contains("open");
        item.parentElement.querySelectorAll(".faq-item").forEach(i => i.classList.remove("open"));
        if (!wasOpen) item.classList.add("open");
      });
    });
  }

  let revealObserver;
  function observeReveal() {
    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
    }
    document.querySelectorAll("[data-reveal]:not(.in-view)").forEach(el => revealObserver.observe(el));
  }

  /* ---------------- init ---------------- */
  async function init() {
    await loadData();
    initUiChrome();
    initHome();
    initCollection();
    initPdp();
    renderCart();
  }

  return { init, currency, waLink: (m) => waLink(m) };
})();

document.addEventListener("DOMContentLoaded", () => { Store.init(); });
