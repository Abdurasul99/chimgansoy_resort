/* Новогоднее демо CHIMGAN DARBAZA: языки, отсчёт, гирлянда, снежный шар и
   лёгкий снег по странице. Без библиотек: страница должна открываться
   мгновенно и с мобильного интернета в горах. */
(() => {
  "use strict";

  const SITE = "https://chimgandarbaza.uz";
  // Полночь 1 января 2027 по Ташкенту (UTC+5) = 19:00 UTC 31 декабря.
  const NEW_YEAR = Date.UTC(2026, 11, 31, 19, 0, 0);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = window.matchMedia("(hover: none)").matches;

  // ─── Тексты ─────────────────────────────────────────────────────
  const T = {
    ru: {
      docTitle: "Новый год в горах Чимгана — CHIMGAN DARBAZA (демо)",
      navRooms: "Номера", navTubing: "Тюбинг", navRestaurant: "Ресторан",
      bookShort: "Забронировать", book: "Забронировать на праздники", call: "Позвонить",
      title: "Новый год в горах Чимгана",
      lead: "Домик в горах, огни на склоне и тишина после полуночи. Встречайте 2027-й в CHIMGAN DARBAZA.",
      until: "До Нового года", happy: "С Новым 2027 годом!",
      shake: "Встряхнуть шар",
      hintDesk: "Потяните шар мышкой — пойдёт снег",
      hintTouch: "Проведите по шару или встряхните телефон",
      globeAlt: "Снежный шар: CHIMGAN DARBAZA вечером, огни в долине",
      lightsToggle: "Сменить огни гирлянды",
      staysTitle: "Где встретить праздник",
      chalet: "Шале", chaletText: "Большой дом для семьи или компании: спальни, кухня и терраса с видом на горы.",
      glamping: "Глэмпинг A-frame", glampingText: "Отдельные домики A-frame с гостиничным комфортом и панорамным окном.",
      tubing: "Тюбинг в огнях", tubingText: "Трасса 160 метров, вечером подсвечена по всей длине.",
      more: "Подробнее",
      demo: "Демо новогоднего оформления. Настоящий сайт — chimgandarbaza.uz",
      units: { d: ["день", "дня", "дней"], h: ["час", "часа", "часов"], m: ["минута", "минуты", "минут"], s: ["секунда", "секунды", "секунд"] },
    },
    uz: {
      docTitle: "Chimyon tog'larida Yangi yil — CHIMGAN DARBAZA (demo)",
      navRooms: "Xonalar", navTubing: "Tyubing", navRestaurant: "Restoran",
      bookShort: "Bron qilish", book: "Bayramga bron qilish", call: "Qo'ng'iroq qilish",
      title: "Chimyon tog'larida Yangi yil",
      lead: "Tog'dagi uycha, qiyalikdagi chiroqlar va yarim tundan keyingi sokinlik. 2027-yilni CHIMGAN DARBAZA'da kutib oling.",
      until: "Yangi yilgacha", happy: "Yangi 2027-yil muborak!",
      shake: "Sharni silkitish",
      hintDesk: "Sharni sichqoncha bilan torting — qor yog'adi",
      hintTouch: "Shar ustidan barmoq yurgizing yoki telefonni silkiting",
      globeAlt: "Qorli shar: kechki CHIMGAN DARBAZA, vodiydagi chiroqlar",
      lightsToggle: "Gulchambar chiroqlarini almashtirish",
      staysTitle: "Bayramni qayerda kutib olasiz",
      chalet: "Shale", chaletText: "Oila yoki do'stlar uchun katta uy: yotoqxonalar, oshxona va tog'larga qaragan terrasa.",
      glamping: "Glemping A-frame", glampingText: "Mehmonxona qulayligiga ega, panoramali derazali alohida A-frame uychalari.",
      tubing: "Chiroqlardagi tyubing", tubingText: "160 metrlik trassa, kechqurun butun uzunligi bo'ylab yoritiladi.",
      more: "Batafsil",
      demo: "Yangi yil bezagining demo-versiyasi. Asosiy sayt — chimgandarbaza.uz",
      units: { d: ["kun"], h: ["soat"], m: ["daqiqa"], s: ["soniya"] },
    },
    en: {
      docTitle: "New Year in the Chimgan mountains — CHIMGAN DARBAZA (demo)",
      navRooms: "Rooms", navTubing: "Tubing", navRestaurant: "Restaurant",
      bookShort: "Book", book: "Book for the holidays", call: "Call",
      title: "New Year in the Chimgan mountains",
      lead: "A cabin in the mountains, lights on the slope and the quiet after midnight. See in 2027 at CHIMGAN DARBAZA.",
      until: "Until the New Year", happy: "Happy New Year 2027!",
      shake: "Shake the globe",
      hintDesk: "Drag the globe with your mouse to make it snow",
      hintTouch: "Swipe across the globe or shake your phone",
      globeAlt: "Snow globe: CHIMGAN DARBAZA in the evening, lights in the valley",
      lightsToggle: "Change the garland lights",
      staysTitle: "Where to see in the New Year",
      chalet: "Chalet", chaletText: "A big house for a family or friends: bedrooms, a kitchen and a terrace facing the mountains.",
      glamping: "A-frame Glamping", glampingText: "Standalone A-frame cabins with hotel-level comfort and a panoramic window.",
      tubing: "Tubing under the lights", tubingText: "A 160-metre track, lit end to end in the evening.",
      more: "Details",
      demo: "New Year design demo. The real website is chimgandarbaza.uz",
      units: { d: ["day", "days"], h: ["hour", "hours"], m: ["minute", "minutes"], s: ["second", "seconds"] },
    },
  };

  function pickLang() {
    const q = new URLSearchParams(location.search).get("lang");
    if (q && T[q]) return q;
    try {
      const saved = localStorage.getItem("ny-lang");
      if (saved && T[saved]) return saved;
    } catch { /* хранилище закрыто — не страшно */ }
    const nav = (navigator.language || "ru").slice(0, 2);
    return nav === "uz" ? "uz" : nav === "en" ? "en" : "ru";
  }

  let lang = pickLang();

  function plural(forms, n) {
    if (forms.length === 1) return forms[0];
    if (forms.length === 2) return n === 1 ? forms[0] : forms[1];
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return forms[0];
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1];
    return forms[2];
  }

  function applyLang(next) {
    lang = next;
    const t = T[lang];
    document.documentElement.lang = lang;
    document.title = t.docTitle;
    document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t[el.dataset.i18n]; });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t[el.dataset.i18nAria]); });
    document.querySelectorAll("[data-href]").forEach((el) => {
      const path = el.dataset.href === "/" ? "" : el.dataset.href;
      el.href = `${SITE}/${lang}${path}`;
    });
    const hint = document.querySelector(".hint");
    if (hint) hint.textContent = touch ? t.hintTouch : t.hintDesk;
    document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    try { localStorage.setItem("ny-lang", lang); } catch { /* хранилище закрыто */ }
    tick();
  }

  document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => applyLang(b.dataset.lang)));

  // ─── Отсчёт ─────────────────────────────────────────────────────
  const unitEls = {};
  document.querySelectorAll("[data-unit]").forEach((el) => { unitEls[el.dataset.unit] = el; });
  const labelEls = {};
  document.querySelectorAll("[data-unit-label]").forEach((el) => { labelEls[el.dataset.unitLabel] = el; });
  let celebrated = false;

  function tick() {
    const left = Math.max(0, NEW_YEAR - Date.now());
    if (left === 0) {
      document.querySelector(".countdown__grid").hidden = true;
      document.querySelector(".countdown__label").hidden = true;
      document.querySelector(".countdown__done").hidden = false;
      if (!celebrated) { celebrated = true; if (globe) globe.shake(0, -900, 1.6); }
      return;
    }
    const s = Math.floor(left / 1000);
    const parts = { d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 };
    for (const k of Object.keys(parts)) {
      const v = k === "d" ? String(parts[k]) : String(parts[k]).padStart(2, "0");
      if (unitEls[k].textContent !== v) unitEls[k].textContent = v;
      labelEls[k].textContent = plural(T[lang].units[k], parts[k]);
    }
  }
  setInterval(tick, 1000);

  // ─── Гирлянда ───────────────────────────────────────────────────
  const PALETTES = [
    ["#ffd27a", "#ffc25c", "#ffe3a6", "#ffb347"],          // тёплые
    ["#ff5d5d", "#ffd27a", "#58d68d", "#5aa9ff", "#ff8fd1"], // разноцветные
    ["#eaf4ff", "#cfe6ff", "#ffffff"],                     // снежные
  ];
  let palette = 0;
  const svg = document.querySelector(".garland");
  const NS = "http://www.w3.org/2000/svg";

  function drawGarland() {
    const w = document.documentElement.clientWidth;
    svg.setAttribute("viewBox", `0 0 ${w} 34`);
    svg.textContent = "";
    const spans = Math.max(2, Math.round(w / 360));
    const step = w / spans;
    let d = "M0 2";
    for (let i = 0; i < spans; i++) d += ` Q${step * i + step / 2} 30 ${step * (i + 1)} 2`;
    const wire = document.createElementNS(NS, "path");
    wire.setAttribute("d", d);
    wire.setAttribute("class", "wire");
    svg.appendChild(wire);
    const len = wire.getTotalLength();
    const count = Math.round(w / 46);
    const colors = PALETTES[palette];
    for (let i = 0; i < count; i++) {
      const p = wire.getPointAtLength((len / count) * (i + 0.5));
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "bulb");
      g.setAttribute("transform", `translate(${p.x} ${p.y})`);
      const color = colors[i % colors.length];
      g.style.color = color;
      const cap = document.createElementNS(NS, "rect");
      cap.setAttribute("x", "-2.5"); cap.setAttribute("y", "0"); cap.setAttribute("width", "5"); cap.setAttribute("height", "4"); cap.setAttribute("rx", "1");
      const glass = document.createElementNS(NS, "ellipse");
      glass.setAttribute("cx", "0"); glass.setAttribute("cy", "9"); glass.setAttribute("rx", "4.2"); glass.setAttribute("ry", "6");
      glass.setAttribute("fill", color);
      glass.style.setProperty("--d", `${(Math.random() * 2.4).toFixed(2)}s`);
      glass.style.setProperty("--t", `${(1.8 + Math.random() * 1.8).toFixed(2)}s`);
      g.append(cap, glass);
      svg.appendChild(g);
    }
  }
  drawGarland();
  let resizeTimer;
  window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(drawGarland, 150); });
  document.querySelector(".lights").addEventListener("click", () => {
    palette = (palette + 1) % PALETTES.length;
    drawGarland();
  });

  // ─── Снежинка-спрайт: рисуется один раз, дальше только копируется ───
  function flakeSprite(size) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    const r = size / 2;
    const grad = g.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.45, "rgba(255,255,255,0.85)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    return c;
  }
  const SPRITE = flakeSprite(32);
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  // ─── Снежный шар ────────────────────────────────────────────────
  function SnowGlobe(canvas, host) {
    const ctx = canvas.getContext("2d");
    let W = 0, R = 0, cx = 0, cy = 0;
    const N = reduced ? 140 : 320;
    const flakes = [];
    let running = true;
    let visible = true;

    function resize() {
      const box = canvas.getBoundingClientRect();
      W = box.width;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(W * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      R = W / 2; cx = R; cy = R;
    }
    resize();

    // Сначала снег лежит на дне шара.
    for (let i = 0; i < N; i++) {
      const a = Math.PI * (0.18 + Math.random() * 0.64);
      const dist = R * (0.78 + Math.random() * 0.16);
      flakes.push({
        x: cx + Math.cos(a) * dist * (0.4 + Math.random() * 0.6),
        y: cy + Math.sin(a) * dist,
        vx: 0, vy: 0,
        r: 1 + Math.random() * 2.6,
        phase: Math.random() * Math.PI * 2,
        rest: true,
      });
    }

    function shake(ix, iy, power = 1) {
      // Каждое встряхивание закручивает воду в свою сторону.
      const spin = Math.random() < 0.5 ? -1 : 1;
      for (const f of flakes) {
        f.rest = false;
        const k = (0.5 + Math.random()) * power;
        const dx = f.x - cx, dy = f.y - cy;
        const d = Math.hypot(dx, dy) || 1;
        f.vx += (ix * 0.35 + (Math.random() - 0.5) * 520 + (-dy / d) * 160 * spin) * k;
        f.vy += (iy * 0.35 - 90 - Math.random() * 300 + (dx / d) * 160 * spin) * k;
      }
      wake();
    }

    let last = performance.now();
    let raf = 0;
    function frame(now) {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, W, W);
      let moving = 0;
      const terminal = reduced ? 22 : 38;
      for (const f of flakes) {
        if (!f.rest) {
          moving++;
          f.vy += 60 * dt;                          // тяжесть, как в воде шара
          f.vx *= Math.pow(0.18, dt);               // вязкость
          f.vy = f.vy > terminal ? terminal + (f.vy - terminal) * Math.pow(0.05, dt) : f.vy * Math.pow(0.35, dt);
          f.phase += dt * 1.6;
          f.x += (f.vx + Math.sin(f.phase) * 10) * dt;
          f.y += f.vy * dt;
          // Стекло: снег не вылетает за круг.
          const dx = f.x - cx, dy = f.y - cy;
          const lim = R - f.r - 3;
          const dist = Math.hypot(dx, dy);
          if (dist > lim) {
            const nx = dx / dist, ny = dy / dist;
            f.x = cx + nx * lim; f.y = cy + ny * lim;
            const dot = f.vx * nx + f.vy * ny;
            f.vx -= 1.6 * dot * nx; f.vy -= 1.6 * dot * ny;
            // Улёгся на дно.
            if (ny > 0.55 && Math.abs(f.vy) < 46 && Math.abs(f.vx) < 46) { f.rest = true; f.vx = f.vy = 0; }
          }
        }
        const s = f.r * 2.4;
        ctx.globalAlpha = f.rest ? 0.75 : 0.95;
        ctx.drawImage(SPRITE, f.x - s / 2, f.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      if (moving > 0 && running && visible) raf = requestAnimationFrame(frame);
    }
    function wake() {
      if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(frame); }
    }
    frame(performance.now());

    window.addEventListener("resize", () => { resize(); wake(); });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake(); }).observe(host);
    document.addEventListener("visibilitychange", () => { running = !document.hidden; if (running) wake(); });

    return { shake };
  }

  const globeEl = document.querySelector(".globe");
  const globe = SnowGlobe(document.querySelector(".globe__snow"), globeEl);

  // Тянуть шар: наклон за рукой, снег — по скорости движения.
  let drag = null;
  globeEl.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
    globeEl.setPointerCapture(e.pointerId);
    globeEl.classList.add("is-dragging");
  });
  globeEl.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const now = performance.now();
    const dt = Math.max(16, now - drag.t) / 1000;
    const vx = (e.clientX - drag.x) / dt;
    const vy = (e.clientY - drag.y) / dt;
    drag.x = e.clientX; drag.y = e.clientY; drag.t = now;
    const tilt = Math.max(-14, Math.min(14, vx / 90));
    globeEl.style.transform = `rotate(${tilt}deg) translate(${Math.max(-18, Math.min(18, vx / 60))}px, ${Math.max(-12, Math.min(12, vy / 80))}px)`;
    if (Math.hypot(vx, vy) > 280) globe.shake(vx, vy, 0.22);
  });
  const release = () => {
    if (!drag) return;
    drag = null;
    globeEl.classList.remove("is-dragging");
    globeEl.style.transform = "";
  };
  globeEl.addEventListener("pointerup", release);
  globeEl.addEventListener("pointercancel", release);

  // Кнопка и встряхивание телефона. На iPhone датчик движения просит
  // разрешение — его можно спросить только по нажатию.
  let motionOn = false;
  function listenMotion() {
    if (motionOn) return;
    motionOn = true;
    let lastShake = 0;
    window.addEventListener("devicemotion", (e) => {
      const a = e.acceleration || e.accelerationIncludingGravity;
      if (!a) return;
      const m = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
      const now = Date.now();
      if (m > (e.acceleration ? 14 : 24) && now - lastShake > 350) {
        lastShake = now;
        globe.shake((a.x || 0) * -40, (a.y || 0) * 40, 0.9);
      }
    });
  }
  function shakeButton() {
    globeEl.animate(
      [{ transform: "rotate(0)" }, { transform: "rotate(-9deg)" }, { transform: "rotate(8deg)" }, { transform: "rotate(-5deg)" }, { transform: "rotate(0)" }],
      { duration: reduced ? 1 : 700, easing: "ease-in-out" },
    );
    globe.shake(0, -600, 1.2);
    const DM = window.DeviceMotionEvent;
    if (DM && typeof DM.requestPermission === "function") {
      DM.requestPermission().then((r) => { if (r === "granted") listenMotion(); }).catch(() => {});
    }
  }
  document.querySelector(".shake").addEventListener("click", shakeButton);
  if (window.DeviceMotionEvent && typeof window.DeviceMotionEvent.requestPermission !== "function") listenMotion();

  // Одна сцена при загрузке: шар сам встряхивается — снег поднимается.
  if (!reduced) setTimeout(() => globe.shake(0, -500, 1.1), 700);

  // ─── Снег по странице: редкий, ветер — за мышью ─────────────────
  (function ambient() {
    const canvas = document.querySelector(".ambient");
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0;
    const N = reduced ? 0 : Math.min(90, Math.round(window.innerWidth / 14));
    const flakes = [];
    let wind = 0, targetWind = 0, lastX = null;

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < N; i++) {
      flakes.push({ x: Math.random() * W, y: Math.random() * H, r: 0.8 + Math.random() * 2.2, v: 18 + Math.random() * 38, p: Math.random() * 6.28 });
    }
    window.addEventListener("pointermove", (e) => {
      if (lastX !== null) targetWind = Math.max(-120, Math.min(120, (e.clientX - lastX) * 6));
      lastX = e.clientX;
    }, { passive: true });

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      wind += (targetWind - wind) * Math.min(1, dt * 2);
      targetWind *= Math.pow(0.3, dt);
      ctx.clearRect(0, 0, W, H);
      for (const f of flakes) {
        f.p += dt;
        f.y += f.v * dt;
        f.x += (Math.sin(f.p) * 12 + wind * (f.r / 2)) * dt;
        if (f.y > H + 6) { f.y = -6; f.x = Math.random() * W; }
        if (f.x > W + 6) f.x = -6;
        if (f.x < -6) f.x = W + 6;
        const s = f.r * 2.6;
        ctx.globalAlpha = 0.35 + f.r / 6;
        ctx.drawImage(SPRITE, f.x - s / 2, f.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      if (!document.hidden) requestAnimationFrame(frame);
    }
    if (N > 0) {
      requestAnimationFrame(frame);
      document.addEventListener("visibilitychange", () => { if (!document.hidden) { last = performance.now(); requestAnimationFrame(frame); } });
    }
  })();

  applyLang(lang);
})();
