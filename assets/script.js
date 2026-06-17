/* ============================================================
   Interactions — vanilla JS
   ============================================================ */
(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- day / night ---------- */
  const root = document.documentElement;
  const saved = localStorage.getItem("vz-theme");
  if (saved) root.setAttribute("data-theme", saved);
  const toggle = document.querySelector(".toggle");
  toggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "night" ? "day" : "night";
    root.setAttribute("data-theme", next);
    localStorage.setItem("vz-theme", next);
  });

  /* ---------- nav scrolled border + scroll-spy active link ---------- */
  const nav = document.querySelector(".nav");
  const onScrollNav = () => nav.classList.toggle("scrolled", window.scrollY > 12);
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  /* scroll-spy ловит ссылки И в десктопной шапке, И в мобильном оверлее */
  const spyLinks = [...document.querySelectorAll(".nav-links a[data-spy], .mobile-nav-list a[data-spy]")];
  const spySections = spyLinks
    .map((a) => document.getElementById(a.dataset.spy))
    .filter(Boolean);
  function spy() {
    const y = window.scrollY + window.innerHeight * 0.34;
    let current = spySections[0] ? spySections[0].id : null;
    for (const s of spySections) {
      const top = s.getBoundingClientRect().top + window.scrollY;
      if (top <= y) current = s.id;
    }
    /* Если страница доскроллена до низа — принудительно активируем последнюю секцию.
       Иначе на коротких финальных блоках (например, «Контакты» на мобильной), которые
       не дотягивают до триггерной зоны 34% сверху, в навигации остаётся подсвечен предыдущий. */
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
    if (atBottom && spySections.length) current = spySections[spySections.length - 1].id;
    spyLinks.forEach((a) => a.classList.toggle("active", a.dataset.spy === current));
  }
  spy();
  window.addEventListener("scroll", spy, { passive: true });
  window.addEventListener("resize", spy);

  /* ---------- мобильное меню (бургер) ---------- */
  const burgerBtn = document.getElementById("burgerBtn");
  const mobileNav = document.getElementById("mobileNav");
  if (burgerBtn && mobileNav) {
    function openMobileNav() {
      document.body.classList.add("nav-open");
      burgerBtn.classList.add("open");
      burgerBtn.setAttribute("aria-expanded", "true");
      mobileNav.classList.add("open");
      mobileNav.setAttribute("aria-hidden", "false");
    }
    function closeMobileNav() {
      document.body.classList.remove("nav-open");
      burgerBtn.classList.remove("open");
      burgerBtn.setAttribute("aria-expanded", "false");
      mobileNav.classList.remove("open");
      mobileNav.setAttribute("aria-hidden", "true");
    }
    burgerBtn.addEventListener("click", () => {
      burgerBtn.classList.contains("open") ? closeMobileNav() : openMobileNav();
    });
    /* тап по ссылке внутри оверлея → закрыть (ссылка сама проскроллит к якорю);
       тап по пустой области оверлея (target === сам оверлей) → тоже закрыть */
    mobileNav.addEventListener("click", (e) => {
      if (e.target.closest("a") || e.target === mobileNav) closeMobileNav();
    });
    /* Esc закрывает меню — привычное поведение для оверлеев */
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mobileNav.classList.contains("open")) closeMobileNav();
    });
    /* если окно расширилось до десктопа, пока меню было открыто — закрываем */
    window.addEventListener("resize", () => {
      if (window.innerWidth > 720 && mobileNav.classList.contains("open")) closeMobileNav();
    });
  }

  /* ---------- parallax ----------
     ДЕСКТОП (есть hover) — mouse-параллакс. Две инерционные группы (fast/slow)
     + individuals со своей ease. Объекты движутся «не в такт» = ощущение глубины.

     ТАЧ (нет hover) — scroll-параллакс. При скролле страницы элементы слегка
     «отстают» от движения (визуально остаются позади), потом плавно возвращаются
     на места. Только по вертикали. Та же идея глубины, активатор — палец вместо курсора.
  ---------------------------------------- */
  const allParallax = [...document.querySelectorAll("[data-parallax]")];
  const fast = [], slow = [], individuals = [];
  allParallax.forEach((el) => {
    if (el.classList.contains("section-title-shift")) slow.push(el);
    else if (el.dataset.ease) {
      individuals.push({ el, depth: parseFloat(el.dataset.depth || "1"), ease: parseFloat(el.dataset.ease), cx: 0, cy: 0 });
    }
    else fast.push(el);
  });
  document.querySelectorAll(".case .media").forEach((m) => {
    if (!m.dataset.depth) m.dataset.depth = "0.55";
    fast.push(m);
  });
  document.querySelectorAll(".case .shot").forEach((s, i) => {
    s.dataset.depth = (0.85 + (i % 3) * 0.22).toFixed(2);
    fast.push(s);
  });

  /* Детект «настоящий десктоп с мышью / трекпадом»: есть точный pointer И нет тача нигде.
     Надёжнее, чем (hover: hover) — Apple ломает hover на iPadOS 13+ (всегда true),
     а DevTools-эмуляторы иногда подсовывают неверные значения hover. */
  const isHover = window.matchMedia("(pointer: fine) and (not (any-pointer: coarse))").matches;

  if (isHover) {
    /* --- mouse-параллакс (десктоп) --- */
    let tx = 0, ty = 0;
    let cxF = 0, cyF = 0;  // быстрый трекер курсора
    let cxS = 0, cyS = 0;  // медленный трекер
    window.addEventListener("mousemove", (e) => {
      tx = (e.clientX / window.innerWidth - 0.5);
      ty = (e.clientY / window.innerHeight - 0.5);
    });
    function rafParallax() {
      cxF += (tx - cxF) * 0.09;
      cyF += (ty - cyF) * 0.09;
      cxS += (tx - cxS) * 0.035;
      cyS += (ty - cyS) * 0.035;
      const B = 42;
      fast.forEach((f) => {
        const d = parseFloat(f.dataset.depth || "1");
        f.style.transform = `translate(${(-cxF * B * d).toFixed(1)}px, ${(-cyF * B * d).toFixed(1)}px)`;
      });
      slow.forEach((f) => {
        const d = parseFloat(f.dataset.depth || "1");
        f.style.transform = `translate(${(-cxS * B * d).toFixed(1)}px, ${(-cyS * B * d).toFixed(1)}px)`;
      });
      individuals.forEach((p) => {
        p.cx += (tx - p.cx) * p.ease;
        p.cy += (ty - p.cy) * p.ease;
        p.el.style.transform = `translate(${(-p.cx * B * p.depth).toFixed(1)}px, ${(-p.cy * B * p.depth).toFixed(1)}px)`;
      });
      requestAnimationFrame(rafParallax);
    }
    if (!reduce) rafParallax();
  } else {
    /* --- scroll-параллакс (тач) ---
       Каждое scroll-событие накапливает дельту в scrollDelta. В RAF inertia
       поглощает дельту, элементы смещаются по translateY на (inertia × depth × factor),
       inertia затухает с коэффициентом DECAY. Когда скролл остановлен — элементы
       плавно возвращаются на места.

       Ручки настройки:
         INERTIA_DECAY     — скорость затухания смещения (0.9 = ~30 кадров до 0).
         MAX_INERTIA       — потолок (защита от резких свайпов, чтобы не уехало далеко).
         FACTOR_FAST/SLOW  — общая сила эффекта по группам. */
    let lastScroll = window.scrollY;
    let scrollDelta = 0;
    window.addEventListener("scroll", () => {
      const ns = window.scrollY;
      scrollDelta += (ns - lastScroll);
      lastScroll = ns;
    }, { passive: true });

    const INERTIA_DECAY = 0.9;
    const MAX_INERTIA = 200;
    const FACTOR_FAST = 0.3;
    const FACTOR_SLOW = 0.15;
    const FACTOR_INDIVIDUAL = 0.3;
    let inertia = 0;

    function rafScrollParallax() {
      inertia += scrollDelta;
      scrollDelta = 0;
      inertia *= INERTIA_DECAY;
      if (inertia > MAX_INERTIA) inertia = MAX_INERTIA;
      if (inertia < -MAX_INERTIA) inertia = -MAX_INERTIA;

      fast.forEach((f) => {
        const d = parseFloat(f.dataset.depth || "1");
        f.style.transform = `translateY(${(inertia * d * FACTOR_FAST).toFixed(1)}px)`;
      });
      slow.forEach((f) => {
        const d = parseFloat(f.dataset.depth || "1");
        f.style.transform = `translateY(${(inertia * d * FACTOR_SLOW).toFixed(1)}px)`;
      });
      individuals.forEach((p) => {
        p.cy += (inertia - p.cy) * p.ease;
        p.el.style.transform = `translateY(${(p.cy * p.depth * FACTOR_INDIVIDUAL).toFixed(1)}px)`;
      });
      requestAnimationFrame(rafScrollParallax);
    }
    if (!reduce) rafScrollParallax();
  }

  /* ---------- фоновая дуга в cases-outro + контактах ---------- */

  /* Генерация ВОЛНИСТОЙ формы круга.
     Все параметры ниже — «ручки» для настройки внешнего вида волны.
     Координаты — в системе viewBox SVG (на FHD 1 единица ≈ 1 пиксель). */
  const ARC_RADIUS = 800;     // средний радиус круга (между гребнем и впадиной волны)
  const ARC_AMPLITUDE = 20;   // глубина волны от средней линии (горб ВЫШЕ радиуса на эту величину, впадина — НИЖЕ)
  const ARC_WAVES_MAX = 24;   // волн на FHD (≥1920) — мельче, как было изначально
  const ARC_WAVES_MIN = 20;   // волн на ≤1200 (заморозка) — крупнее, чтобы не сливались в кашу
  const ARC_CX = 550;         // центр круга по X (как в исходном <circle>)
  const ARC_CY = 750;         // центр круга по Y

  /* Адаптивная формула: от 24 на 1920 линейно к 20 на 1200, ниже 1200 — заморозка на 20.
     Округление до целого — обязательное условие, чтобы концы волны замкнулись без шва. */
  function calcWaves(w) {
    const raw = ARC_WAVES_MIN + (w - 1200) / 180;
    return Math.max(ARC_WAVES_MIN, Math.min(ARC_WAVES_MAX, Math.round(raw)));
  }

  const arcPath = document.querySelector(".deco-arc-path");
  function drawArc() {
    if (!arcPath) return;
    const waves = calcWaves(window.innerWidth);
    const steps = waves * 15; // 15 точек на горб — линия выглядит гладко
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * 2 * Math.PI;
      const r = ARC_RADIUS + ARC_AMPLITUDE * Math.sin(waves * theta);
      const x = ARC_CX + r * Math.cos(theta);
      const y = ARC_CY + r * Math.sin(theta);
      d += (i === 0 ? "M " : "L ") + x.toFixed(2) + " " + y.toFixed(2) + " ";
    }
    d += "Z";
    arcPath.setAttribute("d", d);
  }
  drawArc();
  /* Перерисовываем только при смене ориентации мобилки — на десктопе ресайз
     окна намеренно игнорируем, чтобы не было «прыжков» при перетаскивании края. */
  window.addEventListener("orientationchange", drawArc);

  /* Вращение волнистого круга при скролле */
  const arcWrap = document.querySelector(".deco-arc-wrap");
  const arcSpin = document.querySelector(".deco-arc-spin");
  if (arcWrap && arcSpin) {
    const MAX_ANGLE = 75; // полный поворот за весь проход через секцию
    let scheduledArc = false;
    function updateArc() {
      scheduledArc = false;
      const rect = arcWrap.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // Прогресс: 0 — обёртка только заходит снизу в окно; 1 — обёртка только что вышла сверху.
      // Так круг плавно вращается всё время, пока пользователь видит секцию.
      const total = vh + rect.height;
      const traveled = vh - rect.top;
      const progress = Math.max(0, Math.min(1, traveled / total));
      const angle = progress * MAX_ANGLE;
      arcSpin.setAttribute("transform", `rotate(${angle}, 550, 750)`);
    }
    function onArcScroll() {
      if (!scheduledArc) {
        scheduledArc = true;
        requestAnimationFrame(updateArc);
      }
    }
    window.addEventListener("scroll", onArcScroll, { passive: true });
    window.addEventListener("resize", onArcScroll);
    updateArc();
  }

  /* ---------- marquee ---------- */
  const track = document.querySelector(".marquee-track");
  if (track && !reduce) {
    // Сохраняем оригинальное содержимое — будем дублировать столько раз, чтобы общая
    // ширина была минимум 2× viewport (иначе на широких экранах между концом и началом
    // цикла будет пустое пространство).
    const originalHTML = track.innerHTML;
    let copies = 1;
    function ensureCopies() {
      while (track.scrollWidth < window.innerWidth * 2) {
        track.innerHTML += originalHTML;
        copies++;
      }
    }
    ensureCopies();
    let pos = 0;
    let half = track.scrollWidth / copies; // ширина одной копии
    const speed = 0.85; // 1.3× от прежней скорости 0.65

    function recalc() {
      // Пересчитываем ширину аккуратно — сохраняем относительную позицию,
      // чтобы строка не «прыгала» в момент пересчёта.
      const ratio = half > 0 ? pos / half : 0;
      ensureCopies(); // добавляем копии, если ширина окна выросла
      half = track.scrollWidth / copies;
      pos = ratio * half;
    }

    window.addEventListener("resize", recalc);
    // Главная причина рывков — шрифты Manrope подгружаются после старта анимации
    // и меняют ширину текста. Пересчитываем сразу как только шрифты готовы.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(recalc);
    }
    setTimeout(recalc, 800); // подстраховка на случай, если fonts.ready не сработал

    function rafMarquee() {
      pos -= speed;
      if (pos <= -half) pos += half;
      // translate3d форсит GPU-слой — движение становится заметно плавнее
      track.style.transform = `translate3d(${pos}px, 0, 0)`;
      requestAnimationFrame(rafMarquee);
    }
    rafMarquee();
  }

  /* ---------- cases carousel ---------- */
  const trackC = document.querySelector(".case-track");
  if (trackC) {
    const slides = [...trackC.children];
    const total = slides.length;
    let i = 0;
    const prev = document.querySelector("[data-case-prev]");
    const next = document.querySelector("[data-case-next]");
    const counterNum = document.querySelector("[data-case-num]");
    const barFill = document.querySelector(".case-counter .bar i");

    function go(n) {
      i = Math.max(0, Math.min(total - 1, n));
      trackC.style.transform = `translateX(${-i * 100}%)`;
      prev.disabled = i === 0;
      next.disabled = i === total - 1;
      if (counterNum) counterNum.textContent = String(i + 1).padStart(2, "0");
      if (barFill) barFill.style.width = ((i + 1) / total * 100) + "%";
      // При переключении слайда — останавливаем чужие видео, чтобы не играли в фоне
      document.querySelectorAll(".player.playing").forEach((p) => {
        const v = p.querySelector("video");
        if (v) v.pause();
      });
    }
    prev.addEventListener("click", () => go(i - 1));
    next.addEventListener("click", () => go(i + 1));
    window.addEventListener("keydown", (e) => {
      // стрелки не должны переключать карусель, если фокус в форме / на видео
      const tag = (document.activeElement && document.activeElement.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "VIDEO") return;
      if (e.key === "ArrowLeft") go(i - 1);
      if (e.key === "ArrowRight") go(i + 1);
    });
    let sx = null;
    const vp = document.querySelector(".case-viewport");
    vp.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
    vp.addEventListener("touchend", (e) => {
      if (sx == null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) go(dx < 0 ? i + 1 : i - 1);
      sx = null;
    });
    go(0);
  }

  /* ---------- видео в плеерах ----------
     Логика:
       - Если у .player есть data-video-src="path.mp4" — при клике вставляем <video> с этим файлом.
       - Если data-video-embed="ссылка" (YouTube/Vimeo/Cloudflare) — вставляем <iframe>.
       - Если ни того ни другого — плеер ведёт себя как заглушка: курсор «нельзя», ничего не происходит.
     Файл/iframe подгружается ТОЛЬКО в момент клика — до этого траффика 0, постер уже на странице.
  ----------------------------------------- */
  function isEmbed(url) { return /youtube\.com|youtu\.be|vimeo\.com|cloudflarestream\.com/.test(url); }

  function toEmbedUrl(url) {
    // YouTube: youtu.be/ID  →  www.youtube.com/embed/ID?autoplay=1
    let m = url.match(/youtu\.be\/([\w-]+)/);
    if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0`;
    m = url.match(/youtube\.com\/watch\?v=([\w-]+)/);
    if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0`;
    // Vimeo: vimeo.com/ID  →  player.vimeo.com/video/ID?autoplay=1
    m = url.match(/vimeo\.com\/(\d+)/);
    if (m) return `https://player.vimeo.com/video/${m[1]}?autoplay=1`;
    // Cloudflare Stream и прочие embed-ссылки — оставляем как есть, добавляем autoplay
    return url + (url.includes("?") ? "&" : "?") + "autoplay=1";
  }

  document.querySelectorAll(".player").forEach((player) => {
    const localSrc = player.dataset.videoSrc;
    const embedSrc = player.dataset.videoEmbed;
    if (!localSrc && !embedSrc) {
      player.classList.add("no-video");
      return;
    }
    function launch() {
      if (player.classList.contains("playing")) return;
      player.classList.add("playing");
      if (embedSrc) {
        const ifr = document.createElement("iframe");
        ifr.src = toEmbedUrl(embedSrc);
        ifr.allow = "autoplay; fullscreen; picture-in-picture";
        ifr.allowFullscreen = true;
        player.appendChild(ifr);
      } else {
        const v = document.createElement("video");
        v.src = localSrc;
        v.controls = true;
        v.autoplay = true;
        v.playsInline = true;        // важно для iOS: проигрывать внутри страницы, не открывать полноэкранно принудительно
        v.preload = "auto";
        player.appendChild(v);
        // браузер может заблокировать autoplay со звуком — на этот случай дублируем play()
        v.play().catch(() => { /* ничего страшного — у пользователя будут controls */ });
      }
    }
    player.addEventListener("click", launch);
    player.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); launch(); }
    });
  });

  /* ---------- маковские кнопочки в окошке X5: при клике все три мигают по очереди ---------- */
  document.querySelectorAll(".site .bar span").forEach((dot) => {
    dot.addEventListener("click", () => {
      const dots = dot.parentElement.querySelectorAll("span");
      dots.forEach((d, i) => {
        setTimeout(() => {
          // снимаем класс перед повторным навешиванием, чтобы анимация перезапустилась
          d.classList.remove("blink");
          void d.offsetWidth;
          d.classList.add("blink");
          setTimeout(() => d.classList.remove("blink"), 300);
        }, i * 130);
      });
    });
  });

  /* ---------- CTA: декоративный «жест» при клике на «Написать» ---------- */
  const ctaBtn = document.getElementById("ctaBtn");
  const ctaArrow = document.getElementById("ctaArrow");
  if (ctaBtn && ctaArrow) {
    let ctaTimer = null;
    ctaBtn.addEventListener("click", () => {
      // снимаем классы и навешиваем заново через reflow — иначе при повторном
      // клике анимация не запустится с нуля
      ctaBtn.classList.remove("clicked");
      ctaArrow.classList.remove("clicked");
      void ctaBtn.offsetWidth;
      ctaBtn.classList.add("clicked");
      ctaArrow.classList.add("clicked");
      clearTimeout(ctaTimer);
      ctaTimer = setTimeout(() => {
        ctaBtn.classList.remove("clicked");
        ctaArrow.classList.remove("clicked");
      }, 450); // чуть больше длительности arrowPoke (0.42s)
    });
  }

  /* ---------- mail: copy to clipboard + toast ---------- */
  const mailLink = document.getElementById("mailLink");
  const copyToast = document.getElementById("copyToast");
  if (mailLink && copyToast) {
    let toastTimer = null;
    mailLink.addEventListener("click", (e) => {
      e.preventDefault();
      const addr = mailLink.dataset.copy || mailLink.textContent.trim();
      const showToast = () => {
        copyToast.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => copyToast.classList.remove("show"), 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(addr).then(showToast).catch(() => {
          // fallback на старый способ, если буфер обмена недоступен
          const ta = document.createElement("textarea");
          ta.value = addr; ta.style.position = "fixed"; ta.style.opacity = "0";
          document.body.appendChild(ta); ta.select();
          try { document.execCommand("copy"); } catch (_) {}
          document.body.removeChild(ta);
          showToast();
        });
      } else {
        const ta = document.createElement("textarea");
        ta.value = addr; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); } catch (_) {}
        document.body.removeChild(ta);
        showToast();
      }
    });
  }

  /* ---------- work: тезисы «Как я работаю» ----------
     Десктоп (есть hover): mouseenter показывает описание в правой панели (свап-логика).
     Тач (нет hover): click по тезису разворачивает описание под ним (аккордеон-логика).
                       Несколько описаний могут быть открыты одновременно. */
  const wtitles = [...document.querySelectorAll(".wtitle")];
  const wdescs = [...document.querySelectorAll(".wdesc")];
  const wlist = document.querySelector(".worklist");
  if (wtitles.length) {
    /* Тот же надёжный детект, что в параллаксе: есть точный pointer И нет тача нигде. */
    const isHoverWork = window.matchMedia("(pointer: fine) and (not (any-pointer: coarse))").matches;
    if (isHoverWork) {
      function setW(idx) {
        wtitles.forEach((t) => {
          const on = t.dataset.i === idx;
          t.classList.toggle("on", on);
          t.classList.toggle("dim", idx !== null && !on);
        });
        wdescs.forEach((d) => d.classList.toggle("on", d.dataset.i === idx));
      }
      wtitles.forEach((t) => {
        t.addEventListener("mouseenter", () => setW(t.dataset.i));
        t.addEventListener("focus", () => setW(t.dataset.i));
        /* Click-фолбэк для гибридных устройств (Nest Hub Max, ноуты с тачскрином,
           глючные эмуляторы), где detect "(pointer: fine) and (not (any-pointer: coarse))"
           возвращает true, но реального mouseenter при тапе не происходит. */
        t.addEventListener("click", () => setW(t.dataset.i));
      });
      wlist.addEventListener("mouseleave", () => setW(null));
      wlist.addEventListener("blur", () => setW(null), true);
    } else {
      wtitles.forEach((t) => {
        t.addEventListener("click", () => {
          const i = t.dataset.i;
          const desc = wdescs.find((d) => d.dataset.i === i);
          const isOpen = t.classList.contains("on");
          t.classList.toggle("on", !isOpen);
          if (desc) desc.classList.toggle("open", !isOpen);
        });
      });
    }
  }

  /* ---------- reveal on scroll ---------- */
  const reveals = [...document.querySelectorAll(".reveal")];
  function show(el) {
    el.classList.add("in");
    setTimeout(() => {
      if (parseFloat(getComputedStyle(el).opacity) < 0.95) {
        el.style.transition = "none";
        el.style.opacity = "1";
        el.style.transform = "none";
      }
    }, 1100);
  }
  function checkReveals() {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    for (let k = reveals.length - 1; k >= 0; k--) {
      const el = reveals[k];
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.9 && r.bottom > 0) { show(el); reveals.splice(k, 1); }
    }
  }
  if (reduce) {
    reveals.forEach((el) => el.classList.add("in"));
  } else {
    window.addEventListener("scroll", checkReveals, { passive: true });
    window.addEventListener("resize", checkReveals);
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) show(en.target); });
      }, { threshold: 0.1 });
      reveals.forEach((el) => io.observe(el));
    }
    requestAnimationFrame(() => requestAnimationFrame(checkReveals));
    setTimeout(checkReveals, 250);
  }
})();
