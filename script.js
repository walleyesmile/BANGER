/* ================================================================
   BANGER — motion & interactions
   ---------------------------------------------------------------
   Modules:
     • setupParticles       floating neon dots in the background
     • setupHeaderScroll    header switches to glass on scroll
     • setupBannerReveal    fade-in banner on load
     • setupTitleAnimation  letter-by-letter reveal + ambient glow
     • setupComicReveal     scroll-triggered fade/blur/scale panels
     • setupStoryReveal     scroll-triggered paragraph reveals
     • setupButtonGlow      hover micro-interaction on glass CTA
   ================================================================ */

(function () {
  'use strict';

  /* ---------- Helpers ---------- */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  /* ---------- Boot ---------- */
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    // Non-GSAP first (still works if GSAP fails to load)
    setupParticles();
    setupHeaderScroll();
    setupSmoothScroll();

    if (typeof gsap === 'undefined') return;

    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }

    // Global smoother easing default
    gsap.defaults({ ease: 'power3.out' });

    setupBannerReveal();
    setupTitleAnimation();
    setupComicReveal();
    setupStoryReveal();
    setupEcosystemReveal();
    setupButtonGlow();

    // Recalculate positions once fonts and images settle
    window.addEventListener('load', () => {
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    });
  }


  /* ================================================================
     Floating neon particles
     ================================================================ */
  function setupParticles() {
    const host = document.getElementById('particles');
    if (!host || prefersReducedMotion) return;

    // Fewer particles on small screens for battery + perf
    const count = window.innerWidth < 768 ? 18 : 34;
    const nodes = [];

    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.top  = Math.random() * 100 + '%';

      const size = (Math.random() * 3 + 1.5).toFixed(2);
      p.style.width  = size + 'px';
      p.style.height = size + 'px';

      host.appendChild(p);
      nodes.push(p);
    }

    // If GSAP absent, particles simply stay put (still visible, subtle)
    if (typeof gsap === 'undefined') {
      nodes.forEach((el) => (el.style.opacity = '0.4'));
      return;
    }

    nodes.forEach((el) => {
      const duration = 8 + Math.random() * 12;
      const delay    = Math.random() * 6;
      const dx       = (Math.random() - 0.5) * 240;
      const dy       = -(80 + Math.random() * 300);

      gsap.set(el, { opacity: 0 });

      gsap.to(el, {
        opacity: 0.35 + Math.random() * 0.5,
        duration: 1.5,
        delay: delay,
      });

      gsap.to(el, {
        x: dx,
        y: dy,
        duration: duration,
        delay: delay,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    });
  }

  /* ================================================================
     Smooth scroll (Lenis) — synced with GSAP ticker
     ================================================================ */
  function setupSmoothScroll() {
    if (typeof Lenis === 'undefined' || prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    });

    if (typeof gsap !== 'undefined') {
      lenis.on('scroll', () => {
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.update();
      });
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }

    window.__lenis = lenis;
         }


  /* ================================================================
     Banner reveal
     ================================================================ */
  function setupBannerReveal() {
    const banner = $('.hero__banner');
    if (!banner) return;

    gsap.from(banner, {
      opacity: 0,
      y: 40,
      scale: 0.98,
      duration: 1.4,
      delay: 0.1,
    });
  }


  /* ================================================================
     Title — letter reveal + ambient glow pulse
     ================================================================ */
  function setupTitleAnimation() {
    const letters = $$('.brand-title__letter');
    const tagline = $('.brand-tagline');
    const divider = $('.title-divider');
    if (!letters.length) return;

    gsap.set(letters, {
      yPercent: 110,
      opacity: 0,
      rotate: -8,
      filter: 'blur(12px)',
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.title-section',
        start: 'top 78%',
        once: true,
      },
    });

    tl.to(letters, {
      yPercent: 0,
      opacity: 1,
      rotate: 0,
      filter: 'blur(0px)',
      duration: 1.1,
      stagger: 0.08,
      ease: 'power4.out',
    });

    if (tagline) {
      tl.from(
        tagline,
        { opacity: 0, y: 20, duration: 0.9 },
        '-=0.5'
      );
    }

     const badge = $('.status-badge');
    if (badge) {
      tl.from(
        badge,
        { opacity: 0, y: 12, scale: 0.9, duration: 0.7 },
        '-=0.3'
      );
    }
     
    if (divider) {
      tl.from(
        divider,
        {
          scaleX: 0,
          transformOrigin: 'center',
          duration: 0.7,
        },
        '-=0.4'
      );
    }

    // Ambient title glow — slow, cinematic
    if (!prefersReducedMotion) {
      gsap.to('.brand-title', {
        textShadow:
          '0 0 40px rgba(200,255,0,0.75), 0 0 90px rgba(200,255,0,0.35)',
        duration: 2.6,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
    }
  }


  /* ================================================================
     Comic panels — fade + rise + slight scale + blur
     ================================================================ */
  function setupComicReveal() {
    const panels = $$('.comic-panel');
    if (!panels.length) return;

    panels.forEach((panel) => {
      gsap.set(panel, {
        opacity: 0,
        y: 60,
        scale: 0.94,
        filter: 'blur(10px)',
      });

      gsap.to(panel, {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: 1.2,
        scrollTrigger: {
          trigger: panel,
          start: 'top 82%',
          once: true,
        },
      });
    });
  }


  /* ================================================================
     Story — title, divider, and paragraph reveals on scroll
     ================================================================ */
  function setupStoryReveal() {
    const title   = $('.story-title');
    const divider = $('.story-divider');
    const paras   = $$('.story__p');

    if (title) {
      gsap.from(title, {
        opacity: 0,
        y: 40,
        duration: 1,
        scrollTrigger: { trigger: title, start: 'top 80%', once: true },
      });
    }
    if (divider) {
      gsap.from(divider, {
        scaleX: 0,
        transformOrigin: 'center',
        duration: 0.7,
        scrollTrigger: { trigger: divider, start: 'top 82%', once: true },
      });
    }

    paras.forEach((p) => {
      gsap.set(p, { opacity: 0, y: 24 });
      gsap.to(p, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: p,
          start: 'top 88%',
          once: true,
        },
      });
    });
  }
   
/* ================================================================
     Ecosystem — fade + rise stagger
     ================================================================ */
  function setupEcosystemReveal() {
    const inner = $('.ecosystem__inner');
    if (!inner) return;

    gsap.set(inner.children, { opacity: 0, y: 20 });
    gsap.to(inner.children, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.12,
      scrollTrigger: {
        trigger: inner,
        start: 'top 85%',
        once: true,
      },
    });
  }

  /* ================================================================
     Glass button — subtle scale on hover
     ================================================================ */
  function setupButtonGlow() {
    const btn = $('.btn-glass');
    if (!btn) return;

    btn.addEventListener('mouseenter', () => {
      gsap.to(btn, { scale: 1.03, duration: 0.35 });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { scale: 1, duration: 0.35 });
    });
  }

})();
