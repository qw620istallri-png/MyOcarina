// =====================================================================
//  Le Carnet d'Ocarina — logique de l'appli
// =====================================================================
(function () {
  const M = window.Music;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  // ------------------------------------------------------------ stockage
  const store = {
    get(k, d) { try { const v = localStorage.getItem("oca." + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("oca." + k, JSON.stringify(v)); } catch {} },
  };
  const settings = Object.assign(
    { notation: "fr", oct: "auto", detectedOct: 0, ignoreOct: true, sens: 0.55, cat: "zelda", tempo: 100 },
    store.get("settings", {})
  );
  const saveSettings = () => store.set("settings", settings);
  let userSongs = store.get("userSongs", []);
  const best = store.get("best", {});

  const allSongs = () => [...(window.SONGS_OCWALK || []), ...window.SONGS, ...userSongs];
  const octShift = () => (settings.oct === "auto" ? settings.detectedOct : parseInt(settings.oct, 10));

  // ------------------------------------------------------------ audio
  let ctx = null, synth = null, listener = null, micOn = false;
  function audio() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      synth = new M.OcarinaSynth(ctx);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  async function startMic() {
    audio();
    if (micOn) return true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      say("Le micro n'est pas disponible ici (il faut une page en https).", "bad");
      return false;
    }
    try {
      listener = new M.PitchListener();
      listener.sensitivity = settings.sens;
      listener.onPitch = onPitch;
      await listener.start(ctx);
      micOn = true;
      return true;
    } catch (e) {
      say("Je n'ai pas accès au micro. Autorise-le dans le navigateur puis réessaie.", "bad");
      return false;
    }
  }
  function stopMic() { if (listener) listener.stop(); listener = null; micOn = false; }

  // ------------------------------------------------------------ noms de notes
  const nameOf = (midi) => M.midiToName(midi, settings.notation);
  function octText(midi) {
    const o = M.octaveLabel(midi);
    return o === "aigu" ? "aigu" : o === "grave" ? "trop grave" : "";
  }

  // ------------------------------------------------------------ doigtés (SVG)
  // Dessin calqué sur l'ocarina traversier 11 trous Musique de Terre
  // (embouchure en bas à gauche, pointe à droite, vue de dessus).
  const HOLES = [
    // id, x, y, r
    ["Li", 50, 24, 6], ["Lm", 78, 27, 8.5], ["Lr", 107, 31, 8], ["Lp", 140, 45, 5.5],
    ["Ri", 112, 62, 8], ["Rm", 143, 64, 7], ["Rr", 171, 70, 7],
  ];
  const THUMBS = [["Lt", 22, 118, 8], ["Rt", 104, 118, 8]];
  const DARK = "#3a2414";
  function circle(x, y, r, filled) {
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${filled ? DARK : "#fffaf0"}" stroke="${DARK}" stroke-width="2.4"/>`;
  }
  function holeSVG([id, x, y, r], f, dashed) {
    const v = f ? f[id] || 0 : 0;
    return circle(x, y, r, v === 1).replace("/>", dashed ? ' stroke-dasharray="3 2"/>' : "/>");
  }
  function fingeringSVG(midi) {
    const f = midi == null ? null : M.fingering(midi);
    let s = `<svg viewBox="0 0 240 132" role="img" aria-label="Doigté">`;
    // embouchure (dessous, vers la bouche)
    s += `<path d="M44 84 C 48 100, 54 112, 56 124 L 72 124 C 72 112, 76 100, 84 88 Z" fill="#4a77c4" stroke="${DARK}" stroke-width="2.4" stroke-linejoin="round"/>`;
    s += `<rect x="57" y="119" width="14" height="4" rx="1.5" fill="${DARK}"/>`;
    // corps en goutte
    s += `<path d="M8 22 C 14 8, 46 6, 80 10 C 120 15, 170 38, 232 82 C 200 92, 160 94, 120 92 C 80 90, 40 86, 22 70 C 8 58, 2 36, 8 22 Z" fill="#5b8fe0" stroke="${DARK}" stroke-width="2.6" stroke-linejoin="round"/>`;
    s += `<path d="M22 20 C 50 12, 90 14, 120 24" stroke="#d6e9ff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".75"/>`;
    HOLES.forEach((h) => (s += holeSVG(h, f)));
    // trou double de l'auriculaire droit
    const rp = f ? f.Rp || 0 : 0;
    s += circle(194, 75, 3.6, rp >= 0.5) + circle(203, 79, 3.6, rp === 1);
    // pouces (dessous)
    THUMBS.forEach((h) => (s += holeSVG(h, f, true)));
    s += `<text x="22" y="99" text-anchor="middle" font-size="8" fill="#7a5a3a" font-family="sans-serif">pouce G ⤵</text>`;
    s += `<text x="104" y="99" text-anchor="middle" font-size="8" fill="#7a5a3a" font-family="sans-serif">pouce D ⤵</text>`;
    if (midi != null && !f) s += `<text x="140" y="118" text-anchor="middle" font-size="12" fill="#9e2f27" font-family="sans-serif">hors tessiture</text>`;
    return s + `</svg>`;
  }

  // ------------------------------------------------------------ navigation
  function show(id) {
    $$(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
    window.scrollTo(0, 0);
  }

  // ------------------------------------------------------------ accueil
  function renderTabs() {
    const el = $("#cat-tabs");
    el.innerHTML = "";
    window.CATEGORIES.forEach((c) => {
      const b = document.createElement("button");
      b.className = "tab" + (settings.cat === c.id ? " on" : "");
      b.textContent = `${c.icone} ${c.nom}`;
      b.onclick = () => { settings.cat = c.id; saveSettings(); renderTabs(); renderSongs(); };
      el.appendChild(b);
    });
  }
  function renderSongs() {
    const el = $("#song-list");
    el.innerHTML = "";
    const cat = window.CATEGORIES.find((c) => c.id === settings.cat) || window.CATEGORIES[0];
    const list = allSongs().filter((s) => s.cat === cat.id);
    if (!list.length) {
      const p = document.createElement("p");
      p.className = "empty";
      p.innerHTML = cat.id === "stardew"
        ? "Les airs de la Vallée arrivent bientôt 🌱<br>En attendant, tu peux en ajouter un toi-même avec « Ajouter une mélodie » : tape les notes ou joue-les à l'ocarina, l'appli les note pour toi."
        : "Aucune mélodie ici pour l'instant. Utilise « Ajouter une mélodie » pour créer la tienne.";
      el.appendChild(p);
    }
    list.forEach((s) => {
      const b = document.createElement("button");
      b.className = "song";
      const stars = best[s.id] ? "★".repeat(best[s.id]) + "☆".repeat(3 - best[s.id]) : "";
      b.innerHTML = `<span class="ico">${cat.icone}</span><span><b></b><small></small>${stars ? `<span class="best">${stars} meilleur score</span>` : ""}</span><span class="diff" title="Difficulté">${"♪".repeat(s.diff || 1)}</span>`;
      b.querySelector("b").textContent = s.titre;
      b.querySelector("small").textContent = s.sous || (s.user ? "Ma mélodie" : "");
      b.onclick = () => openSong(s);
      if (s.user) b.oncontextmenu = (e) => { e.preventDefault(); openEditor(s); };
      el.appendChild(b);
    });
  }

  // ------------------------------------------------------------ jeu
  const game = {
    song: null, notes: [], mode: "follow", idx: 0, running: false,
    errors: 0, hits: 0, misses: new Set(),
    stableMidi: null, stableSince: 0, reported: false, needRelease: false, silence: 0,
    demoTimer: null, demoStart: 0, demoIdx: -1,
  };

  function openSong(song) {
    try {
      game.notes = M.parseSong(song.notes).filter((n) => n.midi == null || true);
    } catch (e) { alert(e.message); return; }
    game.song = song;
    $("#play-title").textContent = song.titre;
    $("#play-sub").textContent = song.sous || "";
    show("play");
    setMode(game.notes.length ? "follow" : "free");
    scene.resize();
  }

  function openTuner() {
    game.song = { titre: "Accordeur & doigtés", sous: "Joue une note, je te montre laquelle", notes: "" };
    game.notes = [];
    $("#play-title").textContent = game.song.titre;
    $("#play-sub").textContent = game.song.sous;
    show("play");
    setMode("free");
    scene.resize();
  }

  function setMode(mode) {
    stopAll();
    game.mode = mode;
    $$(".mode").forEach((b) => b.classList.toggle("on", b.dataset.mode === mode));
    $$(".mode").forEach((b) => (b.disabled = !game.notes.length && b.dataset.mode !== "free"));
    $("#tempo-wrap").style.display = mode === "listen" ? "" : "none";
    $("#btn-hint").style.display = mode === "follow" ? "" : "none";
    $("#btn-restart").style.display = mode === "free" ? "none" : "";
    $("#track").style.display = game.notes.length ? "" : "none";
    $("#now-label").textContent = mode === "free" ? "Tu joues" : "Maintenant";
    $(".card.next").style.display = mode === "free" ? "none" : "";
    resetGame();
    if (mode === "free") {
      $("#btn-start").textContent = micOn ? "⏸ Couper le micro" : "🎤 Activer le micro";
      say("Joue une note : je te montre son nom et son doigté.");
      showNow(null);
    } else if (mode === "listen") {
      $("#btn-start").textContent = "▶ Écouter";
      say("Écoute la mélodie et regarde les doigtés défiler.");
    } else {
      $("#btn-start").textContent = "▶ Commencer";
      say("Appuie sur « Commencer » puis joue la première note.");
    }
  }

  function resetGame() {
    game.idx = firstNoteIdx(0); game.errors = 0; game.hits = 0; game.misses = new Set();
    game.stableMidi = null; game.reported = false; game.needRelease = false; game.silence = 0;
    $("#score-badge").hidden = true;
    renderTrack();
    updateCards();
  }
  function firstNoteIdx(i) { while (i < game.notes.length && game.notes[i].midi == null) i++; return i; }

  function renderTrack() {
    const el = $("#track-inner");
    el.innerHTML = "";
    let lastPhrase = 0;
    game.notes.forEach((n, i) => {
      if (n.phrase !== lastPhrase) { const g = document.createElement("div"); g.className = "phrase-gap"; el.appendChild(g); lastPhrase = n.phrase; }
      const t = document.createElement("div");
      t.className = "tile" + (n.midi == null ? " rest" : "");
      t.style.minWidth = Math.round(26 + n.dur * 16) + "px";
      t.dataset.i = i;
      if (n.midi != null) {
        const h = 8 + (n.midi - 67) * 1.7;
        t.innerHTML = `<div class="bar" style="bottom:${h}px;height:6px;background:${window.NOTE_COLORS[n.midi % 12]}"></div><span>${nameOf(n.midi).replace("♯", "#")}</span>`;
      } else t.innerHTML = "<span>·</span>";
      el.appendChild(t);
    });
  }
  function updateTrack() {
    $$("#track-inner .tile").forEach((t) => {
      const i = +t.dataset.i;
      t.classList.toggle("done", i < game.idx);
      t.classList.toggle("cur", i === game.idx);
      t.classList.toggle("miss", game.misses.has(i));
    });
    const cur = $(`#track-inner .tile[data-i="${game.idx}"]`);
    if (cur) {
      const tr = $("#track");
      tr.scrollLeft = cur.offsetLeft - tr.clientWidth / 2 + cur.clientWidth / 2;
    }
  }

  function noteAt(i) { const j = firstNoteIdx(i); return j < game.notes.length ? game.notes[j] : null; }
  function showNow(midi) {
    $("#now-name").textContent = midi == null ? "—" : nameOf(midi);
    $("#now-oct").textContent = midi == null ? "" : octText(midi);
    $("#now-fing").innerHTML = fingeringSVG(midi);
  }
  function updateCards() {
    if (game.mode === "free") { updateTrack(); return; }
    const cur = noteAt(game.idx);
    showNow(cur ? cur.midi : null);
    const nextI = firstNoteIdx(game.idx + 1);
    const nx = nextI < game.notes.length ? game.notes[nextI] : null;
    $("#next-name").textContent = nx ? nameOf(nx.midi) : "🏁";
    $("#next-oct").textContent = nx ? octText(nx.midi) : "fin";
    $("#next-fing").innerHTML = nx ? fingeringSVG(nx.midi) : "";
    const then = [];
    for (let i = nextI + 1; i < game.notes.length && then.length < 4; i++) if (game.notes[i].midi != null) then.push(nameOf(game.notes[i].midi));
    $("#then-names").textContent = then.length ? "puis " + then.join(" · ") : "";
    updateTrack();
    if (game.mode === "follow" && game.running) {
      const total = game.notes.filter((n) => n.midi != null).length;
      $("#score-badge").hidden = false;
      $("#score-badge").textContent = `♪ ${game.hits}/${total}  ✗ ${game.errors}`;
    }
  }

  function say(text, kind) {
    const m = $("#msg");
    m.textContent = text;
    m.className = "msg" + (kind ? " " + kind : "");
  }
  let bubbleT = null;
  function bubble(text) {
    const b = $("#bubble");
    b.textContent = text; b.hidden = false;
    clearTimeout(bubbleT); bubbleT = setTimeout(() => (b.hidden = true), 1200);
  }
  function flash(kind) {
    const c = $(".card.now");
    c.classList.remove("flash-ok", "flash-bad"); void c.offsetWidth;
    c.classList.add(kind === "ok" ? "flash-ok" : "flash-bad");
  }

  // ------------------------------------------------------------ écoute du micro
  const PRAISE = ["Joli !", "Bien !", "Oui !", "Parfait !", "Super !", "♪"];
  function onPitch(p) {
    const needle = $("#needle");
    if (!p.freq) {
      game.silence++;
      if (game.silence > 4) { game.needRelease = false; game.stableMidi = null; }
      needle.classList.remove("on");
      if (game.silence > 8) $("#heard-note").textContent = "…";
      if (recorder.on) recorder.frame(null);
      if (game.mode === "free" && game.silence > 8 && scene.state === "play") scene.set("idle");
      return;
    }
    game.silence = 0;
    // détection automatique alto / soprano
    if (settings.oct === "auto") {
      if (p.midi >= 91 && settings.detectedOct !== 12) { settings.detectedOct = 12; saveSettings(); }
      else if (p.midi <= 79 && p.midi >= 70 && settings.detectedOct !== 0) { settings.detectedOct = 0; saveSettings(); }
    }
    const rel = p.midi - octShift(); // note ramenée à l'ocarina alto
    needle.classList.add("on");
    needle.style.left = 50 + Math.max(-50, Math.min(50, p.cents)) + "%";
    $("#heard-note").textContent = nameOf(rel) + (M.octaveLabel(rel) === "aigu" ? "ʹ" : M.octaveLabel(rel) === "grave" ? "," : "");

    const now = performance.now();
    if (p.midi !== game.stableMidi) { game.stableMidi = p.midi; game.stableSince = now; game.reported = false; }
    const held = now - game.stableSince;

    if (recorder.on) { recorder.frame(rel, held); return; }

    if (game.mode === "free") {
      if (held > 60) {
        if (scene.state !== "play") scene.set("play");
        if (!game.reported) { game.reported = true; showNow(rel >= M.LOW && rel <= M.HIGH ? rel : null); $("#now-name").textContent = nameOf(rel); scene.emit(rel); }
        const c = p.cents;
        say(Math.abs(c) <= 15 ? "Bien juste ✓" : c > 0 ? `Un peu haut (+${c}) : souffle plus doucement` : `Un peu bas (${c}) : souffle un peu plus fort`, Math.abs(c) <= 15 ? "ok" : "");
      }
      return;
    }

    if (game.mode !== "follow" || !game.running) return;
    const target = noteAt(game.idx);
    if (!target) return;
    const match = settings.ignoreOct ? ((rel - target.midi) % 12 + 12) % 12 === 0 : rel === target.midi;
    if (match) {
      if (!game.needRelease && held >= 90) hit();
    } else {
      game.needRelease = false;
      // la note précédente encore tenue n'est pas une erreur
      const prevI = prevNoteIdx(game.idx);
      const prev = prevI >= 0 ? game.notes[prevI] : null;
      const isPrev = prev && (((rel - prev.midi) % 12) + 12) % 12 === 0;
      if (!isPrev && held >= 320 && !game.reported) {
        game.reported = true;
        game.errors++;
        game.misses.add(game.idx);
        const dir = rel < target.midi ? "plus aigu ↑" : "plus grave ↓";
        say(`Tu joues ${nameOf(rel)}, il faut ${nameOf(target.midi)} (${dir})`, "bad");
        bubble("Oups !");
        scene.set("oops");
        flash("bad");
        updateCards();
      }
    }
  }
  function prevNoteIdx(i) { i--; while (i >= 0 && game.notes[i].midi == null) i--; return i; }

  function hit() {
    const n = noteAt(game.idx);
    game.hits++;
    scene.emit(n.midi);
    scene.set("play");
    flash("ok");
    say(PRAISE[game.hits % PRAISE.length] + " " + nameOf(n.midi), "ok");
    const cur = firstNoteIdx(game.idx);
    game.idx = firstNoteIdx(cur + 1);
    game.reported = true;
    const nx = noteAt(game.idx);
    if (nx && nx.midi === n.midi) game.needRelease = true;
    updateCards();
    if (game.idx >= game.notes.length) finish();
  }

  function finish() {
    game.running = false;
    const total = game.notes.filter((n) => n.midi != null).length;
    const ratio = total / (total + game.errors);
    const stars = game.errors === 0 ? 3 : ratio >= 0.85 ? 2 : 1;
    if (game.song.id && (!best[game.song.id] || best[game.song.id] < stars)) { best[game.song.id] = stars; store.set("best", best); }
    scene.set("happy"); scene.sparkle(24);
    setTimeout(() => synth && synth.chime("win"), 150);
    $("#res-title").textContent = stars === 3 ? "Magnifique !" : stars === 2 ? "Très bien !" : "Mélodie terminée !";
    $("#res-stars").innerHTML = [0, 1, 2].map((i) => `<span class="${i < stars ? "" : "off"}">★</span>`).join("");
    $("#res-text").textContent = game.errors === 0
      ? `Les ${total} notes sans une seule erreur. Le petit elfe est fier de toi !`
      : `${total} notes jouées, ${game.errors} petite${game.errors > 1 ? "s" : ""} erreur${game.errors > 1 ? "s" : ""}. Les notes en rose sur la frise sont à retravailler.`;
    $("#btn-start").textContent = "▶ Commencer";
    setTimeout(() => $("#result").showModal(), 900);
  }

  // ------------------------------------------------------------ mode écoute (démo)
  function playDemo(notes, opts = {}) {
    audio();
    stopDemo();
    const tempo = (opts.tempo || 90) * (opts.speed || 1);
    const beat = 60 / tempo;
    let t = ctx.currentTime + 0.15;
    const times = notes.map((n) => {
      const st = t;
      if (n.midi != null) synth.note(n.midi + octShift(), st, n.dur * beat * 0.92);
      t += n.dur * beat;
      return st;
    });
    game.demoStart = times;
    game.demoIdx = -1;
    const tick = () => {
      const now = ctx.currentTime;
      let i = -1;
      while (i + 1 < times.length && times[i + 1] <= now) i++;
      if (i !== game.demoIdx && i >= 0) {
        game.demoIdx = i;
        opts.onNote && opts.onNote(i);
      }
      if (now > t + 0.1) { stopDemo(); opts.onEnd && opts.onEnd(); return; }
      game.demoTimer = requestAnimationFrame(tick);
    };
    game.demoTimer = requestAnimationFrame(tick);
    game.demoEndAt = t;
  }
  function stopDemo() {
    if (game.demoTimer) cancelAnimationFrame(game.demoTimer);
    game.demoTimer = null;
    if (synth && game.demoEndAt && ctx.currentTime < game.demoEndAt) {
      // couper le son en recréant la sortie
      synth.out.disconnect();
      const fresh = new M.OcarinaSynth(ctx);
      synth = fresh;
    }
    game.demoEndAt = 0;
  }

  function stopAll() {
    stopDemo();
    game.running = false;
    scene.set("idle");
  }

  async function onStart() {
    audio();
    if (game.mode === "listen") {
      if (game.demoTimer) { stopAll(); $("#btn-start").textContent = "▶ Écouter"; return; }
      resetGame();
      $("#btn-start").textContent = "⏹ Stop";
      scene.set("play");
      playDemo(game.notes, {
        tempo: game.song.tempo, speed: settings.tempo / 100,
        onNote: (i) => {
          game.idx = i; updateCards();
          const n = game.notes[i];
          if (n.midi != null) { scene.emit(n.midi); scene.set("play"); }
        },
        onEnd: () => { scene.set("happy"); game.idx = game.notes.length; updateCards(); $("#btn-start").textContent = "▶ Écouter"; },
      });
      return;
    }
    if (game.mode === "free") {
      if (micOn) { stopMic(); $("#btn-start").textContent = "🎤 Activer le micro"; say("Micro coupé."); return; }
      if (await startMic()) { $("#btn-start").textContent = "⏸ Couper le micro"; say("Je t'écoute… joue une note !"); }
      return;
    }
    // suivre
    if (game.running) { game.running = false; $("#btn-start").textContent = "▶ Reprendre"; say("En pause."); scene.set("idle"); return; }
    if (!(await startMic())) return;
    if (game.idx >= game.notes.length) resetGame();
    game.running = true;
    $("#btn-start").textContent = "⏸ Pause";
    const n = noteAt(game.idx);
    say(`À toi ! Commence par ${nameOf(n.midi)}.`);
    updateCards();
  }

  // ------------------------------------------------------------ éditeur
  let editing = null;
  let edDur = 1;
  const recorder = {
    on: false, cur: null, since: 0, last: null,
    start() { this.on = true; this.cur = null; this.last = null; },
    stop() { this.on = false; this.commit(); },
    frame(rel, held) {
      const now = performance.now();
      if (rel == null || rel < M.LOW - 2 || rel > M.HIGH + 2) {
        if (this.cur != null) this.commit();
        return;
      }
      if (held < 120) return; // pas encore stable
      if (this.cur !== rel) { this.commit(); this.cur = rel; this.since = now - held; }
    },
    commit() {
      if (this.cur == null) return;
      const ms = performance.now() - this.since;
      const tempo = parseInt($("#ed-tempo").value, 10) || 90;
      const beats = Math.max(0.5, Math.round((ms / 1000) * (tempo / 60) * 2) / 2);
      appendToken(M.midiToToken(this.cur) + (beats !== 1 ? ":" + beats : ""));
      this.cur = null;
    },
  };
  function appendToken(tok) {
    const ta = $("#ed-notes");
    ta.value = (ta.value.trim() + " " + tok).trim();
    ta.scrollTop = ta.scrollHeight;
  }
  function renderKeys() {
    const el = $("#ed-keys");
    el.innerHTML = "";
    for (let m = M.LOW; m <= M.HIGH; m++) {
      if (M.SHARPS.has(m)) continue;
      const b = document.createElement("button");
      b.className = "key"; b.type = "button";
      b.innerHTML = `${nameOf(m)}<small>${M.midiToToken(m)}</small>`;
      b.style.borderBottomColor = window.NOTE_COLORS[m % 12];
      b.onclick = () => { audio(); synth.note(m + octShift(), ctx.currentTime + 0.01, 0.35); appendToken(M.midiToToken(m) + (edDur !== 1 ? ":" + edDur : "")); };
      el.appendChild(b);
    }
  }
  function openEditor(song) {
    editing = song || null;
    $("#ed-title").value = song ? song.titre : "";
    $("#ed-cat").value = song ? song.cat : settings.cat === "debut" ? "perso" : settings.cat;
    $("#ed-tempo").value = song ? song.tempo : 90;
    $("#ed-notes").value = song ? song.notes : "";
    $("#ed-delete").hidden = !song;
    $("#ed-msg").textContent = "";
    renderKeys();
    show("editor");
  }
  function edMsg(t, kind) { const m = $("#ed-msg"); m.textContent = t; m.className = "msg" + (kind ? " " + kind : ""); }

  // ------------------------------------------------------------ réglages
  function openSettings() {
    $("#set-notation").value = settings.notation;
    $("#set-oct").value = settings.oct;
    $("#set-ignore-oct").checked = settings.ignoreOct;
    $("#set-sens").value = settings.sens;
    $("#set-detected").textContent = settings.oct === "auto"
      ? `Détecté pour l'instant : le Do grave sonne en ${settings.detectedOct === 12 ? "Do6" : "Do5"}.` : "";
    $("#settings").showModal();
  }
  $("#settings").addEventListener("close", () => {
    settings.notation = $("#set-notation").value;
    settings.oct = $("#set-oct").value;
    settings.ignoreOct = $("#set-ignore-oct").checked;
    settings.sens = parseFloat($("#set-sens").value);
    if (listener) listener.sensitivity = settings.sens;
    saveSettings();
    renderSongs();
    if ($("#play").classList.contains("active")) { renderTrack(); updateCards(); }
    if ($("#editor").classList.contains("active")) renderKeys();
  });

  // ------------------------------------------------------------ branchements
  const scene = new window.Scene($("#scene"));
  window.drawHeroIcon($("#logo-hero"), 4);

  $("#btn-settings").onclick = openSettings;
  $("#btn-settings2").onclick = openSettings;
  $("#btn-tuner").onclick = openTuner;
  $("#btn-new-song").onclick = () => openEditor(null);
  $("#btn-back").onclick = () => { stopAll(); if (!recorder.on) stopMic(); show("home"); renderSongs(); };
  $$(".mode").forEach((b) => (b.onclick = () => setMode(b.dataset.mode)));
  $("#btn-start").onclick = onStart;
  $("#btn-restart").onclick = () => { const m = game.mode; setMode(m); if (m !== "free") onStart(); };
  $("#btn-hint").onclick = () => {
    const n = noteAt(game.idx); if (!n) return;
    audio();
    const was = game.running; game.running = false; // ne pas s'écouter soi-même
    synth.note(n.midi + octShift(), ctx.currentTime + 0.02, 0.8);
    setTimeout(() => { game.running = was; game.stableMidi = null; }, 1000);
  };
  $("#tempo").value = settings.tempo;
  $("#tempo-val").textContent = settings.tempo + " %";
  $("#tempo").oninput = (e) => { settings.tempo = +e.target.value; $("#tempo-val").textContent = settings.tempo + " %"; saveSettings(); };
  $("#res-ok").onclick = () => $("#result").close();
  $("#res-again").onclick = () => { $("#result").close(); setMode("follow"); onStart(); };

  // éditeur
  $("#ed-back").onclick = () => { if (recorder.on) toggleRec(); stopDemo(); stopMic(); show("home"); renderSongs(); };
  $$(".ed-dur .chip[data-d]").forEach((c) => (c.onclick = () => {
    edDur = parseFloat(c.dataset.d);
    $$(".ed-dur .chip[data-d]").forEach((x) => x.classList.toggle("on", x === c));
  }));
  $("#ed-bar").onclick = () => appendToken("|");
  $("#ed-undo").onclick = () => { const ta = $("#ed-notes"); ta.value = ta.value.trim().split(/\s+/).slice(0, -1).join(" "); };
  async function toggleRec() {
    if (recorder.on) { recorder.stop(); $("#ed-rec").textContent = "⏺ Enregistrer en jouant"; $("#ed-rec").classList.remove("on"); edMsg("Enregistrement arrêté. Tu peux corriger les notes à la main."); return; }
    if (!(await startMic())) { edMsg("Micro indisponible.", "bad"); return; }
    recorder.start();
    $("#ed-rec").textContent = "⏹ Arrêter l'enregistrement";
    $("#ed-rec").classList.add("on");
    edMsg("Je t'écoute : joue la mélodie note par note, en détachant bien chaque note.", "ok");
  }
  $("#ed-rec").onclick = toggleRec;
  $("#ed-test").onclick = () => {
    try {
      const notes = M.parseSong($("#ed-notes").value);
      if (!notes.length) return edMsg("Ajoute d'abord quelques notes.", "bad");
      playDemo(notes, { tempo: parseInt($("#ed-tempo").value, 10) || 90 });
      edMsg("");
    } catch (e) { edMsg(e.message, "bad"); }
  };
  $("#ed-save").onclick = () => {
    const titre = $("#ed-title").value.trim();
    const notes = $("#ed-notes").value.trim();
    if (!titre) return edMsg("Donne un titre à ta mélodie.", "bad");
    try {
      const parsed = M.parseSong(notes);
      if (!parsed.some((n) => n.midi != null)) return edMsg("Il faut au moins une note.", "bad");
      const out = parsed.filter((n) => n.midi != null && (n.midi < M.LOW || n.midi > M.HIGH));
      if (out.length) return edMsg(`${M.midiToToken(out[0].midi)} est hors de la tessiture (C5 → F6).`, "bad");
    } catch (e) { return edMsg(e.message, "bad"); }
    const song = {
      id: editing ? editing.id : "u" + Date.now().toString(36), user: true,
      cat: $("#ed-cat").value, titre, sous: "Ma mélodie",
      tempo: parseInt($("#ed-tempo").value, 10) || 90, diff: 1, notes,
    };
    userSongs = userSongs.filter((s) => s.id !== song.id).concat(song);
    store.set("userSongs", userSongs);
    editing = song;
    $("#ed-delete").hidden = false;
    settings.cat = song.cat; saveSettings();
    edMsg("Sauvegardée ✓ Tu la retrouves sur l'accueil (appui long dessus pour la modifier).", "ok");
  };
  $("#ed-delete").onclick = () => {
    if (!editing || !confirm("Supprimer « " + editing.titre + " » ?")) return;
    userSongs = userSongs.filter((s) => s.id !== editing.id);
    store.set("userSongs", userSongs);
    show("home"); renderTabs(); renderSongs();
  };

  renderTabs();
  renderSongs();

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  // pour les tests
  window.__oca = { game, settings, onPitch, scene };
})();
