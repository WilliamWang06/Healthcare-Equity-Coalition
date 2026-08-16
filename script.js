const prefersReducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Don't let the browser restore a scrolled-down position when navigating
  // with back/forward — combined with the fade transition (below), a
  // restored mid-page scroll position is what causes that "jump" feeling
  // right after a page loads.
  if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; }

  function isSameSiteHtmlLink(a){
    if (!a || !a.href) return false;
    if (a.origin !== window.location.origin) return false;
    if (a.hasAttribute('download') || a.target === '_blank') return false;
    return /\.html$/.test(a.pathname) || a.pathname === '/' ;
  }

  // Prefetch other pages the moment someone's finger/cursor lands on a nav
  // link — by the time they actually tap/click, the page is often already
  // sitting in the browser's cache, so navigation feels instant instead of
  // showing a blank white screen while it loads over the network. This is
  // what makes multi-page sites feel as snappy as a single-page app.
  (function setupLinkPrefetch(){
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ''))) return; // respect data-saver / slow connections
    const prefetched = new Set();
    function prefetch(href){
      if (!href || prefetched.has(href)) return;
      prefetched.add(href);
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    }
    document.addEventListener('pointerenter', (e) => {
      const a = e.target.closest && e.target.closest('a');
      if (isSameSiteHtmlLink(a)) prefetch(a.href);
    }, { capture: true, passive: true });
    document.addEventListener('touchstart', (e) => {
      const a = e.target.closest && e.target.closest('a');
      if (isSameSiteHtmlLink(a)) prefetch(a.href);
    }, { capture: true, passive: true });
    document.addEventListener('focus', (e) => {
      const a = e.target.closest && e.target.closest('a');
      if (isSameSiteHtmlLink(a)) prefetch(a.href);
    }, { capture: true, passive: true });
  })();

  // The page-crossfade (in styles.css) blends a snapshot of the page you're
  // leaving into the new page. If you'd scrolled down before tapping a nav
  // link, that snapshot shows the scrolled-down view fading into the new
  // page's top — which reads as a jarring jump/bounce. Snapping instantly
  // to the top the moment a nav link is tapped, before the browser starts
  // the actual navigation, means the crossfade blends two "top of page"
  // views instead, so it settles smoothly with no jump.
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a');
    if (!isSameSiteHtmlLink(a)) return;
    if (window.scrollY > 0) { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }
  }, { capture: true });

  // Nav color transition on scroll (green hero -> white bar)
  const navHeader = document.querySelector('header.nav');
  function updateNavScroll(){
    if (!navHeader) return;
    if (window.scrollY > 40) { navHeader.classList.add('scrolled'); }
    else { navHeader.classList.remove('scrolled'); }
  }
  updateNavScroll();
  window.addEventListener('scroll', updateNavScroll, { passive: true });

  // Subtle parallax drift on the hero's background blobs (Apple-style depth cue),
  // plus a scroll-linked color sweep through the "together." accent text.
  const heroEl = document.querySelector('.hero');
  function updateHeroParallax(){
    if (!heroEl || prefersReducedMotionQuery.matches) return;
    if (window.scrollY < window.innerHeight * 1.4) {
      heroEl.style.setProperty('--parallax-y', window.scrollY + 'px');
    }
    const accentPct = Math.min(100, (window.scrollY / 480) * 100);
    heroEl.style.setProperty('--accent-pos', accentPct + '%');
  }
  updateHeroParallax();
  window.addEventListener('scroll', updateHeroParallax, { passive: true });

  // Scroll progress bar + back-to-top button
  const scrollProgressBar = document.getElementById('scrollProgressBar');
  const backToTopBtn = document.getElementById('backToTop');
  function updateScrollUI(){
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (scrollProgressBar) scrollProgressBar.style.width = pct + '%';
    if (backToTopBtn) backToTopBtn.classList.toggle('visible', scrollTop > 600);
  }
  updateScrollUI();
  window.addEventListener('scroll', updateScrollUI, { passive: true });
  window.addEventListener('resize', updateScrollUI, { passive: true });
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotionQuery.matches ? 'auto' : 'smooth' });
    });
  }

  // Mobile menu toggle
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (hamburgerBtn && mobileMenu) {
    hamburgerBtn.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburgerBtn.setAttribute('aria-expanded', isOpen);
      hamburgerBtn.classList.toggle('open');
    });
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
    }));
  }

  // Pillar cards: tap-to-reveal on touch devices (hover handles desktop)
  document.querySelectorAll('.pillar-card').forEach(card => {
    card.addEventListener('click', () => {
      const isOpen = card.classList.toggle('is-open');
      document.querySelectorAll('.pillar-card').forEach(c => { if (c !== card) c.classList.remove('is-open'); });
    });
  });

  // Interactive RI map pins
  const riCities = {
    providence: {
      label: 'Rhode Island',
      orgs: ['RI Senate', 'RI House of Representatives', 'City of Providence', 'Office of the Lieutenant Governor', 'RI Department of Health (RIDOH)', 'Dorcas International', 'Childhood Lead Action Project (CLAP)', 'Clínica Esperanza / Hope Clinic', 'Brown University School of Public Health', 'Office of the Health Insurance Commissioner (OHIC)']
    },
    philadelphia: {
      label: 'Philadelphia, PA',
      orgs: ['University of Pennsylvania']
    },
    newhaven: {
      label: 'New Haven, CT',
      orgs: ['Nyera Ali, Yale University']
    },
    columbus: {
      label: 'Columbus, OH',
      orgs: ['Shreyas Gorthy, Ohio State University']
    },
    evanston: {
      label: 'Evanston, IL',
      orgs: ['Yasmine Sakr, Northwestern University']
    },
    stanford: {
      label: 'Stanford, CA',
      orgs: ['Gabriel Martinez, Stanford University']
    },
    losangeles: {
      label: 'Los Angeles, CA',
      orgs: ['Andrew Rahana, UCLA']
    }
  };
  const riMapInfo = document.getElementById('riMapInfo');
  const riPins = document.querySelectorAll('.ri-pin');
  riPins.forEach(pin => {
    pin.addEventListener('click', () => {
      const city = riCities[pin.dataset.city];
      if (!city || !riMapInfo) return;
      riPins.forEach(p => p.classList.remove('active'));
      pin.classList.add('active');
      riMapInfo.innerHTML = `<h5>${city.label} Partners</h5><ul>${city.orgs.map(o => `<li>${o}</li>`).join('')}</ul>`;
    });
  });

  // Magnetic tilt hover on logo tiles, founder avatars & feature cards (mouse devices only)
  function attachTilt(el, maxDeg, scale, perspective){
    perspective = perspective || 600;
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) - 0.5;
      const py = ((e.clientY - rect.top) / rect.height) - 0.5;
      el.style.transform = `perspective(${perspective}px) rotateX(${(-py*maxDeg).toFixed(2)}deg) rotateY(${(px*maxDeg).toFixed(2)}deg) scale(${scale})`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  }
  if (!prefersReducedMotionQuery.matches && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.logo-tile').forEach(el => attachTilt(el, 9, 1.05));
    document.querySelectorAll('.founder-avatar').forEach(el => attachTilt(el, 12, 1.06));
    // Larger content cards get a subtler tilt — big rotation on a text-heavy card looks broken, not premium
    document.querySelectorAll('.project-card, .involved-card, .leadership-card').forEach(el => attachTilt(el, 3.5, 1.015, 1000));
  }

  // Partner tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.partner-panel');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.querySelector(`.partner-panel[data-panel="${btn.dataset.tab}"]`).classList.add('active');
    });
  });

  // Scroll reveal
  const reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  // Animated counting stats
  const countEls = document.querySelectorAll('.count-stat');
  function runCount(el){
    const target = parseInt(el.dataset.target, 10) || 0;
    const suffix = el.dataset.suffix || '';
    if (prefersReducedMotionQuery.matches) { el.textContent = target + suffix; return; }
    const duration = 1400;
    const start = performance.now();
    function tick(now){
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window && countEls.length) {
    const countIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runCount(entry.target);
          countIo.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    countEls.forEach(el => {
      const rect = el.getBoundingClientRect();
      const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0;
      if (alreadyVisible) {
        // Already on screen at page load (no scroll happened) — show the final
        // number right away instead of animating, so nothing counts up unprompted.
        el.textContent = (el.dataset.target || '0') + (el.dataset.suffix || '');
      } else {
        countIo.observe(el);
      }
    });
  } else {
    countEls.forEach(el => { el.textContent = (el.dataset.target || '0') + (el.dataset.suffix || ''); });
  }
