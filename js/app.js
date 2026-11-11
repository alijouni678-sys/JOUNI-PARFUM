/* ==========================================================
   Jouni Group Parfum · lógica del sitio
   - Catálogo por marca + buscador
   - Botón COMPRAR YA -> WhatsApp con mensaje del perfume
   ========================================================== */
(function () {
  "use strict";

  /* ---------- Configuración ---------- */
  var WA_PHONE = "595987111111";
  var WA_BASE = "https://api.whatsapp.com/send?phone=" + WA_PHONE;
  var PAY_NOTE = "Entiendo que el método de pago es únicamente por transferencia.";

  var DATA = window.CATALOG || { brands: [], items: [] };
  var brands = DATA.brands;
  var items = DATA.items;
  var brandById = {};
  brands.forEach(function (b) { brandById[b.id] = b; });
  var itemById = {};
  items.forEach(function (i) { itemById[i.id] = i; });

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Utilidades ---------- */
  function money(n) {
    return "Gs. " + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function norm(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  }
  function waLink(text) {
    return WA_BASE + "&text=" + encodeURIComponent(text);
  }
  function waGeneral() {
    return waLink("¡Hola Jouni Group Parfum! Quisiera hacer una consulta sobre sus perfumes.");
  }
  function waItem(it) {
    var b = brandById[it.b];
    var name = it.n + (it.t ? " (" + it.t + ")" : "");
    var lines = [
      "¡Hola Jouni Group Parfum! 👋",
      "",
      "Quiero comprar este perfume:",
      "🧴 *" + name + "*",
      "🏷️ Marca: " + (b ? b.name : ""),
      "💰 Precio: " + (it.p ? money(it.p) : "a consultar"),
      "",
      "💳 " + PAY_NOTE,
      "¿Lo tienen disponible?"
    ];
    return waLink(lines.join("\n"));
  }
  function waSearch(q) {
    return waLink("¡Hola Jouni Group Parfum! 👋\n\nBusqué \"" + q + "\" en su catálogo y no lo encontré. ¿Lo tienen o lo pueden conseguir?\n\n💳 " + PAY_NOTE);
  }

  var WA_ICON = '<svg viewBox="0 0 32 32" width="18" height="18" aria-hidden="true"><use href="#ico-wa"/></svg>';

  /* ---------- Enlaces generales de WhatsApp ---------- */
  ["headerWa", "heroWa", "locWa", "footWa", "waFloat"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.href = waGeneral();
  });
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Tarjeta de producto ---------- */
  function cardHTML(it, showBrand) {
    var b = brandById[it.b];
    var badge = it.s ? '<span class="badge sp">Especial</span>' : (it.t ? '<span class="badge">' + esc(it.t) + "</span>" : "");
    var price = it.p ? '<p class="price">' + money(it.p) + "</p>" : '<p class="price ask">Consultar precio</p>';
    return (
      '<article class="card" data-id="' + esc(it.id) + '">' +
        '<div class="ph" data-open="' + esc(it.id) + '" role="button" tabindex="0" aria-label="Ver ' + esc(it.n) + '">' +
          badge +
          '<img src="' + esc(it.i) + '" alt="' + esc(it.n) + (b ? " - " + esc(b.name) : "") + '" loading="lazy" decoding="async">' +
        "</div>" +
        '<div class="body">' +
          '<span class="bn">' + esc(b ? b.name : "") + "</span>" +
          "<h4>" + esc(it.n) + "</h4>" +
          price +
          '<a class="buy" href="' + waItem(it) + '" target="_blank" rel="noopener">' + WA_ICON + "<span>COMPRAR YA</span></a>" +
          '<p class="pay">Pago solo por transferencia</p>' +
        "</div>" +
      "</article>"
    );
  }

  /* ---------- Revelado al hacer scroll ---------- */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }) : null;

  function observe(root) {
    $$(".reveal:not(.in), .card:not(.in)", root).forEach(function (el, i) {
      if (!io) { el.classList.add("in"); return; }
      if (el.classList.contains("card")) el.style.transitionDelay = (i % 6) * 55 + "ms";
      io.observe(el);
    });
  }

  /* ---------- Secciones por marca ---------- */
  var sectionsEl = $("#brandSections");
  function renderSections() {
    var html = brands.map(function (b) {
      var its = items.filter(function (i) { return i.b === b.id; });
      var logo = b.logo
        ? '<img src="' + esc(b.logo) + '" alt="' + esc(b.name) + '" loading="lazy">'
        : '<span class="mark">✦</span>';
      return (
        '<section class="brand-sec" id="b-' + b.id + '" data-brand="' + b.id + '">' +
          '<header class="brand-head reveal">' +
            '<div class="brand-logo">' + logo + "</div>" +
            "<div><h3>" + esc(b.name) + "</h3><p>" + its.length + " perfumes</p></div>" +
          "</header>" +
          '<div class="grid">' + its.map(function (i) { return cardHTML(i, false); }).join("") + "</div>" +
        "</section>"
      );
    }).join("");
    sectionsEl.innerHTML = html;
    observe(sectionsEl);
  }

  /* ---------- Chips de marcas ---------- */
  var chipsEl = $("#chips");
  function renderChips() {
    chipsEl.innerHTML = brands.map(function (b, i) {
      return '<a class="chip' + (i === 0 ? " on" : "") + '" href="#b-' + b.id + '" data-chip="' + b.id + '">' +
        esc(b.name) + " <small>" + b.count + "</small></a>";
    }).join("");
    chipsEl.addEventListener("click", function (e) {
      var a = e.target.closest("[data-chip]");
      if (!a) return;
      e.preventDefault();
      if (qInput.value) { qInput.value = ""; runSearch(); }
      var target = document.getElementById("b-" + a.getAttribute("data-chip"));
      if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  }
  // marca activa al hacer scroll
  function trackActiveChip() {
    var secs = $$(".brand-sec");
    if (!("IntersectionObserver" in window) || !secs.length) return;
    var active = null;
    var obs = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) active = e.target.getAttribute("data-brand"); });
      if (!active) return;
      $$(".chip", chipsEl).forEach(function (c) {
        var on = c.getAttribute("data-chip") === active;
        c.classList.toggle("on", on);
        if (on && chipsEl.scrollWidth > chipsEl.clientWidth) {
          var left = c.offsetLeft - chipsEl.clientWidth / 2 + c.clientWidth / 2;
          chipsEl.scrollTo({ left: left, behavior: "smooth" });
        }
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    secs.forEach(function (s) { obs.observe(s); });
  }

  /* ---------- Buscador ---------- */
  var qInput = $("#q");
  var qClear = $("#qClear");
  var statusEl = $("#status");
  var resultsEl = $("#results");
  var searchIndex = items.map(function (it) {
    var b = brandById[it.b];
    return { it: it, hay: norm(it.n + " " + (b ? b.name : "") + " " + (it.t || "")) };
  });
  var timer = null;

  function runSearch() {
    var raw = qInput.value.trim();
    qClear.hidden = !raw;
    var q = norm(raw);
    if (!q) {
      resultsEl.hidden = true; statusEl.hidden = true; sectionsEl.hidden = false;
      resultsEl.innerHTML = "";
      return;
    }
    var tokens = q.split(" ");
    var hits = searchIndex.filter(function (r) {
      return tokens.every(function (t) { return r.hay.indexOf(t) !== -1; });
    }).map(function (r) { return r.it; });
    var similar = false;
    if (!hits.length && tokens.length > 1) {
      hits = searchIndex.filter(function (r) {
        return tokens.some(function (t) { return t.length > 2 && r.hay.indexOf(t) !== -1; });
      }).map(function (r) { return r.it; });
      similar = hits.length > 0;
    }
    // más relevantes primero: los que empiezan con la búsqueda
    hits.sort(function (a, b) {
      var sa = norm(a.n).indexOf(q) === 0 ? 0 : 1;
      var sb = norm(b.n).indexOf(q) === 0 ? 0 : 1;
      return sa - sb;
    });

    sectionsEl.hidden = true;
    statusEl.hidden = false;
    resultsEl.hidden = !hits.length;

    if (hits.length && !similar) {
      statusEl.className = "status ok";
      statusEl.innerHTML = '<span class="ic">✓</span><p><b>¡Sí lo tenemos!</b> Encontramos ' + hits.length +
        (hits.length === 1 ? " resultado" : " resultados") + ' para «' + esc(raw) + "».</p>";
    } else if (hits.length) {
      statusEl.className = "status ok";
      statusEl.innerHTML = '<span class="ic">≈</span><p>No hay coincidencia exacta con «' + esc(raw) +
        "», pero encontramos " + hits.length + " perfumes parecidos.</p>" +
        '<a class="btn btn-ghost" href="' + waSearch(raw) + '" target="_blank" rel="noopener">' + WA_ICON + "<span>Consultar</span></a>";
    } else {
      statusEl.className = "status no";
      statusEl.innerHTML = '<span class="ic">✕</span><p><b>No lo encontramos en el catálogo.</b> «' + esc(raw) +
        '» no aparece por ahora, pero consúltanos: quizás lo podamos conseguir.</p>' +
        '<a class="btn btn-gold" href="' + waSearch(raw) + '" target="_blank" rel="noopener">' + WA_ICON + "<span>Consultar por WhatsApp</span></a>";
    }

    resultsEl.className = "grid";
    resultsEl.innerHTML = hits.slice(0, 120).map(function (i) { return cardHTML(i, true); }).join("");
    $$(".card", resultsEl).forEach(function (c, i) {
      c.style.transitionDelay = Math.min(i, 12) * 30 + "ms";
      requestAnimationFrame(function () { c.classList.add("in"); });
    });

    // llevar al inicio de resultados si la barra no está a la vista
    var bar = $("#catbar").getBoundingClientRect();
    var top = $("#catalogo").getBoundingClientRect().top;
    if (top > 120 || bar.top > window.innerHeight * 0.5) {
      var y = window.scrollY + $("#catbar").getBoundingClientRect().top - (document.getElementById("header").offsetHeight) - 8;
      window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
    }
  }
  qInput.addEventListener("input", function () {
    clearTimeout(timer);
    timer = setTimeout(runSearch, 90);
  });
  qInput.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { qInput.value = ""; runSearch(); }
  });
  qClear.addEventListener("click", function () { qInput.value = ""; runSearch(); qInput.focus(); });
  $("#searchBtn").addEventListener("click", function () {
    var y = window.scrollY + $("#catbar").getBoundingClientRect().top - document.getElementById("header").offsetHeight - 8;
    window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
    setTimeout(function () { qInput.focus(); }, reduceMotion ? 0 : 450);
  });

  /* ---------- Especiales de la casa ---------- */
  function renderSpecials() {
    var sp = items.filter(function (i) { return i.s; });
    var wrap = $("#spotGrid");
    if (!sp.length) { $("#especiales").hidden = true; return; }
    wrap.innerHTML = sp.map(function (it, k) {
      var b = brandById[it.b];
      var price = it.p ? '<p class="price">' + money(it.p) + "</p>" : '<p class="price ask">Consultar precio</p>';
      return (
        '<article class="spot reveal" style="--d:' + (k * 0.08) + 's" data-open="' + esc(it.id) + '">' +
          '<div class="ph"><span class="ribbon">Especial</span><img src="' + esc(it.i) + '" alt="' + esc(it.n) + '" loading="lazy" decoding="async"></div>' +
          '<div class="tx"><span class="bn">' + esc(b ? b.name : "") + "</span><h3>" + esc(it.n) + "</h3>" + price +
          '<a class="buy" href="' + waItem(it) + '" target="_blank" rel="noopener">' + WA_ICON + "<span>COMPRAR YA</span></a>" +
          '<p class="pay">Pago solo por transferencia</p></div>' +
        "</article>"
      );
    }).join("");
    observe(wrap);
  }

  /* ---------- Marquee de marcas ---------- */
  function renderMarquee() {
    var track = $("#marqueeTrack");
    var one = brands.filter(function (b) { return b.logo; }).map(function (b) {
      return '<a href="#b-' + b.id + '" aria-label="' + esc(b.name) + '"><img src="' + esc(b.logo) + '" alt="' + esc(b.name) + '"></a>';
    }).join("");
    track.innerHTML = one + one;
    track.addEventListener("click", function (e) {
      var a = e.target.closest("a"); if (!a) return;
      e.preventDefault();
      var t = document.querySelector(a.getAttribute("href"));
      if (t) t.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- Órbita del hero ---------- */
  function renderOrbit() {
    var ids = ["lattafa-asad", "armaf-club-de-nuit-intense-man", "lattafa-yara-rosa", "afnan-9pm-negro", "lattafa-luxure-man", "armaf-knight-check-mate"];
    var picks = ids.map(function (id) { return itemById[id]; }).filter(Boolean);
    if (picks.length < 4) picks = items.filter(function (i) { return i.p && i.i; }).slice(0, 6);
    var n = picks.length;
    $("#orbit").innerHTML = picks.map(function (it, k) {
      var sz = k % 2 ? 19 : 23, R = k % 2 ? 43 : 39;
      return '<div class="o" style="--a:' + Math.round((360 / n) * k) + 'deg;--r:' + Math.round(R / sz * 100) + '%;--s:' + sz + '%"><span><img src="' + esc(it.i) + '" alt="" loading="eager"></span></div>';
    }).join("");
  }

  /* ---------- Cifras (contador) ---------- */
  function countUp(el, to) {
    if (reduceMotion) { el.textContent = to; return; }
    var t0 = null, dur = 1600;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function stats() {
    var nBrands = brands.filter(function (b) { return b.id !== "kits-y-sets-de-regalo" && b.id !== "body-sprays"; }).length;
    countUp($("#statItems"), items.length);
    countUp($("#statBrands"), nBrands);
  }

  /* ---------- Vista rápida ---------- */
  var modal = $("#modal");
  var lastFocus = null;
  function openModal(id) {
    var it = itemById[id]; if (!it) return;
    var b = brandById[it.b];
    $("#mImg").src = it.i;
    $("#mImg").alt = it.n;
    $("#mBrand").textContent = (b ? b.name : "") + (it.t ? " · " + it.t : "");
    $("#mTitle").textContent = it.n;
    $("#mPrice").textContent = it.p ? money(it.p) : "Consultar precio";
    $("#mBuy").href = waItem(it);
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    $(".modal-x", modal).focus();
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) { closeModal(); return; }
    if (e.target.closest(".buy")) return;
    var o = e.target.closest("[data-open]");
    if (o) openModal(o.getAttribute("data-open"));
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) closeModal();
    if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches(".ph[data-open]")) {
      e.preventDefault(); openModal(e.target.getAttribute("data-open"));
    }
  });

  /* ---------- Efecto 3D en tarjetas (solo ratón) ---------- */
  if (finePointer && !reduceMotion) {
    document.addEventListener("mousemove", function (e) {
      var ph = e.target.closest && e.target.closest(".card .ph");
      if (!ph) return;
      var img = ph.querySelector("img"); if (!img) return;
      var r = ph.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      img.style.transform = "scale(1.1) rotateY(" + (x * 14) + "deg) rotateX(" + (-y * 14) + "deg) translate(" + (x * 6) + "px," + (y * 6) + "px)";
    });
    document.addEventListener("mouseout", function (e) {
      var ph = e.target.closest && e.target.closest(".card .ph");
      if (!ph || ph.contains(e.relatedTarget)) return;
      var img = ph.querySelector("img"); if (img) img.style.transform = "";
    });
  }

  /* ---------- Cursor con brillo ---------- */
  var glow = $("#glow");
  if (finePointer && !reduceMotion) {
    window.addEventListener("mousemove", function (e) {
      glow.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)";
      glow.classList.add("on");
    }, { passive: true });
    document.addEventListener("mouseleave", function () { glow.classList.remove("on"); });
  }

  /* ---------- Parallax del hero ---------- */
  var art = $("#heroArt");
  if (finePointer && !reduceMotion && art) {
    $(".hero").addEventListener("mousemove", function (e) {
      var r = art.getBoundingClientRect();
      var x = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
      var y = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
      art.style.transform = "perspective(900px) rotateY(" + (x * 14) + "deg) rotateX(" + (-y * 14) + "deg)";
    });
    $(".hero").addEventListener("mouseleave", function () { art.style.transform = ""; });
  }

  /* ---------- Polvo dorado (canvas) ---------- */
  function dust() {
    var c = $("#dust"); if (!c || reduceMotion) return;
    var ctx = c.getContext("2d");
    var W, H, P = [], dpr = Math.min(window.devicePixelRatio || 1, 2), running = true;
    function size() {
      var r = c.getBoundingClientRect();
      W = r.width; H = r.height;
      c.width = W * dpr; c.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(70, Math.max(26, W / 22)));
      P = [];
      for (var i = 0; i < n; i++) P.push(mk(true));
    }
    function mk(init) {
      return {
        x: Math.random() * W, y: init ? Math.random() * H : H + 10,
        r: Math.random() * 1.8 + 0.4, v: Math.random() * 0.35 + 0.1,
        dx: (Math.random() - 0.5) * 0.25, a: Math.random() * Math.PI * 2, s: Math.random() * 0.02 + 0.006
      };
    }
    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < P.length; i++) {
        var p = P[i];
        p.y -= p.v; p.x += p.dx + Math.sin(p.a) * 0.15; p.a += p.s;
        if (p.y < -10) P[i] = mk(false);
        var tw = 0.35 + 0.65 * Math.abs(Math.sin(p.a * 2));
        ctx.beginPath();
        ctx.fillStyle = "rgba(243,217,154," + (0.55 * tw).toFixed(3) + ")";
        ctx.shadowColor = "rgba(212,175,98,.9)"; ctx.shadowBlur = 8;
        ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    size();
    window.addEventListener("resize", size);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        var vis = en[0].isIntersecting;
        if (vis && !running) { running = true; frame(); }
        running = vis;
      }).observe(c);
    }
    frame();
  }

  /* ---------- Encabezado, progreso y WhatsApp flotante ---------- */
  var header = $("#header"), progress = $("#progress"), nav = $("#nav"), burger = $("#burger");
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("stuck", y > 20);
    var h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); }
  });
  var tip = $(".wa-tip");
  setTimeout(function () { tip.classList.add("show"); setTimeout(function () { tip.classList.remove("show"); }, 5200); }, 3500);

  /* ---------- Inicio ---------- */
  renderSections();
  renderChips();
  trackActiveChip();
  renderSpecials();
  renderMarquee();
  renderOrbit();
  stats();
  observe(document);
  dust();
})();
