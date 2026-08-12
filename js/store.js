/* =========================================================
   VITRINE-ESPORTE — STORE.JS
   Catálogo, filtros, sacola, personalizador (PDP + genérico da
   home com preview ao vivo), checkout WhatsApp, SEO (meta +
   JSON-LD) e utilidades de UI. Zero dependências.
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
  /* item da sacola pode referenciar um produto real (por sku) ou
     carregar seu próprio "produto" embutido (personalização genérica) */
  function getLineProduct(item) {
    return item.custom ? item.produtoCustom : findProduct(item.sku);
  }

  const CATEGORY_LABELS = {
    futebol: "Futebol", futsal: "Futsal", society: "Society",
    jiujitsu: "Jiu-Jitsu", acessorios: "Acessórios",
  };

  /* Site sem fotografia: onde o sistema Nike pediria uma foto (card de
     produto, sacola, PDP), o bloco de mídia fica --color-soft-cloud
     vazio — sem ícone, sem SVG, sem inicial do nome. É deliberado. */

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
    document.querySelectorAll("[data-store-desc]").forEach(el => el.textContent = CONFIG.descricao);
    document.querySelectorAll("[data-store-cidade]").forEach(el => el.textContent = CONFIG.cidade);
    document.querySelectorAll("[data-store-logo]").forEach(el => {
      if (CONFIG.logo) { el.src = CONFIG.logo; el.style.display = ""; }
      else { el.style.display = "none"; }
    });
    document.querySelectorAll("[data-store-wordmark]").forEach(el => {
      if (!CONFIG.logo) el.textContent = CONFIG.nome;
    });
    document.querySelectorAll("[data-collection-num]").forEach(el => el.textContent = (CONFIG.colecao && CONFIG.colecao.numero) || "01");
    document.querySelectorAll("[data-collection-nome]").forEach(el => el.textContent = (CONFIG.colecao && CONFIG.colecao.nome) || "");

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
    setPageSeo({
      title: `${p.nome} | ${CONFIG.nome}`,
      description: p.descricao,
    });
    /* sem campo "image": produto sem foto é válido no schema.org Product */
    injectJsonLd("ld-product", {
      "@context": "https://schema.org",
      "@type": "Product",
      "sku": p.sku,
      "name": p.nome,
      "description": p.descricao,
      "offers": {
        "@type": "Offer",
        "priceCurrency": "BRL",
        "price": precoFinal(p).toFixed(2),
        "availability": "https://schema.org/InStock",
      },
    });
  }
  /* bug corrigido: setPageSeo/setMeta antes só rodava na PDP.
     Agora roda em toda página (a PDP segue setando a sua via setProductSeo). */
  function setGenericPageSeo() {
    const page = document.body.dataset.page;
    if (page === "produto") return;
    const titles = {
      home: CONFIG.nome,
      colecao: `Coleção | ${CONFIG.nome}`,
      entrega: `Entrega e pagamento | ${CONFIG.nome}`,
      contato: `Contato | ${CONFIG.nome}`,
    };
    const descs = {
      home: CONFIG.descricao,
      colecao: `Catálogo completo de produtos da ${CONFIG.nome}.`,
      entrega: CONFIG.prazoEntrega,
      contato: `Fale com a ${CONFIG.nome} pelo WhatsApp ou Instagram.`,
    };
    setPageSeo({ title: titles[page] || CONFIG.nome, description: descs[page] || CONFIG.descricao });
  }

  /* ---------------- catálogo / render ---------------- */
  /* product-card do sistema Nike: mídia = bloco --color-soft-cloud vazio
     (sem foto, sem ícone), metadados abaixo com spacing.sm entre linhas. */
  function productCardHtml(p) {
    const promo = p.precoPromo != null;
    const href = `produto.html?p=${encodeURIComponent(p.slug)}`;
    return `
      <article class="product-card" data-sku="${p.sku}">
        <a href="${href}" class="product-card-media" aria-label="${escapeHtml(p.nome)}">
          ${promo ? `<span class="badge-promo">Oferta</span>` : ""}
          <span class="product-card-quick">
            <button type="button" class="btn-icon-circular" data-sku="${p.sku}" aria-label="Adicionar ${escapeHtml(p.nome)} à sacola" title="Adicionar à sacola">+</button>
          </span>
        </a>
        <a href="${href}" class="product-card-body">
          <span class="product-card-name">${escapeHtml(p.nome)}</span>
          <span class="product-card-cat">${escapeHtml(CATEGORY_LABELS[p.categoria] || p.categoria)}</span>
          <span class="product-card-price">
            ${promo ? `<span class="old">${currency(p.preco)}</span><span class="sale">${currency(precoFinal(p))}</span>` : currency(precoFinal(p))}
          </span>
        </a>
      </article>`;
  }

  function renderGrid(elId, list) {
    const grid = document.getElementById(elId);
    if (!grid) return;
    if (!list.length) {
      grid.innerHTML = `<p class="filters-empty">Nenhum produto encontrado.</p>`;
      return;
    }
    grid.innerHTML = list.map(p => productCardHtml(p)).join("");
    grid.querySelectorAll("[data-sku]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart({ sku: btn.dataset.sku, qty: 1, tamanho: null, personalizacao: null });
        showToast("Adicionado à sacola ✓");
      });
    });
  }

  /* ---------------- rail "compre por categoria" ---------------- */
  function renderCategoryRail(elId) {
    const el = document.getElementById(elId);
    if (!el) return;
    const categorias = [...new Set(PRODUCTS.map(p => p.categoria))];
    el.innerHTML = categorias.map(c => `
      <a class="category-tile" href="colecao.html?categoria=${encodeURIComponent(c)}">
        <span>${escapeHtml(CATEGORY_LABELS[c] || c)}</span>
      </a>`).join("");
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
      return `<button class="filter-chip${activeCategory === value ? " filter-chip-active" : ""}" data-value="${value}" aria-pressed="${activeCategory === value}">${label}</button>`;
    }
    if (chipsEl) {
      chipsEl.innerHTML = [chipHtml("todos", "Todos")]
        .concat(categorias.map(c => chipHtml(c, CATEGORY_LABELS[c] || c)))
        .join("");
      chipsEl.querySelectorAll(".filter-chip").forEach(btn => {
        btn.addEventListener("click", () => {
          activeCategory = btn.dataset.value;
          chipsEl.querySelectorAll(".filter-chip").forEach(b => {
            b.classList.toggle("filter-chip-active", b === btn);
            b.setAttribute("aria-pressed", String(b === btn));
          });
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
    if (document.body.dataset.page !== "home") return;
    const grid = document.getElementById("productsGrid");
    if (grid) renderGrid("productsGrid", PRODUCTS.filter(p => p.destaque));
    renderCategoryRail("categoryRail");
  }

  /* ---------------- personalizador genérico (home) ----------------
     Bloco "monte sua camisa" fora do catálogo. Sem preview de camisa
     (zero imagem/SVG ilustrativo) — feedback ao vivo é só tipográfico:
     um cartão --color-ink com o nome/número digitados em
     display-campaign. Vira um item de linha customizado na MESMA
     sacola/checkout usados pelo resto do site. */
  function initHomeCustomizer() {
    if (document.body.dataset.page !== "home") return;
    const nomeEl = document.getElementById("pzHomeNome");
    const numEl = document.getElementById("pzHomeNumero");
    const sizesEl = document.getElementById("pzHomeSizes");
    const previewNome = document.getElementById("pzPreviewNome");
    const previewNumero = document.getElementById("pzPreviewNumero");
    const priceEl = document.getElementById("pzHomePrice");
    const addBtn = document.getElementById("pzHomeAddBtn");
    if (!nomeEl || !sizesEl) return;

    const preco = CONFIG.precoPersonalizacao;
    if (priceEl) priceEl.textContent = currency(preco);

    let selectedSize = "M";
    const sizes = ["PP", "P", "M", "G", "GG", "XG"];
    sizesEl.innerHTML = sizes.map(s => `<button type="button" class="size${s === selectedSize ? " on" : ""}" data-size="${s}">${s}</button>`).join("");
    sizesEl.querySelectorAll(".size").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedSize = btn.dataset.size;
        sizesEl.querySelectorAll(".size").forEach(b => b.classList.toggle("on", b === btn));
      });
    });

    function pinta() {
      if (previewNome) previewNome.textContent = (nomeEl.value || "").toUpperCase() || "SEU NOME";
      if (previewNumero) previewNumero.textContent = numEl.value || "00";
    }
    nomeEl.addEventListener("input", pinta);
    numEl?.addEventListener("input", pinta);
    pinta();

    addBtn?.addEventListener("click", () => {
      const nome = (nomeEl.value || "").trim();
      const numero = (numEl?.value || "").trim();
      const line = {
        sku: "CUSTOM-JERSEY",
        qty: 1,
        tamanho: selectedSize,
        personalizacao: { nome, numero },
        custom: true,
        produtoCustom: { nome: "Camisa Personalizada", preco, precoPromo: null, sku: "CUSTOM-JERSEY", imagens: [] },
      };
      addToCart(line);
      showToast("Adicionado à sacola ✓");
    });
  }

  /* ---------------- PDP ---------------- */
  function initPdp() {
    const root = document.getElementById("pdpRoot");
    if (!root) return;

    const slug = qs("p");
    const p = findBySlug(slug) || PRODUCTS[0];
    if (!p) { root.innerHTML = `<p class="filters-empty">Produto não encontrado.</p>`; return; }

    setProductSeo(p);

    let selectedSize = null;
    let qty = 1;

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

    /* nota: produtos reais têm fotos (não vetores), então este
       personalizador NÃO tem preview ao vivo — só os campos de
       nome/número, diferente do bloco genérico da home. */
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
      const p = getLineProduct(item);
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
      container.innerHTML = `<p class="drawer-empty">Sacola vazia. Bora escolher.</p>`;
      return;
    }
    container.innerHTML = cart.map((item, idx) => {
      const p = getLineProduct(item);
      if (!p) return "";
      const meta = cartItemMeta(item);
      return `
        <div class="ci">
          <span class="ci-thumb" aria-hidden="true"></span>
          <div class="ci-info">
            <h4>${escapeHtml(p.nome)}</h4>
            ${meta ? `<span>${escapeHtml(meta)}</span>` : ""}
            <span>${currency(precoFinal(p))}</span>
            <div class="ci-qty">
              <button class="qty-btn" data-action="dec" data-idx="${idx}" aria-label="Diminuir quantidade">−</button>
              <span>${item.qty}</span>
              <button class="qty-btn" data-action="inc" data-idx="${idx}" aria-label="Aumentar quantidade">+</button>
            </div>
          </div>
          <button class="ci-remove" data-action="remove" data-idx="${idx}">Remover</button>
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
      const p = getLineProduct(item);
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
    document.querySelectorAll(".faq-row").forEach(item => {
      item.querySelector(".faq-question")?.addEventListener("click", () => {
        const wasOpen = item.classList.contains("open");
        item.parentElement.querySelectorAll(".faq-row").forEach(i => i.classList.remove("open"));
        if (!wasOpen) item.classList.add("open");
      });
    });
  }

  /* equivalente ao .rv/.rv.in do POC (substitui [data-reveal]/.in-view) */
  let revealObserver;
  function observeReveal() {
    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
    }
    document.querySelectorAll(".rv:not(.in)").forEach(el => revealObserver.observe(el));
  }

  /* ---------------- init ---------------- */
  async function init() {
    await loadData();
    setGenericPageSeo();
    initUiChrome();
    initHome();
    initHomeCustomizer();
    initCollection();
    initPdp();
    renderCart();
  }

  return { init, currency, waLink: (m) => waLink(m) };
})();

document.addEventListener("DOMContentLoaded", () => { Store.init(); });
