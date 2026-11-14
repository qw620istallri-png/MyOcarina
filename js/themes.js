// =====================================================================
//  Décors animés : un univers par chanson (ciel, paysage, météo, tenue)
//  Chaque thème dessine le fond en « pixels » logiques (200 x 112).
//  outfit : couleurs qui remplacent celles du héros (tunique, bonnet…)
//  onNote : petite réaction du décor à chaque note jouée
// =====================================================================
(function () {
  // ---------------------------------------------------- briques de décor
  const B = {
    sky(S, cols) {
      cols.forEach((c, i) => S.px(0, i * 10, S.W, 10, c));
      S.px(0, cols.length * 10, S.W, 40, cols[cols.length - 1]);
      // tramage entre les bandes pour un dégradé « pixel art » plus doux
      for (let i = 1; i < cols.length; i++) {
        const y = i * 10;
        for (let x = 0; x < S.W; x += 2) {
          S.px(x, y - 2, 1, 1, cols[i]); S.px(x + 1, y - 1, 1, 1, cols[i]);
          S.px(x + 1, y, 1, 1, cols[i - 1]); S.px(x, y + 1, 1, 1, cols[i - 1]);
        }
      }
    },
    sun(S, x, y, c1 = "#ffe9a3", c2 = "#fff6d1", pulse = 0) {
      const r = Math.round(pulse * 2);
      S.px(x - r, y + 2 - r, 14 + 2 * r, 10 + 2 * r, c1); S.px(x + 2 - r, y - r, 10 + 2 * r, 14 + 2 * r, c1); S.px(x + 3, y + 3, 8, 8, c2);
    },
    moon(S, x, y) { S.px(x, y + 2, 12, 8, "#f4f1d0"); S.px(x + 2, y, 8, 12, "#f4f1d0"); S.px(x + 5, y + 1, 7, 9, S.skyTop || "#1d2850"); },
    stars(S, n, seed = 1) {
      for (let i = 0; i < n; i++) {
        const x = (i * 73 + seed * 31) % 200, y = (i * 37 + seed * 17) % 55;
        const a = 0.35 + 0.65 * Math.abs(Math.sin(S.t * 1.5 + i));
        S.px(x, y, 1, 1, `rgba(255,250,220,${a})`);
      }
    },
    clouds(S, dt, col = "#ffffff", shade = "#e3eef2", speed = 0.002) {
      S.clouds.forEach((cl) => {
        cl.x += dt * speed; if (cl.x > S.W + 10) cl.x = -cl.w - 10;
        S.px(cl.x, cl.y + 3, cl.w, 5, col); S.px(cl.x + 4, cl.y, cl.w - 10, 4, col); S.px(cl.x + 2, cl.y + 8, cl.w - 4, 1, shade);
      });
    },
    hills(S, base, amp, freq, phase, col) {
      for (let x = 0; x < S.W; x++) {
        const h = base + Math.round(Math.sin(x / freq + phase) * amp + Math.sin(x / (freq / 2.6) + phase) * amp * 0.35);
        S.px(x, h, 1, S.H - h, col);
      }
    },
    mountains(S, base, col, snow) {
      for (let x = 0; x < S.W; x++) {
        const t = (x % 50) / 50, peak = base - 30 + Math.abs(t - 0.5) * 60 + ((x / 50) | 0) % 2 * 6;
        S.px(x, peak, 1, S.H - peak, col);
        if (snow && peak < base - 16) S.px(x, peak, 1, base - 16 - peak, snow);
      }
    },
    tree(S, x, y, c = "#3f8a3a", hl = "#5aa64a", trunk = "#7a4b28", sway = 0) {
      const o = Math.round(Math.sin(S.t * 1.5 + x) * sway);
      S.px(x + 3, y + 10, 3, 6, trunk);
      S.px(x + o, y + 2, 9, 9, c); S.px(x + 2 + o, y, 5, 13, c); S.px(x + 2 + o, y + 2, 3, 3, hl);
    },
    bigTree(S, x, y, c, hl, trunk) {
      S.px(x + 7, y + 14, 6, 30, trunk); S.px(x + 5, y + 40, 10, 4, trunk);
      S.px(x, y + 4, 20, 14, c); S.px(x + 3, y, 14, 22, c); S.px(x + 5, y + 3, 5, 4, hl);
    },
    pine(S, x, y, c = "#2f6b3a", snow) {
      S.px(x + 3, y + 14, 2, 4, "#5a3a22");
      for (let i = 0; i < 7; i++) S.px(x + 4 - Math.ceil(i / 1.5), y + i * 2, Math.ceil(i / 1.5) * 2 + 1, 2, c);
      if (snow) { S.px(x + 3, y, 3, 1, snow); S.px(x + 1, y + 6, 2, 1, snow); S.px(x + 6, y + 9, 2, 1, snow); }
    },
    ground(S, c1, c2, y = 88) {
      S.groundCol = c2;
      S.px(0, y, S.W, S.H - y, c1);
      for (let i = 0; i < 40; i++) S.px((i * 53) % 200, y + 4 + ((i * 29) % (S.H - y - 4)), 2, 1, c2);
      for (let x = 0; x < S.W; x += 3) S.px(x + ((x * 7) % 2), y + ((x * 13) % 5), 1, 2, c2);
    },
    path(S, col, y = 88) { for (let yy = y; yy < S.H; yy++) { const w = 20 + (yy - y) * 1.6; S.px(96 - w / 2 + 6, yy, w, 1, col); } },
    house(S, hx, hy, wall = "#c98c55", roof = "#b8453a", lit = "#ffe9a3") {
      S.px(hx, hy + 8, 26, 14, wall); S.px(hx, hy + 8, 26, 1, "rgba(0,0,0,.15)");
      for (let i = 0; i < 9; i++) S.px(hx - 3 + i * 2, hy + 8 - i, 32 - i * 4, 1, roof);
      S.px(hx + 4, hy + 13, 6, 9, "#7a4b28"); S.px(hx + 15, hy + 12, 6, 5, lit);
      S.px(hx + 17, hy + 12, 1, 5, "#7a4b28"); S.px(hx + 15, hy + 14, 6, 1, "#7a4b28");
      S.px(hx + 20, hy - 2, 3, 6, "#8a5a3a");
      for (let i = 0; i < 3; i++) {
        const k = (S.t * 0.4 + i / 3) % 1;
        S.px(hx + 21 + Math.sin(k * 6 + i) * 2, hy - 4 - k * 18, 2, 2, `rgba(255,255,255,${0.7 * (1 - k)})`);
      }
    },
    fence(S, x0, x1, col = "#9b6a3f", rail = "#b07a48") {
      for (let x = x0; x < x1; x += 10) { S.px(x, 78, 3, 12, col); S.px(x, 78, 3, 1, "rgba(255,255,255,.2)"); }
      S.px(x0, 81, x1 - x0, 2, rail); S.px(x0, 86, x1 - x0, 2, rail);
    },
    flowers(S, list) {
      list.forEach(([x, y, c], i) => {
        const o = Math.round(Math.sin(S.t * 2 + i) * 0.6);
        S.px(x, y + 2, 1, 3, "#3f8a3a"); S.px(x - 1 + o, y + 1, 3, 1, c); S.px(x + o, y, 1, 3, c); S.px(x + o, y + 1, 1, 1, "#ffe9a3");
      });
    },
    flies(S, dt, col = "255,240,150", boost = 0) {
      S.flies.forEach((f) => {
        f.p += dt * 0.002; const a = (Math.sin(f.p * 2) + 1) / 2;
        S.px(f.x + Math.sin(f.p) * 6, f.y + Math.cos(f.p * 1.3) * 3, 1 + (boost > .5 ? 1 : 0), 1 + (boost > .5 ? 1 : 0), `rgba(${col},${Math.min(1, 0.3 + a * 0.6 + boost)})`);
      });
    },
    water(S, y, c1, c2, c3) {
      S.px(0, y, S.W, S.H - y, c1);
      for (let row = 0; row < 6; row++) for (let x = 0; x < S.W; x += 12) {
        const xx = (x + S.t * (6 + row * 3) + row * 7) % (S.W + 12) - 6;
        S.px(xx, y + 3 + row * 4, 5, 1, row % 2 ? c2 : c3);
      }
    },
    castle(S, x, y, col, win) {
      S.px(x, y + 10, 50, 30, col);
      [[0, 0], [20, -8], [40, 0]].forEach(([dx, dy]) => { S.px(x + dx, y + dy, 10, 20 - dy, col); for (let i = 0; i < 3; i++) S.px(x + dx + i * 4, y + dy - 2, 2, 2, col); });
      S.px(x + 24, y - 14, 2, 6, col); S.px(x + 26, y - 14, 5, 3, "#d24b3e");
      [[5, 12], [25, 6], [45, 12], [15, 22], [35, 22]].forEach(([dx, dy], i) => S.px(x + dx - 1, y + dy, 2, 3, (Math.sin(S.t + i * 2) > -0.6) ? win : col));
    },
    windmill(S, x, y, speed) {
      S.px(x, y, 12, 30, "#8a6a4a"); S.px(x + 1, y, 10, 1, "#6e4f33");
      for (let i = -1; i < 4; i++) S.px(x - 1 + i, y - 4 + i, 14 - i * 2, 1, "#6e4f33");
      S.px(x + 4, y + 20, 4, 10, "#4a3220");
      const cx = x + 6, cy = y + 4, a0 = S.t * speed;
      for (let b = 0; b < 4; b++) {
        const a = a0 + (b * Math.PI) / 2;
        for (let r = 2; r < 18; r++) S.px(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2, 2, r > 6 ? "#e8dcc0" : "#6e4f33");
      }
    },
    dunes(S, base, c1, c2) {
      for (let x = 0; x < S.W; x++) {
        const h = base + Math.round(Math.sin(x / 26 + 1) * 6 + Math.sin(x / 11) * 2);
        S.px(x, h, 1, S.H - h, c1); S.px(x, h, 1, 1, c2);
      }
    },
    volcano(S, x, y, glow) {
      for (let i = 0; i < 40; i++) S.px(x - i * 1.4, y + i, 8 + i * 2.8, 1, i < 3 ? glow : "#5a2a22");
      for (let i = 0; i < 4; i++) { const k = (S.t * 0.3 + i / 4) % 1; S.px(x + 2 + Math.sin(k * 5 + i) * 4, y - 4 - k * 28, 3, 3, `rgba(70,50,50,${0.6 * (1 - k)})`); }
    },
    hobbitHole(S, x, y) {
      for (let i = 0; i < 16; i++) S.px(x - 20 + i, y + 16 - Math.round(Math.sqrt(256 - (16 - i) ** 2)), 1, 30, "#6bb055");
      S.px(x - 4, y + 16 - 16, 40, 30, "#6bb055");
      for (let i = 0; i < 16; i++) S.px(x + 36 + i, y + 16 - Math.round(Math.sqrt(256 - i * i)), 1, 30, "#6bb055");
      // porte ronde
      for (let i = 0; i < 9; i++) { const w = Math.round(2 * Math.sqrt(81 - (9 - i) ** 2)); S.px(x + 16 - w / 2, y + 8 + i, w, 1, "#2f6b2a"); }
      S.px(x + 7, y + 17, 18, 8, "#2f6b2a");
      for (let i = 0; i < 8; i++) { const w = Math.round(2 * Math.sqrt(64 - (8 - i) ** 2)); S.px(x + 16 - w / 2, y + 9 + i, w, 1, "#3f8a3a"); }
      S.px(x + 8, y + 17, 16, 8, "#3f8a3a"); S.px(x + 15, y + 16, 2, 2, "#f2c94c");
      S.px(x + 30, y + 12, 6, 6, "#ffe9a3"); S.px(x + 32, y + 12, 1, 6, "#7a4b28"); S.px(x + 30, y + 14, 6, 1, "#7a4b28");
    },
    crops(S, x0, x1, y, col) {
      for (let r = 0; r < 3; r++) for (let x = x0; x < x1; x += 6) {
        const o = Math.round(Math.sin(S.t * 2 + x / 9) * 0.6);
        S.px(x, y + r * 6, 5, 2, "#7a4b28"); S.px(x + 2 + o, y + r * 6 - 3, 1, 3, "#4a9440"); S.px(x + 1 + o, y + r * 6 - 4, 3, 2, col);
      }
    },
    pedestal(S, x, y, glow) {
      S.px(x, y + 10, 30, 6, "#b9b2a4"); S.px(x + 4, y + 4, 22, 6, "#d6cfc0"); S.px(x + 2, y + 16, 26, 2, "#8f877a");
      const a = 0.25 + 0.2 * Math.sin(S.t * 2) + glow * 0.3;
      for (let i = 0; i < 5; i++) S.px(x + 6 + i * 4, 0, 2, y + 4, `rgba(255,250,210,${a * (0.5 + (i % 2) * 0.5)})`);
    },
  };

  // ---------------------------------------------------- météo
  function weather(S, dt, kind) {
    if (!kind) return;
    const spawn = { rain: 3, snow: 0.6, leaves: 0.12, petals: 0.15, sparkles: 0.3, embers: 0.4, sand: 1.2, bubbles: 0.2 }[kind] || 0;
    S.wAcc = (S.wAcc || 0) + spawn * dt / 16;
    while (S.wAcc >= 1) {
      S.wAcc--;
      const p = { x: Math.random() * 220 - 10, y: -4, life: 1, k: kind, ph: Math.random() * 6 };
      if (kind === "embers" || kind === "bubbles") { p.y = 112; }
      if (kind === "sand") { p.x = -4; p.y = 40 + Math.random() * 70; }
      if (kind === "sparkles") { p.y = Math.random() * 100; }
      S.weather.push(p);
    }
    S.weather = S.weather.filter((p) => p.life > 0 && p.y < 120 && p.y > -10 && p.x < 215);
    S.weather.forEach((p) => {
      p.ph += dt * 0.004;
      switch (p.k) {
        case "rain": p.x -= dt * 0.05; p.y += dt * 0.25; S.px(p.x, p.y, 1, 3, "rgba(190,210,255,.7)"); break;
        case "snow": p.x += Math.sin(p.ph) * 0.3; p.y += dt * 0.02; S.px(p.x, p.y, 1, 1, "#ffffff"); break;
        case "leaves": p.x += Math.sin(p.ph) * 0.6 + 0.1; p.y += dt * 0.015; S.px(p.x, p.y, 2, 1, p.ph % 2 > 1 ? "#e0a03a" : "#9ccf5a"); break;
        case "petals": p.x += Math.sin(p.ph) * 0.5 + 0.15; p.y += dt * 0.014; S.px(p.x, p.y, 2, 1, "#ffc2d6"); break;
        case "sparkles": p.life -= dt / 1400; { const a = Math.sin(p.life * Math.PI); S.px(p.x, p.y, 1, 1, `rgba(255,240,255,${a})`); if (a > .7) { S.px(p.x - 1, p.y, 3, 1, `rgba(255,200,240,${a * .6})`); } } break;
        case "embers": p.x += Math.sin(p.ph) * 0.3; p.y -= dt * 0.03; p.life -= dt / 3500; S.px(p.x, p.y, 1, 1, `rgba(255,${150 + Math.round(80 * p.life)},60,${p.life})`); break;
        case "sand": p.x += dt * 0.18; p.y += Math.sin(p.ph) * 0.2; S.px(p.x, p.y, 2, 1, "rgba(240,210,150,.6)"); break;
        case "bubbles": p.x += Math.sin(p.ph) * 0.3; p.y -= dt * 0.02; p.life -= dt / 6000; S.px(p.x, p.y, 2, 2, "rgba(220,240,255,.5)"); break;
      }
    });
  }

  const FLOWERS = [[20, 96, "#ff9ccf"], [36, 102, "#ffd166"], [60, 94, "#ffffff"], [150, 98, "#ff8a80"], [170, 104, "#a99bff"], [185, 94, "#ffd166"], [8, 106, "#ffffff"]];

  // ---------------------------------------------------- les thèmes
  const THEMES = {
    // la ferme cozy (par défaut, Stardew, débutants)
    vallee: {
      nom: "La ferme",
      costume: "paille",
      draw(S, dt) {
        B.sky(S, ["#7ec8e3", "#9bd4e6", "#b7dfe6", "#d4e8df", "#f3e9c9", "#f8dcae"]);
        B.sun(S, 158, 14, undefined, undefined, S.pulse);
        B.clouds(S, dt);
        B.hills(S, 58, 5, 23, 0, "#8cc56c"); B.hills(S, 70, 4, 31, 2, "#6bb055");
        [[18, 52], [40, 56], [176, 54]].forEach(([x, y]) => B.tree(S, x, y, undefined, undefined, undefined, 0.5));
        B.house(S, 140, 66);
        B.ground(S, "#5aa64a", "#4a9440"); B.path(S, "#d9b77e");
        B.fence(S, 2, 72); B.crops(S, 128, 196, 96, "#ff8a80");
        B.flowers(S, FLOWERS.slice(0, 4)); B.flies(S, dt, undefined, S.pulse * .5);
      },
      weather: "petals",
      outfit: { g: "#5f9e48", G: "#3f6e30", y: "#d24b3e" },
    },
    // forêt kokiri / bois perdus
    foret: {
      nom: "La forêt",
      outfit: {},
      draw(S, dt) {
        B.sky(S, ["#2e5a4a", "#346650", "#3d7356", "#4a805c", "#5a8f62", "#6a9c66"]);
        for (let i = 0; i < 6; i++) S.px(20 + i * 34, 0, 6, 88, `rgba(255,250,200,${0.06 + 0.05 * Math.sin(S.t + i) + S.pulse * .06})`);
        [[-6, 18], [40, 26], [140, 20], [176, 14]].forEach(([x, y]) => B.bigTree(S, x, y, "#2f6b3a", "#3f8a3a", "#5a3a22"));
        B.hills(S, 74, 3, 17, 1, "#3f7a40");
        [[62, 62], [112, 66], [126, 60]].forEach(([x, y]) => B.tree(S, x, y, "#3f8a3a", "#5aa64a", "#5a3a22", 0.4));
        B.ground(S, "#4a8a3e", "#3a7432");
        // champignons
        [[30, 92], [168, 96], [150, 90]].forEach(([x, y]) => { S.px(x, y, 5, 2, "#d24b3e"); S.px(x + 1, y + 2, 3, 2, "#efe2c4"); S.px(x + 1, y, 1, 1, "#fff"); });
        B.flies(S, dt, "200,255,170", S.pulse);
      },
      weather: "leaves",
      outfit: { g: "#3f8f3a" },
    },
    // tempêtes et moulin
    orage: {
      nom: "L'orage",
      costume: "capuche",
      draw(S, dt) {
        const flash = S.flash > 0 ? S.flash : 0;
        S.flash = Math.max(0, (S.flash || 0) - dt / 300);
        B.sky(S, flash > .3 ? ["#c8d0e8", "#bfc8e0", "#b6c0d8", "#aab4cc", "#9ea8c0", "#929cb4"] : ["#3a4258", "#424a62", "#4a526a", "#535b72", "#5c647a", "#666e82"]);
        B.clouds(S, dt, "#5d6478", "#4a5064", 0.008);
        B.hills(S, 64, 4, 25, 3, "#4f6b4a"); B.hills(S, 74, 3, 33, 1, "#45603f");
        B.windmill(S, 146, 46, 1.2 + S.pulse * 4);
        B.ground(S, "#4a6a40", "#3e5a36");
        // flaques
        [[30, 98, 18], [150, 102, 22]].forEach(([x, y, w]) => { S.px(x, y, w, 3, "#6c7a96"); S.px(x + 2 + (S.t * 8 % (w - 4)), y + 1, 2, 1, "#a8b4d0"); });
        if (Math.random() < 0.002) S.flash = 1;
      },
      weather: "rain",
      onNote(S, i, midi) { if (midi >= 86 && Math.random() < 0.5) S.flash = 1; },
      outfit: { c: "#f2c94c", C: "#c9a032", g: "#e8b83a", G: "#b88a22", l: "#f6dc80" },
    },
    // nuit au château (berceuse, nocturne)
    nuit: {
      nom: "La nuit au château",
      costume: "nuit",
      draw(S, dt) {
        S.skyTop = "#1d2850";
        B.sky(S, ["#1d2850", "#24305c", "#2c3a68", "#364575", "#415182", "#4d5d8e"]);
        B.stars(S, 40); B.moon(S, 28, 10);
        B.castle(S, 120, 34, "#2a3050", "#ffe9a3");
        B.hills(S, 70, 4, 29, 1, "#2f4a46"); B.hills(S, 78, 3, 21, 3, "#28403c");
        B.ground(S, "#2f5a3e", "#284e36");
        B.flies(S, dt, "180,220,255", S.pulse);
      },
      weather: "sparkles",
      outfit: { g: "#3f5fa8", G: "#2a4078", l: "#7090d0" },
    },
    // ranch au coucher du soleil
    ranch: {
      nom: "Le ranch",
      costume: "paille",
      draw(S, dt) {
        B.sky(S, ["#f6b47a", "#f7c088", "#f8cc98", "#f6d6a6", "#f2ddb2", "#eddfbc"]);
        B.sun(S, 140, 44, "#ffcf70", "#fff0b0", S.pulse);
        B.clouds(S, dt, "#ffd9b8", "#f0bfa0");
        B.hills(S, 66, 4, 27, 0, "#b4b860"); B.hills(S, 76, 3, 35, 2, "#98a850");
        B.ground(S, "#8ea04a", "#7a8c40"); B.fence(S, 0, 200);
        // cheval qui broute (silhouette)
        const hx = 150, hy = 70, n = Math.round(Math.sin(S.t * 1.2) * 1);
        S.px(hx, hy, 18, 7, "#8a4a2a"); S.px(hx + 2, hy + 7, 2, 8, "#6e3a20"); S.px(hx + 14, hy + 7, 2, 8, "#6e3a20");
        S.px(hx - 5, hy + 1 + n, 6, 4, "#8a4a2a"); S.px(hx - 8, hy + 4 + n, 4, 7, "#8a4a2a"); S.px(hx + 17, hy + 1, 3, 6, "#efe2c4"); S.px(hx - 3, hy - 1 + n, 4, 2, "#efe2c4");
      },
      weather: null,
      outfit: { g: "#c0643a", G: "#8a4426", r: "#4f9e40", R: "#2f6b2a", n: "#5b7fb8", N: "#3f5f90" },
    },
    // temple du temps (chant du temps, prélude, écran titre)
    temple: {
      nom: "Le temple",
      draw(S, dt) {
        B.sky(S, ["#cfd8ea", "#d8e0ee", "#e0e6f0", "#e8ecf2", "#eef0f2", "#f2f2ee"]);
        for (let i = 0; i < 6; i++) { S.px(10 + i * 34, 20, 10, 68, "#bfb8aa"); S.px(8 + i * 34, 18, 14, 3, "#a8a092"); S.px(8 + i * 34, 86, 14, 3, "#a8a092"); }
        S.px(0, 14, 200, 4, "#a8a092");
        B.pedestal(S, 140, 66, S.pulse);
        S.px(0, 88, 200, 24, "#d6cfc0");
        for (let x = 0; x < 200; x += 16) for (let y = 88; y < 112; y += 8) S.px(x + ((y / 8) % 2) * 8, y, 15, 7, "#cbc3b2");
      },
      weather: "sparkles",
      outfit: { g: "#4f9e40" },
    },
    // désert gerudo
    desert: {
      nom: "Le désert",
      costume: "turban",
      draw(S, dt) {
        B.sky(S, ["#f2b37a", "#f4c08a", "#f6cc9a", "#f6d6aa", "#f4dcb6", "#f0dcbc"]);
        B.sun(S, 30, 16, "#fff0a0", "#fffbe0", S.pulse);
        B.dunes(S, 62, "#e2b070", "#f0c890"); B.dunes(S, 76, "#d49c5c", "#e6b47a");
        // tente gerudo
        S.px(146, 64, 30, 24, "#c0503a"); for (let i = 0; i < 10; i++) S.px(146 + i * 1.5, 64 - i, 30 - i * 3, 1, "#a83f2c"); S.px(158, 74, 6, 14, "#5a2a22");
        B.ground(S, "#e6c084", "#d8ae70");
        // cactus
        S.px(30, 74, 4, 16, "#4f8a4a"); S.px(26, 78, 4, 2, "#4f8a4a"); S.px(26, 74, 2, 6, "#4f8a4a"); S.px(34, 80, 3, 2, "#4f8a4a"); S.px(36, 76, 2, 6, "#4f8a4a");
      },
      weather: "sand",
      outfit: { g: "#c0503a", G: "#8a3226", l: "#e07a5a", y: "#f2c94c" },
    },
    // fontaines, eau, Mipha, Ballade
    fontaine: {
      nom: "La fontaine",
      draw(S, dt) {
        B.sky(S, ["#3a3060", "#4a3a74", "#5c4486", "#704e94", "#8458a0", "#985ea8"]);
        B.stars(S, 25, 3);
        // rochers
        B.hills(S, 60, 6, 15, 2, "#4a4070"); B.hills(S, 72, 5, 11, 0, "#3e3660");
        B.water(S, 84, "#5a8fd0", "#a8d4ff", "#7fb4ff");
        // bassin lumineux
        S.px(120, 84, 60, 4, `rgba(255,200,255,${0.25 + 0.2 * Math.sin(S.t * 2) + S.pulse * .3})`);
        S.px(0, 100, 200, 12, "#4a6a9a");
      },
      weather: "sparkles",
      onNote(S) { for (let i = 0; i < 4; i++) S.weather.push({ x: 120 + Math.random() * 60, y: 70 + Math.random() * 14, life: 1, k: "sparkles", ph: 0 }); },
      outfit: { g: "#3a6fc4", G: "#244a8a", l: "#7aa8ee" },
    },
    // la grande mer
    mer: {
      nom: "La grande mer",
      costume: "bandana",
      draw(S, dt) {
        B.sky(S, ["#6ec0ec", "#86cbee", "#9ed6f0", "#b4e0f0", "#c8e8ee", "#d8eeec"]);
        B.sun(S, 160, 12, undefined, undefined, S.pulse); B.clouds(S, dt);
        B.water(S, 60, "#2f7ec4", "#bfe6ff", "#5aa0e0");
        // petite île
        S.px(20, 56, 30, 6, "#e6d29a"); B.tree(S, 30, 41, "#3f8a3a", "#5aa64a", "#7a4b28", 1);
        // bateau
        const bx = 140 + Math.sin(S.t * 0.8) * 4, by = 66 + Math.round(Math.sin(S.t * 2));
        S.px(bx, by + 8, 26, 5, "#b0283a"); S.px(bx + 2, by + 13, 22, 2, "#8a1e2c"); S.px(bx + 12, by - 10, 2, 18, "#6e4f33");
        S.px(bx + 4, by - 8, 8, 14, "#f6f0e0"); S.px(bx + 14, by - 6, 7, 11, "#f6f0e0");
        S.px(0, 88, 200, 24, "#e6d29a"); S.px(0, 88, 200, 2, "#f2e2b0");
      },
      weather: null,
      outfit: { g: "#f2f2f2", G: "#c8c8d0", n: "#4a6ab0", N: "#34508a", r: "#3a6fc4", R: "#244a8a" },
    },
    // volcan (boléro)
    feu: {
      nom: "Le volcan",
      costume: "casque",
      draw(S, dt) {
        B.sky(S, ["#3a1a1a", "#4a2020", "#5c2822", "#703224", "#863c26", "#9a4628"]);
        B.volcano(S, 140, 30, `rgba(255,${120 + Math.round(S.pulse * 100)},40,1)`);
        B.hills(S, 74, 4, 19, 1, "#4a2a24");
        B.ground(S, "#5a3a30", "#4a2e26");
        // ruisseau de lave
        for (let x = 0; x < 200; x++) { const y = 100 + Math.round(Math.sin(x / 13 + S.t) * 2); S.px(x, y, 1, 3, x % 6 < 3 ? "#ff7a2a" : "#ffb03a"); }
      },
      weather: "embers",
      outfit: { g: "#b8352b", G: "#7e2219", l: "#e0604a" },
    },
    // le marché / village (maisons)
    village: {
      nom: "Le village",
      draw(S, dt) {
        B.sky(S, ["#86c4ea", "#9ccff0", "#b2daf0", "#c6e2ec", "#d8e8e4", "#e6ecd8"]);
        B.clouds(S, dt);
        B.house(S, 8, 60, "#d8b88a", "#4a6ab0"); B.house(S, 40, 54, "#e2cba0", "#b8453a"); B.house(S, 126, 58, "#cfae80", "#5a9a4a"); B.house(S, 166, 62, "#d8b88a", "#c98c3a");
        S.px(0, 88, 200, 24, "#c8b89a");
        for (let x = 0; x < 200; x += 10) for (let y = 88; y < 112; y += 6) S.px(x + ((y / 6) % 2) * 5, y, 9, 5, "#bba98a");
        // fanions
        for (let i = 0; i < 20; i++) S.px(i * 10 + 2, 46 + Math.abs(10 - i) * 0.6 + Math.round(Math.sin(S.t * 3 + i)), 4, 3, ["#d24b3e", "#f2c94c", "#4f9e40", "#5b8fe0"][i % 4]);
      },
      weather: null,
      outfit: { g: "#4f9e40" },
    },
    // la Comté
    comte: {
      nom: "La Comté",
      costume: "hobbit",
      draw(S, dt) {
        B.sky(S, ["#8fcaea", "#a6d4ec", "#bcdeec", "#cfe6e6", "#e0ecdc", "#ecefd0"]);
        B.sun(S, 166, 12, undefined, undefined, S.pulse); B.clouds(S, dt);
        B.hills(S, 60, 6, 30, 1, "#8cc56c");
        B.hobbitHole(S, 132, 60);
        B.tree(S, 20, 54, "#4a9a3a", "#6aba4a", "#7a4b28", 0.5); B.bigTree(S, 34, 30, "#3f8a3a", "#5aa64a", "#6a4a2a");
        B.ground(S, "#6bb055", "#5aa64a"); B.path(S, "#d9b77e");
        B.flowers(S, FLOWERS); B.flies(S, dt, undefined, S.pulse * .4);
      },
      weather: "petals",
      outfit: { g: "#8a5a2c", G: "#5e3c1c", r: "#f0e0b0", R: "#cbb48a", n: "#6a7a3a", N: "#4a5428", B: "#f0c098", h: "#7a4a22", H: "#5a3418" },
    },
    // montagnes brumeuses (nuit, neige)
    montagnes: {
      nom: "Les montagnes",
      costume: "nain",
      draw(S, dt) {
        S.skyTop = "#20284a";
        B.sky(S, ["#20284a", "#283256", "#323d62", "#3d486e", "#48547a", "#546086"]);
        B.stars(S, 30, 7); B.moon(S, 160, 8);
        B.mountains(S, 70, "#4a5070", "#e8eef8");
        B.hills(S, 76, 3, 21, 1, "#38405e");
        [[10, 70], [30, 72], [160, 70], [182, 74]].forEach(([x, y]) => B.pine(S, x, y, "#2a3a4a", "#e8eef8"));
        B.ground(S, "#dfe6f2", "#c8d2e4");
        // feu de camp
        const f = 0.6 + 0.4 * Math.sin(S.t * 12) + S.pulse * .3;
        S.px(150, 94, 12, 2, "#5a3a22"); S.px(153, 88 - f * 3, 6, 6 + f * 3, "#ff9a3a"); S.px(155, 90 - f * 2, 2, 4 + f * 2, "#ffe07a");
      },
      weather: "snow",
      outfit: { c: "#4a5a7a", C: "#2e3a52", g: "#7a4a2a", G: "#5a3418", H: "#c0703a", h: "#e0904a" },
    },
    // étoile du soir (elfique, crépuscule)
    elfique: {
      nom: "Fondcombe",
      costume: "elfe",
      draw(S, dt) {
        S.skyTop = "#2c2a5a";
        B.sky(S, ["#2c2a5a", "#3c3670", "#564488", "#7a5296", "#a0649c", "#c07a9a"]);
        B.stars(S, 30, 5);
        // cascade
        for (let y = 30; y < 88; y++) S.px(150 + Math.round(Math.sin(y / 5 + S.t * 6) * 1), y, 6, 1, y % 4 < 2 ? "#cfe6ff" : "#a8c8f0");
        B.hills(S, 58, 6, 18, 2, "#3a3a6a"); S.px(150, 30, 6, 58, "rgba(200,230,255,.6)");
        B.hills(S, 74, 4, 24, 0, "#2f4a56");
        [[20, 60], [50, 66], [176, 62]].forEach(([x, y]) => B.pine(S, x, y, "#26404a"));
        B.ground(S, "#3a5a5a", "#2f4e4e");
        B.flies(S, dt, "200,220,255", S.pulse);
      },
      weather: "sparkles",
      outfit: { h: "#f0d888", H: "#c8a858", g: "#dfe6f4", G: "#aab4cc", r: "#8a9ac8", R: "#5a6a98", y: "#c0c8d8", n: "#c8d0e4", N: "#9aa4bc" },
    },
    // vers l'ouest : port au couchant
    ouest: {
      nom: "Les Havres Gris",
      costume: "capuche",
      draw(S, dt) {
        B.sky(S, ["#f0a070", "#f2b080", "#f4c090", "#f2cca0", "#eed4b0", "#e8d8c0"]);
        B.sun(S, 92, 50, "#ffd080", "#fff0c0", S.pulse);
        B.water(S, 62, "#5a7ab0", "#ffd8a8", "#8aa0c8");
        // navire elfique blanc
        const bx = 120 + Math.sin(S.t * 0.5) * 3, by = 54;
        for (let i = 0; i < 6; i++) S.px(bx + i, by + 6 + i * 0.5, 34 - i * 2, 1, "#f2f2f2");
        S.px(bx + 16, by - 14, 1, 20, "#d0d0d0"); S.px(bx + 8, by - 10, 8, 14, "rgba(255,255,255,.9)");
        S.px(0, 88, 200, 24, "#b8b4a8"); S.px(0, 88, 200, 2, "#d0ccc0");
      },
      weather: null,
      outfit: { c: "#9a9ea8", C: "#6e727c", g: "#dfe2e8", G: "#aab0bc" },
    },
    // soleil éclatant
    soleil: {
      nom: "Plein soleil",
      costume: "paille",
      draw(S, dt) {
        B.sky(S, ["#ffd36a", "#ffdc80", "#ffe498", "#ffeab0", "#fff0c4", "#fff4d4"]);
        const r = 1 + S.pulse * 3;
        for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + S.t * 0.3; for (let k = 16; k < 26 + r * 2; k += 2) S.px(100 + Math.cos(a) * k, 22 + Math.sin(a) * k, 2, 2, "#fff6c0"); }
        B.sun(S, 93, 15, "#fff0a0", "#ffffff", S.pulse);
        B.hills(S, 64, 5, 23, 0, "#9ccf5a"); B.hills(S, 74, 4, 31, 2, "#7aba4a");
        B.ground(S, "#6aba4a", "#5aa640"); B.flowers(S, FLOWERS.map(([x, y]) => [x, y, "#ffd166"]));
      },
      weather: null,
      outfit: { g: "#4f9e40" },
    },
  };

  // chanson -> thème (par identifiant, sinon par mots du titre, sinon par rangée)
  const BY_ID = {
    "ow-berceuse-de-zelda": "nuit", "berceuse-ocarina": "nuit", "nocturne": "nuit", "ow-lamentation-de-midona": "nuit",
    "ow-chant-de-saria": "foret", "ow-foret-kokiri": "foret", "ow-larbre-mojo": "foret", "ow-menuet-des-bois": "foret",
    "ow-chant-des-tempetes": "orage",
    "ow-chant-du-temps": "temple", "prelude": "temple", "ow-ecran-titre": "temple", "ow-ballade-de-la-deesse": "temple",
    "ow-chant-depona": "ranch", "ow-les-relais": "ranch",
    "ow-vallee-gerudo": "desert", "ow-requiem-de-lesprit": "desert",
    "ow-fontaine-des-grandes-fees": "fontaine", "ow-serenade-de-leau": "fontaine", "ow-theme-de-mipha": "fontaine",
    "ow-la-grande-mer": "mer",
    "bolero": "feu",
    "ow-le-marche-dhyrule": "village", "ow-dans-une-maison": "village", "ow-chant-de-lapaisement": "village", "ow-kaepora-gaebora": "foret",
    "ow-theme-principal": "vallee",
    "soleil": "soleil",
    "ow-concerning-hobbits": "comte", "ow-misty-mountains": "montagnes", "ow-evenstar": "elfique",
    "ow-into-the-west": "ouest", "ow-the-edge-of-night": "montagnes",
  };
  const BY_CAT = { lotr: "comte", stardew: "vallee", debut: "vallee", perso: "vallee", zelda: "foret", zelda2: "vallee" };
  function themeFor(song) {
    if (!song) return "vallee";
    if (song.theme && THEMES[song.theme]) return song.theme;
    return BY_ID[song.id] || BY_CAT[song.cat] || "vallee";
  }

  // premier plan (touffes d'herbe, buissons) + vignette, dessinés devant le héros
  function foreground(S) {
    const g = S.groundCol;
    if (g) {
      for (let x = -2; x < S.W; x += 5) {
        const h = 3 + ((x * 7) % 4), o = Math.round(Math.sin(S.t * 2 + x / 8) * 1);
        S.px(x + o, S.H - h, 1, h, g); S.px(x + 2, S.H - h + 1, 1, h - 1, g);
      }
      [[-8, 96], [186, 98]].forEach(([bx, by]) => {
        S.px(bx, by + 4, 24, 14, g); S.px(bx + 3, by, 16, 6, g); S.px(bx + 6, by + 2, 4, 2, "rgba(255,255,255,.12)");
      });
    }
    for (let i = 0; i < 6; i++) {
      const a = 0.05 * (6 - i) / 6 + 0.01;
      S.px(0, i, S.W, 1, `rgba(0,0,0,${a})`); S.px(0, S.H - 1 - i, S.W, 1, `rgba(0,0,0,${a})`);
      S.px(i, 0, 1, S.H, `rgba(0,0,0,${a})`); S.px(S.W - 1 - i, 0, 1, S.H, `rgba(0,0,0,${a})`);
    }
  }

  window.THEMES = THEMES;
  window.drawForeground = foreground;
  window.themeFor = themeFor;
  window.drawWeather = weather;
})();
