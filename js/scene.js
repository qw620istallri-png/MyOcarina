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
    "......................k.",
    "....................kkGk",
    "..................kkgGGk",
    "........kkkkkkkkkkgggGk.",
    "......kkgggggggggggggk..",
    ".....kggglgggggggggggk..",
    "....kgglggggggggggggGk..",
    "...kgglgggggggggggggGk..",
    "...kyyyyyyyyyyyyyyyyk...",
    "...kHhhhhhhhhhhhhhhHk...",
    "...khhsssssssssssshhk...",
    ".ksshssswesssswessshssk.",
    "..kssssseesssseesssssk..",
    "...kspps" + "ssssssss" + "sppsk...",
    "...kssssssskksssssssk...",
    "....kssssssssssssssk....",
    ".....kkkkkkkkkkkkkk.....",
    "......krrrrrrrrrrrk.....",
    ".....kgrRrgggggggggk....",
    "....kggrRgggggggggggk...",
    "....kbbbbbbbybbbbbbbk...",
    "....kgggggggggggggggk...",
    "......knnnnkknnnnk......",
    "......knnNk..knNnk......",
    ".....kBBBBk..kBBBBk.....",
    ".....kkkkkk..kkkkkk.....",
  ];
  // Ocarina transversal tenu à la bouche (calque par-dessus le corps)
  const OCA = [
    "........kkkkkkkkkkkk....",
    ".......kWooooooooooOOks.",
    "......sskOOOOOOOOOOkss..",
    "........kkkkkkkkkkkk....",
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
    set(state) { if (this.state !== state) { this.state = state; this.stateT = 0; } }
    emit(midi) {
      const col = NOTE_COLORS[((midi % 12) + 12) % 12];
      this.particles.push({ x: 118, y: 60, vx: 0.15 + Math.random() * 0.25, vy: -0.35 - Math.random() * 0.2, life: 1, col, ph: Math.random() * 6 });
    }
    sparkle(n = 14) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        this.particles.push({ x: 96, y: 55, vx: Math.cos(a) * 0.8, vy: Math.sin(a) * 0.8 - 0.4, life: 1, col: NOTE_COLORS[i % 12], star: true });
      }
    }
    px(x, y, w, h, col) { this.ctx.fillStyle = col; this.ctx.fillRect(Math.round(x) * this.scale, Math.round(y) * this.scale, w * this.scale, h * this.scale); }

    frame(ts) {
      const dt = this.last ? Math.min(50, ts - this.last) : 16;
      this.last = ts; this.t += dt / 1000; this.stateT += dt / 1000;
      const ctx = this.ctx, s = this.scale, W = this.W, H = this.H;
      // ciel en bandes (dégradé « pixel »)
      const sky = ["#7ec8e3", "#9bd4e6", "#b7dfe6", "#d4e8df", "#f3e9c9", "#f8dcae"];
      sky.forEach((c, i) => this.px(0, i * 10, W, 10, c));
      // soleil
      this.px(158, 16, 14, 14, "#ffe9a3"); this.px(160, 14, 10, 18, "#ffe9a3"); this.px(156, 18, 18, 10, "#ffe9a3");
      this.px(161, 19, 8, 8, "#fff6d1");
      // nuages
      this.clouds.forEach((cl) => {
        cl.x += dt * 0.002; if (cl.x > W + 10) cl.x = -cl.w - 10;
        this.px(cl.x, cl.y + 3, cl.w, 5, "#ffffff"); this.px(cl.x + 4, cl.y, cl.w - 10, 4, "#ffffff");
        this.px(cl.x + 2, cl.y + 8, cl.w - 4, 1, "#e3eef2");
      });
      // collines
      for (let x = 0; x < W; x++) {
        const h1 = 58 + Math.round(Math.sin(x / 23) * 5 + Math.sin(x / 9) * 2);
        this.px(x, h1, 1, H - h1, "#8cc56c");
        const h2 = 70 + Math.round(Math.sin(x / 31 + 2) * 4);
        this.px(x, h2, 1, H - h2, "#6bb055");
      }
      // arbres au loin
      [[18, 52], [40, 56], [176, 54], [150, 60]].forEach(([x, y]) => {
        this.px(x + 3, y + 10, 3, 6, "#7a4b28");
        this.px(x, y + 2, 9, 9, "#3f8a3a"); this.px(x + 2, y, 5, 13, "#3f8a3a"); this.px(x + 2, y + 2, 3, 3, "#5aa64a");
      });
      // petite maison
      const hx = 140, hy = 66;
      this.px(hx, hy + 8, 26, 14, "#c98c55"); this.px(hx, hy + 8, 26, 1, "#a8703f");
      for (let i = 0; i < 9; i++) this.px(hx - 3 + i * 2, hy + 8 - i, 32 - i * 4, 1, "#b8453a");
      this.px(hx + 4, hy + 13, 6, 9, "#7a4b28"); this.px(hx + 15, hy + 12, 6, 5, "#ffe9a3");
      this.px(hx + 17, hy + 12, 1, 5, "#7a4b28"); this.px(hx + 15, hy + 14, 6, 1, "#7a4b28");
      this.px(hx + 20, hy - 2, 3, 6, "#8a5a3a");
      // fumée
      for (let i = 0; i < 3; i++) {
        const k = (this.t * 0.4 + i / 3) % 1;
        this.px(hx + 21 + Math.sin(k * 6 + i) * 2, hy - 4 - k * 18, 2, 2, `rgba(255,255,255,${0.7 * (1 - k)})`);
      }
      // sol
      this.px(0, 88, W, H - 88, "#5aa64a");
      for (let x = 0; x < W; x += 3) this.px(x + ((x * 7) % 2), 88 + ((x * 13) % 5), 1, 2, "#4a9440");
      // chemin
      for (let y = 88; y < H; y++) { const w = 20 + (y - 88) * 1.6; this.px(96 - w / 2 + 6, y, w, 1, "#d9b77e"); }
      // clôture
      for (let x = 2; x < 70; x += 10) { this.px(x, 78, 3, 12, "#9b6a3f"); this.px(x, 78, 3, 1, "#c08a55"); }
      this.px(0, 81, 72, 2, "#b07a48"); this.px(0, 86, 72, 2, "#b07a48");
      // fleurs
      [[20, 96, "#ff9ccf"], [36, 102, "#ffd166"], [60, 94, "#ffffff"], [150, 98, "#ff8a80"], [170, 104, "#a99bff"], [185, 94, "#ffd166"], [8, 106, "#ffffff"]].forEach(([x, y, c]) => {
        this.px(x, y + 2, 1, 3, "#3f8a3a"); this.px(x - 1, y + 1, 3, 1, c); this.px(x, y, 1, 3, c); this.px(x, y + 1, 1, 1, "#ffe9a3");
      });
      // lucioles
      this.flies.forEach((f) => {
        f.p += dt * 0.002; const a = (Math.sin(f.p * 2) + 1) / 2;
        this.px(f.x + Math.sin(f.p) * 6, f.y + Math.cos(f.p * 1.3) * 3, 1, 1, `rgba(255,240,150,${0.3 + a * 0.6})`);
      });

      // ---- héros
      let bob = 0, shake = 0;
      if (this.state === "idle") bob = Math.round(Math.sin(this.t * 2.2) * 0.6 + 0.4);
      if (this.state === "play") bob = Math.round(Math.sin(this.t * 6) * 0.5 + 0.5);
      if (this.state === "happy") bob = -Math.round(Math.abs(Math.sin(this.stateT * 9)) * 5);
      if (this.state === "oops") shake = Math.round(Math.sin(this.stateT * 40) * 1);
      const hx0 = 72 + shake, hy0 = 37 + bob;
      // ombre
      this.px(80, 87, 34, 3, "rgba(40,60,30,.35)");
      const body = BODY.slice();
      const setc = (row, col, ch) => { body[row] = body[row].slice(0, col) + ch + body[row].slice(col + 1); };
      const eyes = (kind) => {
        [8, 9, 14, 15].forEach((c) => { setc(11, c, "s"); setc(12, c, "s"); });
        if (kind === "closed") [8, 9, 14, 15].forEach((c) => setc(12, c, "k"));
        else if (kind === "happy") { [8, 9, 14, 15].forEach((c) => setc(11, c, "k")); [7, 10, 13, 16].forEach((c) => setc(12, c, "k")); }
        else if (kind === "oops") { setc(11, 8, "k"); setc(12, 9, "k"); setc(11, 15, "k"); setc(12, 14, "k"); }
      };
      const blink = (this.t % 4) < 0.12;
      if (this.state === "play") eyes("closed");
      else if (this.state === "happy") eyes("happy");
      else if (this.state === "oops") eyes("oops");
      else if (blink) eyes("closed");
      const hs = s * 2; // le héros est dessiné en « gros pixels »
      drawRows(ctx, body, hx0 * s, hy0 * s, hs);
      if (this.state !== "happy") {
        drawRows(ctx, OCA, hx0 * s, (hy0 + OCA_Y * 2) * s, hs);
      } else {
        drawRows(ctx, [".ks..................sk.", ".ks..................sk."], hx0 * s, (hy0 + 17 * 2) * s, hs);
        drawRows(ctx, ["kkkkkk", "kWoooOk", "kOOOOk", ".kkkk"], (hx0 + 42) * s, (hy0 + 12) * s, hs);
      }
      if (this.state === "oops") {
        // goutte de sueur
        this.px(hx0 + 44, hy0 + 18, 2, 2, "#7fb4ff"); this.px(hx0 + 43, hy0 + 20, 4, 4, "#7fb4ff");
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
    canvas.width = 26 * scale; canvas.height = 26 * scale;
    ctx.imageSmoothingEnabled = false;
    drawRows(ctx, BODY, 1 * scale, 0, scale);
    drawRows(ctx, OCA, 1 * scale, OCA_Y * scale, scale);
  };
})();
