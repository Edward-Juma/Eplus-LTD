/* Kestrel Labs: main script. Sections: helpers, loader, smooth scroll, Three.js bg,
   hero, nav, counters, timeline, filters, pricing, swiper, UI extras */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.registerPlugin(ScrollTrigger);

  /* Smooth scrolling (Lenis) synced with GSAP */
  let lenis;
  if (!reduce) {
    lenis = new Lenis({ lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = (t) => lenis ? lenis.scrollTo(t, { offset: -90 }) : $(t)?.scrollIntoView();
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length > 1 && $(id)) { e.preventDefault(); scrollTo(id); $('#navLinks').classList.remove('open'); }
  }));

  /* AOS + page loader */
  AOS.init({ duration: reduce ? 0 : 800, easing: 'ease-out-cubic', once: true, offset: 60 });
  window.addEventListener('load', () => setTimeout(() => {
    gsap.to('#loader', { opacity: 0, duration: .6, onComplete: () => $('#loader').remove() });
    heroIntro();
  }, reduce ? 0 : 1100));

  /* Hero: split text, typing, stagger */
  const words = ['scales with you.', 'users love.', 'ships on time.', 'stays secure.'];
  function heroIntro() {
    const split = new SplitType('.split', { types: 'words' });
    if (!reduce) {
      gsap.from(split.words, { y: 60, opacity: 0, stagger: .06, duration: 1, ease: 'power4.out' });
      gsap.from('.hero__copy > :not(h1)', { y: 30, opacity: 0, stagger: .12, delay: .4, duration: .9, ease: 'power3.out' });
      gsap.from('.fcard', { scale: .7, opacity: 0, stagger: .15, delay: .6, duration: 1, ease: 'back.out(1.6)' });
    }
    type();
    $$('[data-count]').forEach(el => countUp(el));
  }
  function type() {
    const el = $('#typed'); let w = 0, c = 0, del = false;
    if (reduce) { el.textContent = words[0]; return; }
    (function tick() {
      const word = words[w];
      el.textContent = word.slice(0, del ? --c : ++c);
      let d = del ? 40 : 90;
      if (!del && c === word.length) { del = true; d = 1600; }
      else if (del && c === 0) { del = false; w = (w + 1) % words.length; d = 350; }
      setTimeout(tick, d);
    })();
  }
  function countUp(el) {
    const end = +el.dataset.count, o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () =>
      gsap.to(o, { v: end, duration: reduce ? 0 : 2, ease: 'power2.out', onUpdate: () => el.textContent = Math.round(o.v) }) });
  }
  $$('[data-count]').forEach(el => { if (!el.closest('.stats')) countUp(el); });

  /* Three.js: glowing particles + wave field, lazily paused when tab hidden */
  (function bg() {
    if (typeof THREE === 'undefined') return;
    const canvas = $('#bg'), scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, .1, 100); cam.position.z = 6;
    const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    r.setPixelRatio(Math.min(devicePixelRatio, 1.5)); r.setSize(innerWidth, innerHeight);
    const N = innerWidth < 700 ? 500 : 1400, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    const cols = [new THREE.Color('#2563EB'), new THREE.Color('#06B6D4'), new THREE.Color('#22C55E')];
    for (let i = 0; i < N; i++) {
      pos.set([(Math.random() - .5) * 20, (Math.random() - .5) * 14, (Math.random() - .5) * 10], i * 3);
      const c = cols[i % 3]; col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: .045, vertexColors: true, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(pts);
    let run = true;
    addEventListener('resize', () => { cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); r.setSize(innerWidth, innerHeight); });
    document.addEventListener('visibilitychange', () => { run = !document.hidden; if (run) loop(); });
    const clock = new THREE.Clock();
    (function loop() {
      if (!run) return; requestAnimationFrame(loop);
      const t = reduce ? 0 : clock.getElapsedTime();
      pts.rotation.y = t * .03; pts.rotation.x = 0; pts.position.y = scrollY * .0012;
      r.render(scene, cam);
    })();
  })();

  /* Nav: glass shrink, active section, sliding indicator */
  const links = $$('.nav__links a'), ind = $('.nav__ind');
  function moveInd(a) { if (!a) { ind.style.opacity = 0; return; } ind.style.cssText = `opacity:1;left:${a.offsetLeft}px;width:${a.offsetWidth}px`; }
  links.forEach(a => {
    const sec = $(a.getAttribute('href'));
    ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%', onToggle: s => { if (s.isActive) { links.forEach(l => l.classList.remove('active')); a.classList.add('active'); moveInd(a); } } });
    a.addEventListener('mouseenter', () => moveInd(a));
  });
  $('.nav__links').addEventListener('mouseleave', () => moveInd($('.nav__links a.active')));
  ScrollTrigger.create({ trigger: '#home', start: 'bottom 80%', onLeaveBack: () => moveInd(null) });
  const burger = $('#burger');
  burger.addEventListener('click', () => { const o = $('#navLinks').classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { $('#navLinks').classList.remove('open'); burger.setAttribute('aria-expanded', false); } });

  /* Timeline progress + checklist + parallax blobs */
  gsap.to('#tlFill', { width: '100%', ease: 'none', scrollTrigger: { trigger: '#timeline', start: 'top 70%', end: 'bottom 60%', scrub: true } });
  ScrollTrigger.create({ trigger: '.checks', start: 'top 80%', once: true, onEnter: () => $('.checks').classList.add('in') });
  if (!reduce) {
    gsap.utils.toArray('.blob').forEach((b, i) => gsap.to(b, { yPercent: 25 * (i % 2 ? -1 : 1), ease: 'none', scrollTrigger: { trigger: b.parentElement, scrub: true } }));
    gsap.utils.toArray('.proj__img').forEach(el => gsap.from(el, { yPercent: 8, scale: .95, opacity: .4, scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 55%', scrub: true } }));
    gsap.utils.toArray('.timeline__steps li').forEach((li, i) => gsap.from(li, { y: 50, opacity: 0, delay: i * .1, scrollTrigger: { trigger: li, start: 'top 90%' } }));
  }

  /* Project filters */
  $$('.chip').forEach(ch => ch.addEventListener('click', () => {
    $$('.chip').forEach(c => c.classList.toggle('is-active', c === ch));
    const f = ch.dataset.filter;
    $$('.proj').forEach(p => { const show = f === 'all' || p.dataset.cat === f; p.classList.toggle('hide', !show);
      if (show && !reduce) gsap.fromTo(p, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .6 }); });
    ScrollTrigger.refresh();
  }));

  /* Pricing selection (click or keyboard) */
  const plans = $$('.plan');
  const pick = p => plans.forEach(x => { x.classList.toggle('is-featured', x === p); x.setAttribute('aria-checked', x === p); });
  plans.forEach(p => { p.addEventListener('click', () => pick(p)); p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(p); } }); });

  /* Testimonials carousel */
  if ($('#tSwiper')) {
    new Swiper('#tSwiper', { loop: true, spaceBetween: 24, slidesPerView: 1, autoplay: reduce ? false : { delay: 4500, disableOnInteraction: false },
      pagination: { el: '.swiper-pagination', clickable: true }, breakpoints: { 760: { slidesPerView: 2 }, 1100: { slidesPerView: 3 } }, a11y: true });
  }

  /* FAQ: animated height on <details> */
  $$('.faq details').forEach(d => {
    const body = d.lastElementChild;
    d.querySelector('summary').addEventListener('click', e => {
      e.preventDefault();
      if (d.open) gsap.to(body, { height: 0, duration: reduce ? 0 : .4, onComplete: () => d.open = false });
      else { d.open = true; gsap.fromTo(body, { height: 0 }, { height: 'auto', duration: reduce ? 0 : .4 }); }
    });
  });

  /* Ripple button effect only */
  $$('.ripple').forEach(b => b.addEventListener('click', e => {
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height), el = document.createElement('span');
    el.className = 'rip'; el.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    b.appendChild(el); setTimeout(() => el.remove(), 600);
  }));

  /* Back to top + newsletter */
  const top = $('#totop');
  addEventListener('scroll', () => top.classList.toggle('show', scrollY > 700), { passive: true });
  top.addEventListener('click', () => lenis ? lenis.scrollTo(0) : window.scrollTo({ top: 0 }));
  $('#news').addEventListener('submit', e => { e.preventDefault(); $('#newsMsg').textContent = 'Thanks! You\'re subscribed.'; e.target.reset(); });
})();
