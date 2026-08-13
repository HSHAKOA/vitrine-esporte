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
  let favorites = JSON.parse(localStorage.getItem("vitrine_favoritos") || "[]");

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

  /* ---------------- favoritos (wishlist local, sem backend) ---------------- */
  function isFavorite(sku) { return favorites.includes(sku); }
  function toggleFavorite(sku) {
    const idx = favorites.indexOf(sku);
    if (idx >= 0) favorites.splice(idx, 1); else favorites.push(sku);
    localStorage.setItem("vitrine_favoritos", JSON.stringify(favorites));
    document.dispatchEvent(new CustomEvent("favoritos:change"));
  }
  function heartSvg(active) {
    return `<svg viewBox="0 0 24 24" fill="${active ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7.5-4.6-10-9.3C.5 8 2 4 6 4c2 0 3.5 1.2 4.5 2.6C11.5 5.2 13 4 15 4c4 0 5.5 4 4 7.7C19.5 16.4 12 21 12 21z"/></svg>`;
  }
  function favoriteBtnHtml(sku, extraClass = "") {
    const active = isFavorite(sku);
    return `<button type="button" class="btn-icon-circular product-card-fav${active ? " is-fav" : ""} ${extraClass}" data-fav="${sku}" aria-pressed="${active}" aria-label="${active ? "Remover dos favoritos" : "Adicionar aos favoritos"}">${heartSvg(active)}</button>`;
  }

  /* ---------------- parcelamento ---------------- */
  function installmentsText(value) {
    return `ou 12x de ${currency(value / 12)} sem juros`;
  }

  const CATEGORY_LABELS = {
    futebol: "Futebol", futsal: "Futsal", society: "Society",
    jiujitsu: "Jiu-Jitsu", acessorios: "Acessórios",
  };

  /* Foto de produto é opcional: se `imagens[0]` existir, a mídia (card,
     sacola, PDP) recebe uma <img> real; se não existir OU o arquivo falhar
     ao carregar, o bloco --color-soft-cloud (ou --color-ink no
     campaign-tile) permanece vazio, sem quebrar o layout. */
  function mediaMarkup(imagens, alt) {
    const src = imagens && imagens[0];
    if (!src) return "";
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt || "")}" loading="lazy" onerror="this.remove()">`;
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

  /* contraste automático: decide texto preto ou branco sobre a cor de marca,
     pra corDestaque não depender do lojista acertar um tom escuro o bastante */
  function contrastColor(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
    if (!m) return "#ffffff";
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 140 ? "#111111" : "#ffffff";
  }

  function applyBranding() {
    if (CONFIG.corDestaque) {
      document.documentElement.style.setProperty("--color-accent", CONFIG.corDestaque);
      document.documentElement.style.setProperty("--color-on-accent", contrastColor(CONFIG.corDestaque));
    }
    document.querySelectorAll("[data-store-name]").forEach(el => el.textContent = CONFIG.nome);
    document.querySelectorAll("[data-store-tagline]").forEach(el => el.textContent = CONFIG.tagline);
    document.querySelectorAll("[data-store-desc]").forEach(el => el.textContent = CONFIG.descricao);
    document.querySelectorAll("[data-store-sobre]").forEach(el => el.textContent = CONFIG.sobre || CONFIG.descricao);
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
    const image = p.imagens && p.imagens[0];
    setPageSeo({
      title: `${p.nome} | ${CONFIG.nome}`,
      description: p.descricao,
      image,
    });
    /* sem "image": produto sem foto cadastrada é válido no schema.org Product */
    injectJsonLd("ld-product", {
      "@context": "https://schema.org",
      "@type": "Product",
      "sku": p.sku,
      "name": p.nome,
      "description": p.descricao,
      ...(image ? { image } : {}),
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

  /* ---------------- promo bar (topo, cicla mensagens) ---------------- */
  function initPromoBar() {
    const bar = document.getElementById("promoBar");
    const track = document.getElementById("promoTrack");
    if (!bar || !track) return;
    const msgs = (CONFIG.promocoes && CONFIG.promocoes.length) ? CONFIG.promocoes : [
      "Frete combinado direto pelo WhatsApp",
      "Pix, crédito ou débito — combine com a loja",
      "Personalização em até 48h",
    ];
    let idx = 0;
    track.innerHTML = msgs.map((m, i) => `<span class="promo-msg${i === 0 ? " active" : ""}">${escapeHtml(m)}</span>`).join("");
    const spans = track.querySelectorAll(".promo-msg");
    function show(i) { spans.forEach((s, si) => s.classList.toggle("active", si === i)); }
    function next() { idx = (idx + 1) % msgs.length; show(idx); }
    function prev() { idx = (idx - 1 + msgs.length) % msgs.length; show(idx); }
    let timer;
    function start() { if (msgs.length > 1) timer = setInterval(next, 5000); }
    function stop() { clearInterval(timer); }
    function restart() { stop(); start(); }
    document.getElementById("promoPrev")?.addEventListener("click", () => { prev(); restart(); });
    document.getElementById("promoNext")?.addEventListener("click", () => { next(); restart(); });
    bar.addEventListener("mouseenter", stop);
    bar.addEventListener("mouseleave", start);
    bar.addEventListener("touchstart", stop, { passive: true });
    start();
  }

  /* ---------------- catálogo / render ---------------- */
  /* product-card: mídia mostra a foto (imagens[0]) quando existir, sem
     nenhum ícone sobreposto — sem foto, fica o bloco --color-soft-cloud
     vazio. Favoritar fica como botão de verdade ao lado do texto (não
     flutuando sobre a imagem); "Oferta" vira uma tag inline junto do
     preço. Card inteiro leva pra PDP; não existe mais "adicionar rápido"
     aqui — quem tem tamanho/personalização precisa passar pela PDP. */
  function productCardHtml(p) {
    const promo = p.precoPromo != null;
    const href = `produto.html?p=${encodeURIComponent(p.slug)}`;
    return `
      <article class="product-card">
        <a href="${href}" class="product-card-media" aria-label="${escapeHtml(p.nome)}">
          ${mediaMarkup(p.imagens, p.nome)}
        </a>
        <div class="product-card-body">
          <a href="${href}" class="product-card-link">
            <span class="product-card-name">${escapeHtml(p.nome)}</span>
            <span class="product-card-cat">${escapeHtml(CATEGORY_LABELS[p.categoria] || p.categoria)}</span>
            <span class="product-card-price">
              ${promo ? `<span class="old">${currency(p.preco)}</span><span class="sale">${currency(precoFinal(p))}</span><span class="tag">Oferta</span>` : currency(precoFinal(p))}
            </span>
            <span class="product-card-installments">${installmentsText(precoFinal(p))}</span>
          </a>
          ${favoriteBtnHtml(p.sku)}
        </div>
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
    wireProductCardButtons(grid);
  }

  /* botão de favoritar, repetido em qualquer grid de product-card (grade
     principal, relacionados da PDP). */
  function wireProductCardButtons(container) {
    container.querySelectorAll("[data-fav]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const sku = btn.dataset.fav;
        toggleFavorite(sku);
        const active = isFavorite(sku);
        btn.classList.toggle("is-fav", active);
        btn.setAttribute("aria-pressed", String(active));
        btn.setAttribute("aria-label", active ? "Remover dos favoritos" : "Adicionar aos favoritos");
        btn.innerHTML = heartSvg(active);
      });
    });
  }

  /* ---------------- rail "compre por categoria" ---------------- */
  function categoriaLinksHtml(linkClass) {
    const categorias = [...new Set(PRODUCTS.map(p => p.categoria))];
    return categorias.map(c => `
      <a class="${linkClass}" href="colecao.html?categoria=${encodeURIComponent(c)}">
        <span>${escapeHtml(CATEGORY_LABELS[c] || c)}</span>
      </a>`).join("");
  }
  function renderCategoryRail(elId) {
    const el = document.getElementById(elId);
    if (el) el.innerHTML = categoriaLinksHtml("category-tile");
  }
  /* dropdown do nav — aparece no hover em desktop, vira lista estática no drawer mobile */
  function renderNavCategoryMenu() {
    const el = document.getElementById("navCategoryMenu");
    if (el) el.innerHTML = categoriaLinksHtml("");
  }

  /* ---------------- coleção: filtros ---------------- */
  /* ordena por: numérico crescente primeiro, depois letras na ordem de tamanho */
  const SIZE_ORDER = ["PP", "P", "M", "G", "GG", "XG", "ÚNICO", "UNICO"];
  function sortSizes(sizes) {
    return [...sizes].sort((a, b) => {
      const na = Number(a), nb = Number(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      if (!isNaN(na)) return -1;
      if (!isNaN(nb)) return 1;
      return SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b);
    });
  }

  function initCollection() {
    if (document.body.dataset.page !== "colecao") return;
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    const chipsEl = document.getElementById("categoryChips");
    const sizeChipsEl = document.getElementById("sizeChips");
    const promoBtn = document.getElementById("promoChip");
    const favBtn = document.getElementById("favChip");
    const sortEl = document.getElementById("sortSelect");
    const searchEl = document.getElementById("searchInput");
    const categorias = [...new Set(PRODUCTS.map(p => p.categoria))];
    function sizesForCategory(cat) {
      const pool = cat === "todos" ? PRODUCTS : PRODUCTS.filter(p => p.categoria === cat);
      return sortSizes([...new Set(pool.flatMap(p => p.tamanhos || []))]);
    }

    let activeCategory = qs("categoria") || "todos";
    let activeTamanho = qs("tamanho") || "todos";
    let onlyPromo = qs("promo") === "1";
    let onlyFavoritos = qs("favoritos") === "1";

    initFiltersDrawer();

    function chipHtml(value, label, active) {
      return `<button type="button" class="filter-chip${active ? " filter-chip-active" : ""}" data-value="${value}" aria-pressed="${active}">${label}</button>`;
    }

    if (chipsEl) {
      chipsEl.innerHTML = [chipHtml("todos", "Todos", activeCategory === "todos")]
        .concat(categorias.map(c => chipHtml(c, CATEGORY_LABELS[c] || c, activeCategory === c)))
        .join("");
      chipsEl.querySelectorAll(".filter-chip").forEach(btn => {
        btn.addEventListener("click", () => {
          activeCategory = btn.dataset.value;
          chipsEl.querySelectorAll(".filter-chip").forEach(b => {
            b.classList.toggle("filter-chip-active", b === btn);
            b.setAttribute("aria-pressed", String(b === btn));
          });
          renderSizeChips();
          applyFilters();
        });
      });
    }

    /* tamanhos disponíveis mudam de vocabulário por categoria (numeração de
       calçado, faixa de kimono, peso de luva...) — mostrar só os da categoria
       ativa evita uma parede de chips sem sentido junto */
    function renderSizeChips() {
      if (!sizeChipsEl) return;
      const tamanhos = sizesForCategory(activeCategory);
      if (!tamanhos.includes(activeTamanho)) activeTamanho = "todos";
      sizeChipsEl.innerHTML = [chipHtml("todos", "Todos", activeTamanho === "todos")]
        .concat(tamanhos.map(t => chipHtml(t, t, activeTamanho === t)))
        .join("");
      sizeChipsEl.querySelectorAll(".filter-chip").forEach(btn => {
        btn.addEventListener("click", () => {
          activeTamanho = btn.dataset.value;
          sizeChipsEl.querySelectorAll(".filter-chip").forEach(b => {
            b.classList.toggle("filter-chip-active", b === btn);
            b.setAttribute("aria-pressed", String(b === btn));
          });
          applyFilters();
        });
      });
    }
    renderSizeChips();

    if (promoBtn) {
      promoBtn.classList.toggle("filter-chip-active", onlyPromo);
      promoBtn.setAttribute("aria-pressed", String(onlyPromo));
      promoBtn.addEventListener("click", () => {
        onlyPromo = !onlyPromo;
        promoBtn.classList.toggle("filter-chip-active", onlyPromo);
        promoBtn.setAttribute("aria-pressed", String(onlyPromo));
        applyFilters();
      });
    }

    if (favBtn) {
      favBtn.classList.toggle("filter-chip-active", onlyFavoritos);
      favBtn.setAttribute("aria-pressed", String(onlyFavoritos));
      favBtn.addEventListener("click", () => {
        onlyFavoritos = !onlyFavoritos;
        favBtn.classList.toggle("filter-chip-active", onlyFavoritos);
        favBtn.setAttribute("aria-pressed", String(onlyFavoritos));
        applyFilters();
      });
    }
    /* favoritar/desfavoritar um card na própria grade também deve
       atualizar a lista quando o filtro "Favoritos" está ativo */
    document.addEventListener("favoritos:change", () => { if (onlyFavoritos) applyFilters(); });

    /* spinner sutil no grid a cada troca de filtro — não há fetch real,
       então usa requestAnimationFrame para dar um respiro visual mínimo */
    function applyFilters() {
      showGridSpinner();
      requestAnimationFrame(() => {
        const term = (searchEl?.value || "").trim().toLowerCase();
        let list = PRODUCTS.filter(p => {
          const matchCat = activeCategory === "todos" || p.categoria === activeCategory;
          const matchTerm = !term || p.nome.toLowerCase().includes(term);
          const matchTamanho = activeTamanho === "todos"
            || ((p.tamanhos || []).includes(activeTamanho) && !(p.tamanhosIndisponiveis || []).includes(activeTamanho));
          const matchPromo = !onlyPromo || p.precoPromo != null;
          const matchFavorito = !onlyFavoritos || isFavorite(p.sku);
          return matchCat && matchTerm && matchTamanho && matchPromo && matchFavorito;
        });
        const ordem = sortEl?.value || "relevancia";
        if (ordem === "menor-preco") list = [...list].sort((a, b) => precoFinal(a) - precoFinal(b));
        if (ordem === "maior-preco") list = [...list].sort((a, b) => precoFinal(b) - precoFinal(a));
        renderGrid("productsGrid", list);
        setTimeout(hideGridSpinner, 180);
      });
    }

    searchEl?.addEventListener("input", applyFilters);
    sortEl?.addEventListener("change", applyFilters);
    applyFilters();
  }

  function showGridSpinner() { document.getElementById("gridSpinner")?.classList.add("show"); }
  function hideGridSpinner() { document.getElementById("gridSpinner")?.classList.remove("show"); }

  /* drawer de filtros (mobile): mesmo padrão .drawer/.scrim da sacola */
  function initFiltersDrawer() {
    const drawer = document.getElementById("filtersDrawer");
    const overlay = document.getElementById("filtersOverlay");
    if (!drawer || !overlay) return;
    function openDrawer() { drawer.classList.add("open"); overlay.classList.add("active"); }
    function closeDrawer() { drawer.classList.remove("open"); overlay.classList.remove("active"); }
    document.getElementById("filtersBtn")?.addEventListener("click", openDrawer);
    document.getElementById("closeFiltersDrawer")?.addEventListener("click", closeDrawer);
    overlay.addEventListener("click", closeDrawer);
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
      openCart();
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

    document.getElementById("pdpMainImage").innerHTML = mediaMarkup(p.imagens, p.nome);

    const catLabel = CATEGORY_LABELS[p.categoria] || p.categoria;
    document.getElementById("pdpCat").textContent = catLabel;
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
    const installmentsEl = document.getElementById("pdpInstallments");
    if (installmentsEl) installmentsEl.textContent = installmentsText(precoFinal(p));

    /* breadcrumb: Início / Coleção / {nome do produto} */
    const crumbCat = document.getElementById("pdpBreadcrumbCat");
    if (crumbCat) crumbCat.href = `colecao.html?categoria=${encodeURIComponent(p.categoria)}`;
    const crumbName = document.getElementById("pdpBreadcrumbName");
    if (crumbName) crumbName.textContent = p.nome;

    /* seção "entrega e pagamento" do accordion, com dados reais do config */
    const entregaInfoEl = document.getElementById("pdpEntregaInfo");
    if (entregaInfoEl && CONFIG) {
      entregaInfoEl.textContent = `${CONFIG.prazoEntrega} Formas de pagamento: ${(CONFIG.pagamentos || []).join(", ")}.`;
    }

    /* favoritar */
    const favBtn = document.getElementById("pdpFavBtn");
    if (favBtn) {
      const paintFav = () => {
        const active = isFavorite(p.sku);
        favBtn.classList.toggle("is-fav", active);
        favBtn.setAttribute("aria-pressed", String(active));
        favBtn.setAttribute("aria-label", active ? "Remover dos favoritos" : "Adicionar aos favoritos");
        favBtn.innerHTML = heartSvg(active);
      };
      paintFav();
      favBtn.addEventListener("click", () => { toggleFavorite(p.sku); paintFav(); });
    }

    /* compartilhar: só aparece se o navegador suportar a Web Share API */
    const shareBtn = document.getElementById("pdpShareBtn");
    if (shareBtn && navigator.share) {
      shareBtn.style.display = "";
      shareBtn.addEventListener("click", () => {
        navigator.share({ title: p.nome, text: p.nome, url: location.href }).catch(() => {});
      });
    }

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
      openCart();
    });
    buyBtn.addEventListener("click", () => {
      const line = buildLine();
      if (!line) return;
      addToCart(line);
      checkout();
    });

    document.getElementById("sizeGuideBtn")?.addEventListener("click", () => openModal("sizeGuideModal"));

    /* barra fixa de compra: some enquanto o botão "Adicionar" principal
       está visível, aparece quando o usuário rola além dele */
    const stickyBar = document.getElementById("pdpStickyBar");
    if (stickyBar) {
      document.getElementById("pdpStickyName").textContent = p.nome;
      document.getElementById("pdpStickyPrice").textContent = currency(precoFinal(p));
      document.getElementById("pdpStickyAddBtn")?.addEventListener("click", () => {
        const line = buildLine();
        if (!line) return;
        addToCart(line);
        openCart();
      });
      const stickyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => stickyBar.classList.toggle("show", !entry.isIntersecting));
      }, { threshold: 0 });
      stickyObserver.observe(addBtn);
    }

    /* carrossel "você também pode gostar": mesmos product-card, mesma
       categoria, sem o produto atual. Scroll nativo (overflow-x + snap). */
    const relatedSection = document.getElementById("relatedSection");
    const relatedRail = document.getElementById("relatedRail");
    if (relatedSection && relatedRail) {
      const related = PRODUCTS.filter(x => x.categoria === p.categoria && x.sku !== p.sku).slice(0, 8);
      if (related.length) {
        relatedSection.style.display = "";
        relatedRail.innerHTML = related.map(productCardHtml).join("");
        wireProductCardButtons(relatedRail);
        document.getElementById("relatedPrev")?.addEventListener("click", () => relatedRail.scrollBy({ left: -240, behavior: "smooth" }));
        document.getElementById("relatedNext")?.addEventListener("click", () => relatedRail.scrollBy({ left: 240, behavior: "smooth" }));
      }
    }

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
          <span class="ci-thumb" aria-hidden="true">${mediaMarkup(p.imagens, p.nome)}</span>
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
    renderNavCategoryMenu();
    initPromoBar();
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
