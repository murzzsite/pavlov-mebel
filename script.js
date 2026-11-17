const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/9R8HZBMDKY';

(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches && !/motion=1/.test(location.search); /*TESTFLAG*/
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NB = ' ';
  const fmt = n => Math.round(n).toLocaleString('ru-RU').replace(/[\s  ]/g, NB);

  /* общее состояние для 3D-сцены */
  const M = window.MKP = window.MKP || {};
  M.S = { p: reduce ? 1 : 0 };

  $('#year') && ($('#year').textContent = new Date().getFullYear());

  /* шапка и меню */
  const header = $('#header'), burger = $('#burger'), nav = $('#nav');
  const onScroll = () => header.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const setMenu = open => { burger.classList.toggle('is-open', open); nav.classList.toggle('is-open', open); burger.setAttribute('aria-expanded', open); };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* маска телефона */
  $$('input[type="tel"]').forEach(input => input.addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '');
    if (!v) { e.target.value = ''; return; }
    if (v.startsWith('8')) v = '7' + v.slice(1);
    if (!v.startsWith('7')) v = '7' + v;
    v = v.slice(0, 11);
    let out = '+7';
    if (v.length > 1) out += ' (' + v.slice(1, 4);
    if (v.length >= 4) out += ') ' + v.slice(4, 7);
    if (v.length >= 7) out += '-' + v.slice(7, 9);
    if (v.length >= 9) out += '-' + v.slice(9, 11);
    e.target.value = out;
  }));

  /* ---------- hero: чертёж и двери ---------- */
  const art = $('#heroArt'), doorBtn = $('#doorBtn');
  const setDoors = open => { art.classList.toggle('is-open', open); doorBtn.setAttribute('aria-pressed', open); doorBtn.textContent = open ? 'Закрыть двери' : 'Открыть двери'; };
  requestAnimationFrame(() => art.classList.add('is-in'));
  doorBtn.addEventListener('click', () => { clearTimeout(autoOpen); setDoors(!art.classList.contains('is-open')); });
  const autoOpen = setTimeout(() => setDoors(true), reduce ? 0 : 2000);
  if (reduce) { clearTimeout(autoOpen); }

  /* ---------- hero: рулетка ---------- */
  const ruler = $('#ruler'), nums = $('#rulerNums'), cur = $('#rulerCur'), val = $('#rulerVal');
  const buildNums = () => {
    nums.innerHTML = '';
    for (let x = 100; x < ruler.clientWidth; x += 100) {
      const s = document.createElement('span'); s.style.left = x + 'px'; s.textContent = x / 10; nums.appendChild(s);
    }
  };
  buildNums(); addEventListener('resize', buildNums);
  let rx = 0, rt = 0, rRaf = 0, rUser = false;
  const rDraw = () => {
    rx += (rt - rx) * (rUser ? .28 : .08);
    cur.style.transform = `translate3d(${rx.toFixed(1)}px,0,0)`;
    val.textContent = fmt(rx) + NB + 'мм';
    const flip = rx > ruler.clientWidth - 120;
    val.style.left = flip ? '-96px' : '';
    if (Math.abs(rt - rx) > .4) rRaf = requestAnimationFrame(rDraw); else rRaf = 0;
  };
  const rGo = x => { rt = Math.max(0, Math.min(ruler.clientWidth - 3, x)); if (!rRaf) rRaf = requestAnimationFrame(rDraw); };
  if (!reduce) {
    ruler.classList.add('is-live');
    setTimeout(() => { if (!rUser) rGo(ruler.clientWidth * .58); }, 700);
    ruler.addEventListener('pointermove', e => { rUser = true; rGo(e.clientX - ruler.getBoundingClientRect().left); });
  }

  /* ---------- что делаем: табы с чертежами ---------- */
  const TYPES = [
    'Любой сложности: встроенные в нишу, до потолка, с распашными или раздвижными дверями. Корпус кроим по самым тесным местам, поэтому шкаф встаёт без щелей.',
    'Под ширину вашего коридора: глубина шкафа подбирается по проходу, чтобы в ванную не приходилось пробираться боком. Место для обуви, верхней одежды и вещей по сезону.',
    'Штанги, полки и ящики по списку ваших вещей. Считаем, что и сколько вы храните, и только потом рисуем секции.',
    'Открытое хранение под размеры стены. Полки и секции подбираем под то, что на них будет стоять.',
    'Книжные стены от пола до потолка. Полки рассчитываем под реальный вес и высоту ваших книг.'
  ];
  const tabs = $$('#tTabs [role=tab]'), drs = $$('#plan .dr'), tTxt = $('#tTxt'), tPanel = $('#tPanel');
  const showType = (i, focus) => {
    tabs.forEach((b, k) => { b.setAttribute('aria-selected', k === i); b.tabIndex = k === i ? 0 : -1; });
    drs.forEach(d => d.classList.remove('is-on'));
    const d = drs[i]; void d.getBoundingClientRect(); d.classList.add('is-on');
    tTxt.textContent = TYPES[i]; tPanel.setAttribute('aria-labelledby', 't' + i);
    if (focus) tabs[i].focus();
  };
  tabs.forEach((b, i) => {
    b.addEventListener('click', () => showType(i));
    b.addEventListener('keydown', e => {
      const k = e.key;
      if (['ArrowDown', 'ArrowRight'].includes(k)) { e.preventDefault(); showType((i + 1) % tabs.length, true); }
      if (['ArrowUp', 'ArrowLeft'].includes(k)) { e.preventDefault(); showType((i + tabs.length - 1) % tabs.length, true); }
    });
  });
  showType(0);

  /* ---------- сверка договора ---------- */
  const checks = $$('#checks input'), vn = $('#vn'), vt = $('#vt'), meter = $$('#meter i');
  const VERD = [
    'Пока ничего не отмечено. Нажмите на пункты, которые есть в вашем предложении.',
    'Это меньше половины. По каждому пустому пункту задайте вопрос мебельщику до подписания: пока вопроса нет, доплаты возможны.',
    'Это меньше половины. По каждому пустому пункту задайте вопрос мебельщику до подписания: пока вопроса нет, доплаты возможны.',
    'Половина закрыта. Остальное уточните письменно, ответ «разберёмся на месте» подскажет, где появятся доплаты.',
    'Почти всё. Уточните оставшиеся пункты письменно до договора.',
    'Почти всё. Уточните оставшийся пункт письменно до договора.',
    'Всё на месте. Так и должно быть, и это то, чего мы придерживаемся.'
  ];
  let shown = 0, vRaf = 0;
  const upd = () => {
    const n = checks.filter(c => c.checked).length;
    meter.forEach((m, i) => m.classList.toggle('is-on', i < n));
    vt.textContent = VERD[n];
    cancelAnimationFrame(vRaf);
    const from = shown, t0 = performance.now();
    const tick = t => { const p = Math.min(1, (t - t0) / 350); shown = from + (n - from) * p; vn.textContent = Math.round(shown); if (p < 1) vRaf = requestAnimationFrame(tick); };
    reduce ? (vn.textContent = n, shown = n) : (vRaf = requestAnimationFrame(tick));
  };
  checks.forEach(c => c.addEventListener('change', upd)); upd();

  /* ---------- ниша и отделка ---------- */
  const fin = $('#fin'), finOut = $('#finOut');
  const K = 2.4; /* визуальный масштаб слоя, px на мм */
  const nicheUpd = () => {
    const x = +fin.value, f = x * K;
    finOut.textContent = x;
    $('#finL').setAttribute('width', f);
    $('#finR').setAttribute('x', 450 - f); $('#finR').setAttribute('width', f);
    $('#body').setAttribute('x', 118 + f); $('#body').setAttribute('width', 324 - 2 * f);
    $('#dimL').setAttribute('d', `M${110 + f} 236H${450 - f}`);
    $('#dimA').setAttribute('d', `M${110 + f} 228V244M${450 - f} 228V244`);
    $('#nicheTxt').textContent = fmt(1200 - 2 * x) + NB + 'мм';
  };
  fin.addEventListener('input', nicheUpd); nicheUpd();

  /* ---------- форма → Cloudflare Worker → Telegram ---------- */
  const form = $('#leadForm'), note = $('#formNote');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const label = btn.querySelector('span') || btn, orig = label.textContent;
    const payload = {};
    new FormData(form).forEach((v, k) => { payload[k] = v; });
    if (payload._gotcha) return;
    if (!payload.name || !payload.phone) { note.textContent = 'Заполните имя и телефон'; return; }
    if (!form.consent.checked) { note.textContent = 'Нужно согласие на обработку данных'; return; }
    delete payload.consent;
    btn.disabled = true; label.textContent = 'Отправляем…'; note.textContent = '';
    try {
      const resp = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      label.textContent = 'Заявка отправлена';
      note.textContent = 'Спасибо! Мы перезвоним, уточним адрес и договоримся о времени замера.';
      form.reset();
    } catch (err) {
      console.error(err);
      label.textContent = 'Ошибка, попробуйте ещё раз';
      note.textContent = 'Не удалось отправить. Позвоните: 8 999 827-54-90.';
    } finally {
      setTimeout(() => { label.textContent = orig; btn.disabled = false; }, 3500);
    }
  });

  /* ================= анимации (только если есть gsap и не reduced-motion) ================= */
  if (reduce || !window.gsap || !window.ScrollTrigger) { document.documentElement.classList.add('no-anim'); return; }
  gsap.registerPlugin(ScrollTrigger);

  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: .09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  /* якоря */
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const t = $(id); if (!t) return;
    e.preventDefault();
    const y = t.getBoundingClientRect().top + scrollY - 64;
    lenis ? lenis.scrollTo(y, { duration: 1.4 }) : scrollTo({ top: y, behavior: 'smooth' });
  }));

  /* вход hero */
  const letters = $$('.hero__title .mk-w');
  if (letters.length) gsap.from(letters, { yPercent: 70, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: { each: .018, from: 'start' }, delay: .1 });
  gsap.from('.hero__lead, .hero__actions, .header__inner > *', { opacity: 0, y: 22, duration: 1, ease: 'power3.out', stagger: .08, delay: .5 });

  /* заголовки в масках */
  $$('h2.mask').forEach(h => {
    const t = h.textContent; h.setAttribute('aria-label', t);
    h.innerHTML = `<span class="ln" aria-hidden="true"><i>${t}</i></span>`;
    gsap.from(h.querySelector('i'), { yPercent: 112, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
  });

  /* манифест по словам */
  const mf = $('#manifest'), words = mf.textContent.trim().split(/\s+/);
  mf.setAttribute('aria-label', mf.textContent.trim());
  mf.innerHTML = words.map(w => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
  gsap.to('#manifest .w', { opacity: 1, ease: 'none', stagger: .12, scrollTrigger: { trigger: mf, start: 'top 82%', end: 'bottom 50%', scrub: true } });

  /* сцена: закреплённый блок, прогресс ведёт 3D, смету и подписи */
  const scene = $('#scene'), caps = $$('.cap'), slipLis = $$('.slip__list li'), slip = $('#slip');
  scene.classList.add('is-live');
  const STEPS = [0.22, 0.46, 0.72];
  let stepNow = -1;
  const paint = p => {
    const s = p < STEPS[0] ? 0 : p < STEPS[1] ? 1 : p < STEPS[2] ? 2 : 3;
    if (s !== stepNow) { stepNow = s; caps.forEach((c, i) => c.classList.toggle('is-on', i === s)); }
    slipLis.forEach(li => li.classList.toggle('is-on', p >= +li.dataset.at));
    slip.classList.toggle('is-done', p >= .94);
  };
  paint(0);
  ScrollTrigger.create({
    trigger: '#scenePin', start: 'top top', end: () => '+=' + Math.round(innerHeight * (innerWidth < 900 ? 3.4 : 4.2)),
    pin: true, anticipatePin: 1, scrub: true, invalidateOnRefresh: true,
    onUpdate: self => { M.S.p = self.progress; paint(self.progress); }
  });

  /* бегущая строка, скорость зависит от скролла */
  const mq = $('#marq'); let mx = 0;
  gsap.ticker.add(() => {
    mx -= .7 + Math.abs(lenis ? lenis.velocity : 0) * .4;
    const half = mq.scrollWidth / 2; if (-mx >= half) mx += half;
    mq.style.transform = `translate3d(${mx}px,0,0)`;
  });

  /* появление блоков в секциях */
  const rv = (sel, trig) => {
    const els = $$(sel); if (!els.length) return;
    gsap.set(els, { opacity: 0, y: 28 });
    ScrollTrigger.batch(els, { start: 'top 90%', once: true, onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', stagger: .09, overwrite: true }) });
  };
  rv('.chk'); rv('.verdict'); rv('.faq details'); rv('.links li'); rv('.form'); rv('.why__tool'); rv('.types__panel'); rv('.scene__sub');
  gsap.from('.footer__name', { yPercent: 40, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 85%' } });
  addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
