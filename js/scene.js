// =====================================================================
//  Scène pixel-art : décor de campagne cozy + petit héros elfe original
// =====================================================================
(function () {
  const PAL = {
    k: "#2a1c14", g: "#4f9e40", G: "#2f6b2a", l: "#86c95e", y: "#f2c94c",
    h: "#9a5b2c", H: "#6e3d1c", s: "#f6cba3", S: "#dba27c", e: "#2a1c14",
    w: "#ffffff", p: "#ef8f86", r: "#d24b3e", R: "#9e2f27", b: "#6b4223",
    n: "#efe2c4", N: "#cbb994", B: "#5a3a22", o: "#5b8fe0", O: "#2f5aa8", W: "#cfe6ff",
    Y: "#e8c66a", D: "#b8923a", t: "#f2ead8", T: "#cfc4a8", j: "#3ab0a0", m: "#a8b0c0", M: "#6a7282",
    c: "#8a8e98", C: "#5e626c", i: "#e6ecf4",
  };
  Object.assign(PAL, (window.HERO && window.HERO.pal) || {});

  // ---- héros : assemblage des calques (corps, visage, chapeau du décor, ocarina) + contour
  const HD = window.HERO;
  const heroCache = {};
  function heroGrid(costume, state, blink) {
    const key = costume + "|" + state + "|" + (blink ? 1 : 0);
    if (heroCache[key]) return heroCache[key];
    const c = HD.C[costume] || HD.C.default;
    const eyes = { idle: blink ? "eyesClosed" : "eyesOpen", play: "eyesClosed", happy: "eyesHappy", oops: "eyesOops" }[state];
    const lay = [];
    if (c.back) lay.push(c.back);
    lay.push(HD.L.body, HD.L.head);
    if (costume !== "hobbit") lay.push(HD.L.hair);
    lay.push(HD.L[eyes]);
    if (state === "happy") lay.push(HD.L.mouthSmile);
    lay.push(c.hat);
    if (c.front) lay.push(c.front);
    lay.push(state === "happy" ? HD.L.armsUp : HD.L.oca);
    const W = HD.W, H = HD.H, g = new Array(W * H).fill(null);
    lay.forEach((L) => L.forEach(([y, x0, str]) => {
      for (let i = 0; i < str.length; i++) { const ch = str[i]; if (ch !== ".") g[y * W + x0 + i] = ch === "_" ? null : ch; }
    }));
    const out = g.slice();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g[y * W + x]) continue;
      if ((x > 0 && g[y * W + x - 1]) || (x < W - 1 && g[y * W + x + 1]) || (y > 0 && g[(y - 1) * W + x]) || (y < H - 1 && g[(y + 1) * W + x])) out[y * W + x] = "k";
    }
    return (heroCache[key] = out);
  }
  function drawHero(ctx, grid, x, y, s, pal, rows) {
    const W = HD.W, H = rows || HD.H;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const c = grid[j * W + i];
      if (!c) continue;
      ctx.fillStyle = pal[c] || c;
      ctx.fillRect(x + i * s, y + j * s, s, s);
    }
  }

  function drawRows(ctx, rows, x, y, s, pal) {
    for (let j = 0; j < rows.length; j++) {
      const row = rows[j];
      for (let i = 0; i < row.length; i++) {
        const c = row[i];
        if (c === "." || c === " ") continue;
        ctx.fillStyle = (pal || PAL)[c] || c;
        ctx.fillRect(x + i * s, y + j * s, s, s);
      }
    }
  }

  const NOTE_COLORS = ["#ff8a80", "#ffab70", "#ffd166", "#f4e285", "#b8e07a", "#7ed6a5",
    "#6fd3d8", "#7fb4ff", "#a99bff", "#d59cff", "#ff9ccf", "#ff8fa8"];

  const NOTE_SPRITE = [
    "..kk",
    "..kxk",
    "..k.k",
    "kkk..",
    "kxk..",
    "kk...",
  ];

  class Scene {
    constructor(canvas) {
      this.c = canvas;
      this.ctx = canvas.getContext("2d");
      this.W = 200; this.H = 112;
      this.state = "idle"; this.stateT = 0;
      this.particles = [];
      this.t = 0;
      this.theme = "vallee"; this.weather = []; this.pulse = 0; this.fade = 0;
      this.flies = Array.from({ length: 7 }, () => ({ x: Math.random() * 200, y: 40 + Math.random() * 50, p: Math.random() * 6 }));
      this.clouds = [{ x: 20, y: 14, w: 26 }, { x: 120, y: 8, w: 34 }, { x: 175, y: 22, w: 20 }];
      this.resize();
      window.addEventListener("resize", () => this.resize());
      const loop = (ts) => { this.frame(ts); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
    resize() {
      const r = this.c.getBoundingClientRect();
      const scale = Math.max(1, Math.floor((r.width * (window.devicePixelRatio || 1)) / this.W));
      this.scale = scale;
      this.c.width = this.W * scale; this.c.height = this.H * scale;
      this.ctx.imageSmoothingEnabled = false;
    }
    setTheme(id) {
      if (id === this.theme) return;
      this.theme = id; this.weather = []; this.fade = 1; this.flash = 0;
    }
    get outfit() { const th = window.THEMES && window.THEMES[this.theme]; return Object.assign({}, PAL, (th && th.outfit) || {}); }
    set(state) { if (this.state !== state) { this.state = state; this.stateT = 0; } }
    emit(midi) {
      const col = NOTE_COLORS[((midi % 12) + 12) % 12];
      this.pulse = 1;
      const th = window.THEMES && window.THEMES[this.theme];
      if (th && th.onNote) th.onNote(this, 0, midi);
      this.particles.push({ x: 112, y: 56, vx: 0.15 + Math.random() * 0.25, vy: -0.35 - Math.random() * 0.2, life: 1, col, ph: Math.random() * 6 });
    }
    sparkle(n = 14) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        this.particles.push({ x: 96, y: 45, vx: Math.cos(a) * 0.8, vy: Math.sin(a) * 0.8 - 0.4, life: 1, col: NOTE_COLORS[i % 12], star: true });
      }
    }
    px(x, y, w, h, col) { this.ctx.fillStyle = col; this.ctx.fillRect(Math.round(x) * this.scale, Math.round(y) * this.scale, w * this.scale, h * this.scale); }

    frame(ts) {
      const dt = this.last ? Math.min(50, ts - this.last) : 16;
      this.last = ts; this.t += dt / 1000; this.stateT += dt / 1000;
      const ctx = this.ctx, s = this.scale, W = this.W, H = this.H;
      // ---- décor du thème de la chanson
      const th = (window.THEMES && window.THEMES[this.theme]) || null;
      this.pulse = Math.max(0, (this.pulse || 0) - dt / 400);
      this.groundCol = null;
      if (th) th.draw(this, dt);
      // fondu lors d'un changement de décor
      if (this.fade > 0) { this.fade = Math.max(0, this.fade - dt / 500); this.px(0, 0, W, H, `rgba(255,248,230,${this.fade})`); }

      // ---- héros
      let bob = 0, shake = 0;
      if (this.state === "idle") bob = Math.round(Math.sin(this.t * 2.2) * 0.6 + 0.4);
      if (this.state === "play") bob = Math.round(Math.sin(this.t * 6) * 0.5 + 0.5);
      if (this.state === "happy") bob = -Math.round(Math.abs(Math.sin(this.stateT * 9)) * 5);
      if (this.state === "oops") shake = Math.round(Math.sin(this.stateT * 40) * 1);
      const hx0 = 76 + shake, hy0 = 32 + bob;
      // ombre
      this.px(82, 87, 28, 2, "rgba(40,60,30,.35)"); this.px(85, 89, 22, 1, "rgba(40,60,30,.2)");
      const blink = (this.t % 4) < 0.12;
      const th0 = window.THEMES && window.THEMES[this.theme];
      const st = ["play", "happy", "oops"].includes(this.state) ? this.state : "idle";
      drawHero(ctx, heroGrid((th0 && th0.costume) || "default", st, blink), hx0 * s, hy0 * s, s, this.outfit);
      if (this.state === "oops") {
        // goutte de sueur
        this.px(hx0 + 33, hy0 + 12, 1, 1, "#cfe6ff"); this.px(hx0 + 32, hy0 + 13, 3, 2, "#7fb4ff"); this.px(hx0 + 33, hy0 + 15, 1, 1, "#7fb4ff");
      }

      // météo et premier plan devant le héros
      if (th) { window.drawWeather(this, dt, th.weather); window.drawForeground(this); }
      // ---- particules (notes de musique + étoiles)
      this.particles = this.particles.filter((p) => p.life > 0);
      this.particles.forEach((p) => {
        p.x += p.vx * dt * 0.06; p.y += p.vy * dt * 0.06;
        if (!p.star) p.x += Math.sin((p.ph += dt * 0.006)) * 0.15;
        else p.vy += 0.0015 * dt;
        p.life -= dt / (p.star ? 900 : 2200);
        if (p.star) { this.px(p.x, p.y, 2, 2, p.col); this.px(p.x - 1, p.y + 0.5, 4, 1, p.col); }
        else drawRows(ctx, NOTE_SPRITE, Math.round(p.x) * s, Math.round(p.y) * s, s, { k: p.col, x: "#fff" });
      });
      if (this.state === "happy" && this.stateT > 1.4) this.set("idle");
      if (this.state === "oops" && this.stateT > 0.6) this.set("idle");
    }
  }

  window.Scene = Scene;
  window.NOTE_COLORS = NOTE_COLORS;
  window.drawHeroIcon = function (canvas, scale) {
    const ctx = canvas.getContext("2d");
    canvas.width = 40 * scale; canvas.height = 40 * scale;
    ctx.imageSmoothingEnabled = false;
    drawHero(ctx, heroGrid("default", "idle", false), 0, 3 * scale, scale, PAL, 37);
  };
})();
