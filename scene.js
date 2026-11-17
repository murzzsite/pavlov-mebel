/* 3D-сцена «шкаф в разрезе»: прогресс скролла (window.MKP.S.p, 0..1) ведёт замер, разлёт деталей, сборку и монтаж дверей */
const M = window.MKP = window.MKP || { S: { p: 0 } };
const canvas = document.getElementById('c3d');
const fail = () => document.documentElement.classList.add('no3d');

(async () => {
  try {
    if (!canvas) throw 0;
    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw 0;
    const THREE = await import('three');
    init(THREE);
  } catch (e) { console.warn('3D off', e); fail(); }
})();

function init(THREE) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches && !/motion=1/.test(location.search); /*TESTFLAG*/
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const stage = canvas.parentElement;
  const small = innerWidth < 900;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 60);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d2c4, 2.1));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(3.2, 6.5, 5.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 20 });
  sun.shadow.bias = -0.0005; sun.shadow.radius = 5;
  scene.add(sun);

  /* размеры, м */
  const W = 2.4, H = 2.5, D = 0.58, T = 0.018, PL = 0.1;
  const C = { oak: 0xd6bb92, oakD: 0xc2a276, back: 0xcdb48c, sage: 0x7f917e, ink: 0x26282a, plinth: 0x3a3d40, wall: 0xf6f4ef, wallB: 0xeceae3, floor: 0xd9d4c9, red: 0xd52b26 };
  const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0, ...o });
  const box = (w, h, d, c, o) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, o)); m.castShadow = true; m.receiveShadow = true; return m; };
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const seg = (p, a, b) => cl((p - a) / (b - a));

  /* ниша: пол, стены, потолок */
  const niche = new THREE.Group(); scene.add(niche);
  const floor = box(4.2, 0.04, 2.2, C.floor); floor.position.set(0, -0.02, 0.3); niche.add(floor);
  const back = box(W + 0.4, H + 0.12, 0.05, C.wallB); back.position.set(0, (H + 0.12) / 2, -D / 2 - 0.03); niche.add(back);
  const wl = box(0.14, H + 0.12, 1.1, C.wall); wl.position.set(-(W / 2 + 0.07 + 0.003), (H + 0.12) / 2, 0.0); niche.add(wl);
  const wr = wl.clone(); wr.position.x = W / 2 + 0.07 + 0.003; niche.add(wr);
  const ceil = box(W + 0.4, 0.12, 1.1, C.wall); ceil.position.set(0, H + 0.06, 0.0); niche.add(ceil);

  /* лазер замера */
  const laserMat = new THREE.MeshBasicMaterial({ color: C.red, transparent: true });
  const laser = new THREE.Mesh(new THREE.BoxGeometry(W + 0.01, 0.012, 0.014), laserMat); laser.position.z = D / 2 + 0.03; scene.add(laser);
  const marks = [0.32, 1.25, 2.2].map(y => {
    const g = new THREE.Group();
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.022, 0.03), laserMat.clone()); a.position.set(-W / 2 + 0.08, y, D / 2 + 0.03);
    const b = a.clone(); b.material = a.material; b.position.x = W / 2 - 0.08;
    g.add(a, b); g.userData.y = y; g.visible = false; scene.add(g); return g;
  });

  /* детали шкафа: домашняя позиция, вектор разлёта, окно сборки */
  const parts = [];
  const add = (mesh, home, E, a0, a1, i) => { mesh.position.copy(home); scene.add(mesh); parts.push({ m: mesh, home: home.clone(), E: new THREE.Vector3(...E), a0, a1, i: parts.length, rot: new THREE.Vector3((Math.random() - .5) * .5, (Math.random() - .5) * .5, (Math.random() - .5) * .3) }); };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const innerH = H - PL - T;                       /* высота между дном и крышкой */
  const lw = (W / 2 - T) - T / 2;                   /* ширина секции */
  const lcx = -((W / 2 - T) + T / 2) / 2, rcx = -lcx;

  add(box(W - 0.02, PL, D - 0.06, C.plinth), V(0, PL / 2, -0.03), [0, -0.7, 0.9], .46, .50);
  add(box(W - 2 * T, T, D, C.oak), V(0, PL + T / 2, 0), [0, -0.4, 0.8], .48, .52);
  add(box(W - 2 * T, H - PL - T, 0.01, C.back), V(0, PL + (H - PL - T) / 2 + T, -D / 2 + 0.005), [0, 0.1, -1.3], .50, .55);
  add(box(T, H - PL, D, C.oak), V(-(W / 2 - T / 2), PL + (H - PL) / 2, 0), [-0.95, 0.12, 0.45], .52, .57);
  add(box(T, H - PL, D, C.oak), V((W / 2 - T / 2), PL + (H - PL) / 2, 0), [0.95, 0.12, 0.45], .54, .59);
  add(box(T, innerH - T, D - 0.02, C.oak), V(0, PL + T + (innerH - T) / 2, 0), [0, 0.5, 1.1], .57, .61);
  add(box(W - 2 * T, T, D, C.oak), V(0, H - T / 2, 0), [0, 1.0, 0.2], .59, .64);
  [0.62, 1.02, 1.42, 1.82].forEach((y, k) => add(box(lw, T, D - 0.03, C.oak), V(lcx, y, -0.005), [-0.7 + k * 0.05, 0.16 * (k - 1.5), 1.0 + k * 0.1], .61 + k * .012, .655 + k * .012));
  add(box(lw, T, D - 0.03, C.oak), V(rcx, 2.2, -0.005), [0.7, 0.3, 1.1], .65, .69);
  [0, 1].forEach(k => { const d = box(lw - 0.03, 0.2, D - 0.08, C.oakD); const h = box(0.24, 0.02, 0.02, C.ink); h.position.set(0, 0.02, (D - 0.08) / 2 + 0.01); d.add(h); add(d, V(rcx, PL + T + 0.11 + k * 0.23, 0.02), [0.9, -0.1 - 0.1 * k, 1.2 + 0.1 * k], .64 + k * .02, .68 + k * .02); });
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, lw, 14), mat(0x9ea3a6, { metalness: 0.6, roughness: 0.35 })); rod.rotation.z = Math.PI / 2; rod.castShadow = true;
  add(rod, V(rcx, 2.05, 0), [0.6, 0.6, 1.0], .66, .70);
  const GARM = [0x8c9aa5, 0xc9b79c, 0x4b4f54, 0xb7c4b2, 0xd9d3c7, 0x6f7f8e, 0xa9a29a];
  GARM.forEach((c, k) => { const g = box(0.045, 0.72, 0.34, c); add(g, V(rcx - lw / 2 + 0.1 + k * (lw - 0.2) / 6, 2.05 - 0.37, 0), [0.5 - k * 0.05, 0.9, 1.3], .67 + k * .004, .705 + k * .004); });
  /* левая секция: коробки и книги на полках для жизни */
  const BX = [[0.36, 0.2, 0.34, C.sage, 0.62 + T / 2 + 0.1, -1.0], [0.3, 0.16, 0.3, 0xe9e3d6, 1.02 + T / 2 + 0.08, -0.65], [0.4, 0.24, 0.34, C.oakD, 1.42 + T / 2 + 0.12, -0.9], [0.28, 0.18, 0.3, C.sage, 1.82 + T / 2 + 0.09, -0.4]];
  BX.forEach(([w, h, d, c, y, x], k) => add(box(w, h, d, c), V(x, y, 0.0), [-0.5, 0.5, 1.2], .70 + k * .004, .72 + k * .004));

  /* двери: группа-шарнир → дверь + ручка */
  const dw = W / 4 - 0.004, dh = H - PL - 0.008, dcy = PL + dh / 2 + 0.004, dz = D / 2 + T / 2 + 0.003;
  const doors = [-W / 2, 0, 0, W / 2].map((hx, k) => {
    const left = k === 0 || k === 2; const g = new THREE.Group();
    const leaf = box(dw, dh, T, C.sage, { roughness: 0.7 }); leaf.position.set(left ? dw / 2 : -dw / 2, 0, 0); g.add(leaf);
    const h = box(0.014, 0.56, 0.02, C.ink); h.position.set(left ? dw - 0.05 : -(dw - 0.05), 1.1 - dcy, T / 2 + 0.01); g.add(h);
    g.position.set(hx, dcy, dz); g.userData = { left, hx, k }; g.scale.setScalar(0.0001); scene.add(g); return g;
  });

  /* размеры холста и камера */
  const target = new THREE.Vector3(0, 1.3, 0);
  let dist = 9, mx = 0, my = 0, mxT = 0, myT = 0;
  const fit = () => {
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    dist = Math.max(1.95 / t, 2.45 / (t * camera.aspect)) * 1.02;
  };
  new ResizeObserver(fit).observe(stage); fit();
  if (fine) addEventListener('pointermove', e => { mxT = (e.clientX / innerWidth - .5); myT = (e.clientY / innerHeight - .5); }, { passive: true });

  const ro = document.getElementById('readout'), roH = document.getElementById('roH'), roW = document.getElementById('roW');
  const nb = n => Math.round(n).toLocaleString('ru-RU').replace(/[\s  ]/g, ' ');

  let cur = reduce ? 1 : M.S.p, t0 = performance.now();
  const apply = (p, time) => {
    /* лазер: замер ниши */
    const sw = ease(seg(p, 0.02, 0.2)), ly = 0.03 + (H - 0.06) * sw;
    laser.position.y = ly;
    laserMat.opacity = p < 0.2 ? 1 : 1 - seg(p, 0.2, 0.25);
    laser.visible = laserMat.opacity > 0.01;
    marks.forEach(g => { g.visible = laser.visible && ly > g.userData.y; g.children.forEach(c => { c.material.opacity = laserMat.opacity; }); });
    if (ro) {
      ro.style.opacity = p < 0.235 ? 1 : 0;
      roH.textContent = nb(ly * 1000); roW.textContent = nb(2404 - 5.2 * ly);
    }

    /* детали: появление в разлёте → сборка */
    parts.forEach(pt => {
      const appear = easeOut(seg(p, 0.22 + pt.i * 0.0028, 0.28 + pt.i * 0.0028));
      const a = ease(seg(p, pt.a0, pt.a1));
      const free = (1 - a) * appear;
      pt.m.visible = appear > 0.001;
      pt.m.scale.setScalar(Math.max(appear, 0.0001));
      const bob = Math.sin(time * 0.0014 + pt.i) * 0.025 * free;
      pt.m.position.set(pt.home.x + pt.E.x * (1 - a), pt.home.y + pt.E.y * (1 - a) + bob, pt.home.z + pt.E.z * (1 - a));
      pt.m.rotation.set(pt.rot.x * (1 - a) * appear, pt.rot.y * (1 - a) * appear, (pt.m.userData.baseRz ?? (pt.m === rod ? Math.PI / 2 : 0)) + pt.rot.z * (1 - a) * appear * (pt.m === rod ? 0 : 1));
    });

    /* двери: прилёт открытыми, закрытие, на финале одно покачивание */
    doors.forEach(g => {
      const k = g.userData.k, s0 = 0.72 + k * 0.012;
      const appear = easeOut(seg(p, s0, s0 + 0.03));
      const d = ease(seg(p, 0.74 + k * 0.015, 0.86 + k * 0.015));
      g.visible = appear > 0.001; g.scale.setScalar(Math.max(appear, 0.0001));
      const sign = g.userData.left ? -1 : 1;
      const swing = Math.sin(Math.PI * seg(p, 0.915, 0.975)) * 1.05;
      g.rotation.y = sign * ((1 - d) * 1.75 + swing);
      const side = k < 2 ? -1 : 1;
      g.position.set(g.userData.hx + side * 1.2 * (1 - d) * (1 - d), dcy + 0.5 * (1 - d) * (1 - d), dz + 2.2 * (1 - d) * (1 - d));
    });

    /* камера */
    const az = THREE.MathUtils.lerp(-0.3, 0.14, ease(p)) + mx * 0.16;
    const el = 0.08 + my * -0.08;
    camera.position.set(target.x + Math.sin(az) * dist * Math.cos(el), target.y + Math.sin(el) * dist + 0.1, target.z + Math.cos(az) * dist * Math.cos(el));
    camera.lookAt(target);
  };

  let visible = true;
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }, { rootMargin: '120px' }).observe(stage);
  const loop = time => {
    requestAnimationFrame(loop);
    if (!visible || document.hidden) return;
    const goal = reduce ? 1 : M.S.p;
    cur += (goal - cur) * (reduce ? 1 : 0.12);
    mx += (mxT - mx) * 0.06; my += (myT - my) * 0.06;
    apply(cur, time - t0);
    renderer.render(scene, camera);
  };
  requestAnimationFrame(loop);
  window.__mkp3d = { apply: p => { cur = p; M.S.p = p; } };
}
