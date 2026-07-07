/* ============================================================
   ALT+J PARTNERS — main.js v3.0
   Nav · Video Hero Rotation · Scroll Animations · Stat Counters
   Pyramid Interaction · Particles Fallback
   ============================================================ */

(function () {
  'use strict';

  /* ── Nav scroll class ── */
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 100);
    }, { passive: true });
  }

  /* ── Active nav link ── */
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === currentPath ||
        (currentPath.endsWith(a.getAttribute('href').split('/').pop()) &&
         a.getAttribute('href') !== '/altj/')) {
      a.classList.add('active');
    }
  });

  /* ── Hamburger mobile nav ── */
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileNav = document.querySelector('.nav-mobile');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open');
      document.body.style.overflow =
        mobileNav.classList.contains('open') ? 'hidden' : '';
    });
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── Scroll animations (IntersectionObserver) ── */
  const fadeObs = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.07, rootMargin: '0px 0px -50px 0px' }
  );
  document.querySelectorAll('.fade-in').forEach(el => fadeObs.observe(el));

  /* ── Stat Counters ── */
  function animateCounter(el) {
    const raw    = el.getAttribute('data-count') || el.textContent;
    const suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
    const target = parseFloat(raw.replace(/[^0-9.]/g, ''));
    const isFloat = raw.includes('.');
    const decimals = isFloat ? (raw.split('.')[1] || '').length : 0;
    const duration = 1800;
    const start    = performance.now();

    function step(now) {
      const elapsed = Math.min(now - start, duration);
      const progress = elapsed / duration;
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = target * ease;
      el.textContent =
        prefix +
        (decimals > 0 ? current.toFixed(decimals) : Math.floor(current)) +
        suffix;
      if (elapsed < duration) requestAnimationFrame(step);
      else el.textContent = prefix + (decimals > 0 ? target.toFixed(decimals) : target) + suffix;
    }
    requestAnimationFrame(step);
  }

  const counterObs = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          if (!el.dataset.counted) {
            el.dataset.counted = '1';
            animateCounter(el);
          }
          counterObs.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );
  document.querySelectorAll('.stat-number[data-count]').forEach(el => counterObs.observe(el));

  /* ── Pyramid Interaction ── */
  const pyramidLevels = document.querySelectorAll('.pyramid-level');
  const pyramidPanels = document.querySelectorAll('.pyramid-panel');

  function activatePanel(levelNum) {
    pyramidLevels.forEach(l => l.classList.remove('active-level'));
    pyramidPanels.forEach(p => p.classList.remove('panel-active'));

    const activeLevel = document.querySelector(`.pyramid-level[data-level="${levelNum}"]`);
    const activePanel = document.querySelector(`.pyramid-panel[data-panel="${levelNum}"]`);
    if (activeLevel) activeLevel.classList.add('active-level');
    if (activePanel) activePanel.classList.add('panel-active');
  }

  if (pyramidLevels.length) {
    // Default to showing level 1 (foundation)
    activatePanel(1);
    pyramidLevels.forEach(level => {
      level.addEventListener('click', () => {
        activatePanel(level.getAttribute('data-level'));
      });
    });
  }

  /* ── Video Hero Rotation ── */
  const heroEl = document.querySelector('.hero-video');
  if (!heroEl) {
    // No video hero on this page — init particle for static hero if present
    initStaticParticle();
    return;
  }

  const slides = Array.from(document.querySelectorAll('.hero-slide'));
  const dots   = Array.from(document.querySelectorAll('.hero-dot'));
  const videos = slides.map(s => s.querySelector('video'));

  let current  = 0;
  let timer    = null;
  let isPaused = false;
  const INTERVAL = 20000;

  function checkVideosLoaded() {
    videos.forEach((v) => {
      if (v) {
        v.addEventListener('canplay', () => { heroEl.classList.remove('fallback'); }, { once: true });
      }
    });
  }

  function goToSlide(idx) {
    // Pause outgoing video to free resources
    const outVid = videos[current];
    if (outVid) {
      outVid.pause();
    }

    slides[current]?.classList.remove('active');
    dots[current]?.classList.remove('active');

    current = ((idx % slides.length) + slides.length) % slides.length;
    slides[current]?.classList.add('active');
    dots[current]?.classList.add('active');

    const vid = videos[current];
    if (vid) {
      vid.currentTime = 0;
      vid.play().catch(() => {});
    }
  }

  function startRotation() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      if (!isPaused) goToSlide(current + 1);
    }, INTERVAL);
  }

  const initVid = videos[0];
  if (initVid) initVid.play().catch(() => {});

  // Preload next video after first one starts playing
  if (initVid && videos[1]) {
    initVid.addEventListener('playing', () => {
      videos[1].preload = 'auto';
      videos[1].load();
    }, { once: true });
  }

  startRotation();

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goToSlide(i);
      clearInterval(timer);
      startRotation();
    });
  });

  heroEl.addEventListener('mouseenter', () => { isPaused = true; });
  heroEl.addEventListener('mouseleave', () => { isPaused = false; });

  checkVideosLoaded();

  /* ── Static hero particle (inner pages) ── */
  function initStaticParticle() {
    const canvas = document.querySelector('.hero-static-canvas');
    if (canvas) initParticles(canvas.id || 'staticCanvas', canvas);
  }

  /* ── Particles / Geodesic Canvas ── */
  function initParticles(canvasId, canvasEl) {
    const canvas = canvasEl || document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h;
    const nodes = [];
    const mouse = { x: -1000, y: -1000 };
    const isDark = canvas.closest('.hero-static, .hero-video') !== null;
    const dotColor = isDark ? '255,255,255' : '74,124,255';
    const N = isDark ? 720 : 120, LINK = 130, MDIST = 200;

    function resize() {
      w = canvas.width  = canvas.parentElement.offsetWidth;
      h = canvas.height = canvas.parentElement.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    for (let i = 0; i < N; i++) {
      nodes.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 1.6 + 0.7,
        pulse: Math.random() * Math.PI * 2
      });
    }

    canvas.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    canvas.addEventListener('mouseleave', () => { mouse.x = -1000; mouse.y = -1000; });

    function draw() {
      ctx.clearRect(0, 0, w, h);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy; n.pulse += 0.017;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        const dx = n.x - mouse.x, dy = n.y - mouse.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < MDIST) {
          const f = (MDIST - d) / MDIST * 0.016;
          n.vx += dx * f; n.vy += dy * f;
        }
        n.vx *= 0.99; n.vy *= 0.99;
        const glow = Math.sin(n.pulse) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dotColor},${(isDark ? 0.35 : 0.6) * glow})`;
        ctx.fill();
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(${dotColor},${(1 - d / LINK) * 0.15})`;
            ctx.lineWidth = 0.8; ctx.stroke();
          }
        }
        const dx = nodes[i].x - mouse.x, dy = nodes[i].y - mouse.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < MDIST) {
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(${dotColor},${(1 - d / MDIST) * 0.25})`;
          ctx.lineWidth = 0.8; ctx.stroke();
        }
      }
      requestAnimationFrame(draw);
    }
    draw();
  }

  window.initAltJParticles = initParticles;

  /* Init static hero particle if no video hero */
  initStaticParticle();

  /* Init particle canvas for second moments section */
  const pc2 = document.getElementById('particleCanvas2');
  if (pc2) initParticles('particleCanvas2', pc2);

  /* ── Hierarchy of Needs interaction ── */
  let hierCurrent = 1;
  function showHierLevel(level) {
    hierCurrent = level;
    document.querySelectorAll('.hier-band, .hier-svg-band').forEach(b => { b.classList.remove('hier-active'); b.style.opacity = ''; });
    document.querySelectorAll(`.hier-svg-band[data-panel="${level}"]`).forEach(b => { b.classList.add('hier-active'); b.style.opacity = '0.85'; });
    document.querySelectorAll('.hier-detail').forEach(d => d.style.display = 'none');
    const detail = document.querySelector(`.hier-detail[data-detail="${level}"]`);
    if (detail) detail.style.display = 'block';
    const counter = document.querySelector('.hier-counter');
    if (counter) counter.textContent = `${level} of 5`;
    const nextBtn = document.querySelector('.hier-next-btn');
    if (nextBtn) nextBtn.textContent = level >= 5 ? 'Back to 1 →' : 'Next →';
    const prevBtn = document.querySelector('.hier-prev-btn');
    if (prevBtn) prevBtn.style.visibility = level <= 1 ? 'hidden' : 'visible';
  }
  document.querySelectorAll('.hier-band, .hier-svg-band').forEach(band => {
    band.addEventListener('click', () => showHierLevel(parseInt(band.dataset.panel)));
  });
  const nextBtn = document.querySelector('.hier-next-btn');
  if (nextBtn) nextBtn.addEventListener('click', () => showHierLevel(hierCurrent >= 5 ? 1 : hierCurrent + 1));
  const prevBtn = document.querySelector('.hier-prev-btn');
  if (prevBtn) prevBtn.addEventListener('click', () => showHierLevel(hierCurrent > 1 ? hierCurrent - 1 : 5));

})();
