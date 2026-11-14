// =====================================================================
//  Scène pixel-art : décor de campagne cozy + petit héros elfe original
// =====================================================================
(function () {
  const PAL = {
    k: "#2a1c14", g: "#4f9e40", G: "#2f6b2a", l: "#86c95e", y: "#f2c94c",
    h: "#9a5b2c", H: "#6e3d1c", s: "#f6cba3", S: "#dba27c", e: "#2a1c14",
    w: "#ffffff", p: "#ef8f86", r: "#d24b3e", R: "#9e2f27", b: "#6b4223",
    n: "#efe2c4", N: "#cbb994", B: "#5a3a22", o: "#5b8fe0", O: "#2f5aa8", W: "#cfe6ff",
  };

  // Corps du héros (20 x 21). Bonnet vert pointu qui retombe, écharpe rouge.
  const BODY = [
    "..................kk..",
    "................kkGk..",
    "..............kkgGk...",
    ".......kkkkkkkgggk....",
    ".....kkggglggggGk.....",
    "....kgggllgggggGk.....",
    "....kgglgggggggGk.....",
    "...kgglggggggggGGk....",
    "...kyyyyyyyyyyyyyk....",
    "...kHhhhhhhhhhhhHk....",
    "...khhssssssssshhk....",
    ".ksshsswessswesshssk..",
    "..ksssseesssseesssk...",
    "...kspssssssssspsk....",
    "...ksssssskksssssk....",
    "....ksssssssssssk.....",
    ".......kSSSSSSk.......",
    ".....krrrrrrrrrrk.....",
    "....kgrRrggggggggk....",
    "....kggrRggggggggk....",
    "...kgggrRgggggggggk...",
    "...kggggggggggggggk...",
    "...kbbbbbbybbbbbbbk...",
    "...kggggggggggggggk...",
    "...kGGGGGGGGGGGGGGk...",
    ".....knnnk..knnnk.....",
    ".....knnNk..kNnnk.....",
    ".....knnnk..knnnk.....",
    "....kBBBBk..kBBBBk....",
    "....kkkkkk..kkkkkk....",
  ];
  // Ocarina transversal tenu à la bouche (calque par-dessus le corps)
  const OCA = [
    "......kkkkkkkkkkk.....",
    ".....kWoooooooooOOk...",
    "....sskOOOOOOOOOOkss..",
    "....ggkkkkkkkkkkkgg...",
  ];
  const OCA_Y = 14;

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
      if (th) { th.draw(this, dt); window.drawWeather(this, dt, th.weather); }
      // fondu lors d'un changement de décor
      if (this.fade > 0) { this.fade = Math.max(0, this.fade - dt / 500); this.px(0, 0, W, H, `rgba(255,248,230,${this.fade})`); }

      // ---- héros
      let bob = 0, shake = 0;
      if (this.state === "idle") bob = Math.round(Math.sin(this.t * 2.2) * 0.6 + 0.4);
      if (this.state === "play") bob = Math.round(Math.sin(this.t * 6) * 0.5 + 0.5);
      if (this.state === "happy") bob = -Math.round(Math.abs(Math.sin(this.stateT * 9)) * 5);
      if (this.state === "oops") shake = Math.round(Math.sin(this.stateT * 40) * 1);
      const hx0 = 74 + shake, hy0 = 28 + bob;
      // ombre
      this.px(82, 87, 30, 3, "rgba(40,60,30,.35)");
      const body = BODY.slice();
      const setc = (row, col, ch) => { body[row] = body[row].slice(0, col) + ch + body[row].slice(col + 1); };
      const eyes = (kind) => {
        [7, 8, 12, 13].forEach((c) => { setc(11, c, "s"); setc(12, c, "s"); });
        if (kind === "closed") [7, 8, 12, 13].forEach((c) => setc(12, c, "k"));
        else if (kind === "happy") { [7, 8, 12, 13].forEach((c) => setc(11, c, "k")); [6, 9, 11, 14].forEach((c) => setc(12, c, "k")); }
        else if (kind === "oops") { setc(11, 7, "k"); setc(12, 8, "k"); setc(11, 13, "k"); setc(12, 12, "k"); }
      };
      const blink = (this.t % 4) < 0.12;
      if (this.state === "play") eyes("closed");
      else if (this.state === "happy") eyes("happy");
      else if (this.state === "oops") eyes("oops");
      else if (blink) eyes("closed");
      const hs = s * 2; // le héros est dessiné en « gros pixels »
      const pal = this.outfit;
      drawRows(ctx, body, hx0 * s, hy0 * s, hs, pal);
      if (this.state !== "happy") {
        drawRows(ctx, OCA, hx0 * s, (hy0 + OCA_Y * 2) * s, hs, pal);
      } else {
        drawRows(ctx, ["ks................ks", "gk................kg", "gk................kg"], (hx0 + 1) * s, (hy0 + 15 * 2) * s, hs, pal);
        drawRows(ctx, ["kkkkkk", "kWoooOk", "kOOOOk", ".kkkk"], (hx0 + 38) * s, (hy0 + 14) * s, hs);
      }
      if (this.state === "oops") {
        // goutte de sueur
        this.px(hx0 + 38, hy0 + 16, 2, 2, "#7fb4ff"); this.px(hx0 + 37, hy0 + 18, 4, 4, "#7fb4ff");
      }

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
    canvas.width = 32 * scale; canvas.height = 32 * scale;
    ctx.imageSmoothingEnabled = false;
    drawRows(ctx, BODY, 5 * scale, 1 * scale, scale);
    drawRows(ctx, OCA, 5 * scale, (1 + OCA_Y) * scale, scale);
  };
})();
