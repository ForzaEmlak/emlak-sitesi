/* ============================================================
   FORZA REAL ESTATE — Etkileşim (ilanlar.json'dan veri okur)
   ============================================================ */
(function () {
  "use strict";

  let ILANLAR = [];
  let aktifFiltre = "all";

  const grid = document.getElementById("listingGrid");
  const noResult = document.getElementById("noResult");

  const bedSVG  = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M21 10V8a2 2 0 0 0-2-2h-5V5a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v13h2v-3h12v3h2v-5a2 2 0 0 0-2-3z"/></svg>';
  const bathSVG = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M6 12V6a2 2 0 0 1 2-2 2 2 0 0 1 2 2"/></svg>';
  const areaSVG = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3z"/><path d="M3 9h18M9 3v18"/></svg>';

  function fmtFiyat(il) {
    const n = Number(il.fiyat || 0).toLocaleString("tr-TR");
    return il.islem === "kiralik" ? `${n} ₺ <span style="color:var(--muted)">/ ay</span>` : `${n} ₺`;
  }
  function metaHTML(il) {
    if (il.tur === "arsa" || il.tur === "ofis") return `<span>${areaSVG} ${il.m2} m²</span>`;
    return `<span>${bedSVG} ${il.oda}</span><span>${bathSVG} ${il.banyo} Banyo</span><span>${areaSVG} ${il.m2} m²</span>`;
  }
  function kapak(il) { return (il.fotolar && il.fotolar[0]) ? il.fotolar[0] : ""; }

  function kartHTML(il) {
    const badge = il.vip
      ? '<span class="card-badge" style="color:var(--gold-2);border-color:var(--gold)">★ Ayrıcalıklı</span>'
      : `<span class="card-badge">${il.islem === "kiralik" ? "Kiralık" : "Satılık"}</span>`;
    return `
      <a class="card" href="ilan.html?id=${encodeURIComponent(il.id)}" data-islem="${il.islem}" data-tur="${il.tur}">
        ${badge}
        <button type="button" class="card-share" data-id="${il.id}" data-baslik="${(il.baslik||"").replace(/"/g,"&quot;")}" aria-label="İlanı paylaş" title="Paylaş">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>
        </button>
        <img class="ph" src="${kapak(il)}" alt="${il.baslik} — ${il.konum}" loading="lazy" />
        <div class="ph-fallback"></div>
        <div class="card-body">
          <div class="card-meta">${metaHTML(il)}</div>
          <h3 class="card-title">${il.baslik}</h3>
          <p class="card-price">${il.konum} · <b>${fmtFiyat(il)}</b></p>
        </div>
      </a>`;
  }

  function paylas(id, baslik) {
    const url = new URL("ilan.html?id=" + encodeURIComponent(id), location.href).href;
    const data = { title: baslik || "Forza Gayrimenkul", text: (baslik || "İlan") + " · Forza Gayrimenkul", url: url };
    if (navigator.share) { navigator.share(data).catch(() => {}); }
    else if (navigator.clipboard) { navigator.clipboard.writeText(url).then(() => alert("İlan bağlantısı kopyalandı:\n" + url)); }
    else { window.open("https://wa.me/?text=" + encodeURIComponent(data.text + " " + url), "_blank"); }
  }
  if (grid) grid.addEventListener("click", e => {
    const sb = e.target.closest(".card-share");
    if (!sb) return;
    e.preventDefault(); e.stopPropagation();
    paylas(sb.dataset.id, sb.dataset.baslik);
  });

  function render(list) {
    if (!grid) return;
    grid.innerHTML = list.map(kartHTML).join("");
    if (noResult) noResult.hidden = list.length !== 0;
    grid.querySelectorAll(".card").forEach((c, i) => {
      cardObserver.observe(c);
      c.style.transitionDelay = (i % 3) * 80 + "ms";
    });
  }
  function uygula() {
    const f = ILANLAR.filter(il => {
      if (aktifFiltre === "all") return true;
      if (aktifFiltre === "satilik" || aktifFiltre === "kiralik") return il.islem === aktifFiltre;
      return il.tur === aktifFiltre;
    });
    render(f);
  }

  /* Filtre sekmeleri */
  document.querySelectorAll(".filter-tabs .tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelector(".filter-tabs .tab.active")?.classList.remove("active");
      tab.classList.add("active");
      aktifFiltre = tab.dataset.filter;
      uygula();
    });
  });

  /* Arama */
  const searchBoxEl = document.getElementById("searchBox");
  if (searchBoxEl) searchBoxEl.addEventListener("submit", e => {
    e.preventDefault();
    const islem = document.getElementById("f-islem").value;
    const tur = document.getElementById("f-tur").value;
    const konum = document.getElementById("f-konum").value;
    const kelime = document.getElementById("f-kelime").value.trim().toLowerCase();
    const map = { kadikoy: "kadıköy", besiktas: "beşiktaş", sariyer: "sarıyer", atasehir: "ataşehir", ayvalik: "ayvalık" };
    const sonuc = ILANLAR.filter(il => {
      if (islem && il.islem !== islem) return false;
      if (tur && il.tur !== tur) return false;
      if (konum && !il.konum.toLowerCase().includes(map[konum] || konum)) return false;
      if (kelime) { const h = (il.baslik + " " + (il.etiket || "") + " " + il.konum).toLowerCase(); if (!h.includes(kelime)) return false; }
      return true;
    });
    document.querySelector(".filter-tabs .tab.active")?.classList.remove("active");
    document.querySelector('.tab[data-filter="all"]')?.classList.add("active");
    aktifFiltre = "all";
    render(sonuc);
    document.getElementById("ilanlar")?.scrollIntoView({ behavior: "smooth" });
  });

  /* Reveal */
  const revealObserver = new IntersectionObserver((es) => {
    es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); revealObserver.unobserve(en.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));
  const cardObserver = new IntersectionObserver((es) => {
    es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); cardObserver.unobserve(en.target); } });
  }, { threshold: 0.1 });

  /* Sayaç */
  function sayac(el) {
    const hedef = +el.dataset.target, sure = 1600, start = performance.now();
    function tick(now) { const p = Math.min((now - start) / sure, 1), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.floor(e * hedef).toLocaleString("tr-TR"); if (p < 1) requestAnimationFrame(tick); else el.textContent = hedef.toLocaleString("tr-TR"); }
    requestAnimationFrame(tick);
  }
  const statObserver = new IntersectionObserver((es) => { es.forEach(en => { if (en.isIntersecting) { sayac(en.target); statObserver.unobserve(en.target); } }); }, { threshold: 0.5 });
  document.querySelectorAll(".stat-num").forEach(el => statObserver.observe(el));

  /* Header & mobil menü */
  const header = document.getElementById("header");
  if (header) { const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40); window.addEventListener("scroll", onScroll, { passive: true }); onScroll(); }
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("mainNav");
  if (toggle && nav) {
    const closeMenu = () => { nav.classList.remove("open"); toggle.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); };
    toggle.addEventListener("click", () => { const a = nav.classList.toggle("open"); toggle.classList.toggle("open", a); toggle.setAttribute("aria-expanded", a ? "true" : "false"); });
    nav.querySelectorAll("a").forEach(a => a.addEventListener("click", closeMenu));
  }

  /* Form (Netlify) */
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  if (form) form.addEventListener("submit", e => {
    e.preventDefault();
    const ad = form.ad.value.trim(), tel = form.tel.value.trim(), email = form.email.value.trim();
    if (!ad || !tel || !email) { status.textContent = "Lütfen zorunlu alanları doldurun."; status.className = "form-status err"; return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { status.textContent = "Geçerli bir e-posta adresi girin."; status.className = "form-status err"; return; }
    status.textContent = "Gönderiliyor..."; status.className = "form-status";
    fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(new FormData(form)).toString() })
      .then(() => { status.textContent = "Teşekkürler " + ad + "! Talebiniz alındı, en kısa sürede dönüş yapacağız."; status.className = "form-status ok"; form.reset(); })
      .catch(() => { status.textContent = "Bir sorun oluştu. Lütfen telefonla ulaşın: (532) 305 66 56"; status.className = "form-status err"; });
  });

  /* İlanları yükle */
  fetch("ilanlar.json", { cache: "no-store" })
    .then(r => r.json())
    .then(d => { ILANLAR = (d && d.ilanlar) ? d.ilanlar : []; uygula(); })
    .catch(() => { if (noResult) { noResult.hidden = false; noResult.textContent = "İlanlar yüklenemedi."; } });
})();
