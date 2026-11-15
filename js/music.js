// =====================================================================
//  Théorie musicale, doigtés, détection de hauteur (YIN), synthé ocarina
// =====================================================================
(function () {
  const LETTERS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const FR = ["Do", "Do♯", "Ré", "Mi♭", "Mi", "Fa", "Fa♯", "Sol", "Sol♯", "La", "Si♭", "Si"];
  const EN = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "G♯", "A", "B♭", "B"];
  const LOW = 72;   // C5 : la note la plus grave (tout bouché), notation ocarina alto en Do
  const HIGH = 89;  // F6 : la plus aiguë

  function parseNote(tok) {
    const m = /^([A-Ga-g])([#b]?)(-?\d)$/.exec(tok);
    if (!m) return null;
    let midi = LETTERS[m[1].toUpperCase()] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
    return midi + (parseInt(m[3], 10) + 1) * 12;
  }

  // "C5:2 D5 | R:1 ..." -> [{midi, dur, phrase}]  (midi null = silence)
  function parseSong(str) {
    const out = [];
    let phrase = 0;
    for (const raw of str.trim().split(/\s+/)) {
      if (!raw) continue;
      if (raw === "|") { phrase++; continue; }
      const [n, d] = raw.split(":");
      const dur = d ? parseFloat(d) : 1;
      if (n.toUpperCase() === "R" || n === "-") { out.push({ midi: null, dur, phrase }); continue; }
      const midi = parseNote(n);
      if (midi == null) throw new Error("Note inconnue : « " + raw + " »");
      out.push({ midi, dur: isFinite(dur) && dur > 0 ? dur : 1, phrase });
    }
    return out;
  }

  function midiToName(midi, notation) {
    const pc = ((midi % 12) + 12) % 12;
    return (notation === "en" ? EN : FR)[pc];
  }
  function octaveLabel(midi) {
    if (midi < 72) return "grave";
    if (midi >= 84) return "aigu";
    return "";
  }
  function midiToToken(midi) {
    const pc = ((midi % 12) + 12) % 12;
    const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    return names[pc] + (Math.floor(midi / 12) - 1);
  }

  // ------------------------------------------------------------------
  //  DOIGTÉS — ocarina traversier 11 trous Musique de Terre (tablature
  //  officielle du fabricant) : 4 trous main gauche, 3 trous + 1 trou double
  //  (auriculaire droit) main droite, 2 pouces dessous. Pas de sous-trou :
  //  la note la plus grave est le Do.
  //  Lp Lr Lm Li = auriculaire, annulaire, majeur, index gauche ;
  //  Rp (double) Rr Rm Ri = idem à droite ; Lt / Rt = pouces.
  //  Valeur : 1 bouché, 0.5 = un seul des deux petits trous bouché.
  // ------------------------------------------------------------------
  const ALL10 = ["Lt", "Lp", "Lr", "Lm", "Li", "Rt", "Ri", "Rm", "Rr", "Rp"];
  const close = (list, extra) => {
    const f = {};
    list.forEach((h) => (f[h] = 1));
    Object.assign(f, extra || {});
    return f;
  };
  const without = (...h) => ALL10.filter((x) => !h.includes(x));
  const LEFT = ["Lt", "Lp", "Lr", "Lm", "Li", "Rt"];

  const FINGERINGS = {
    72: close(ALL10),                                   // Do
    73: close(without("Rp"), { Rp: 0.5 }),              // Do♯ (un seul petit trou)
    74: close(without("Rp")),                           // Ré
    75: close(without("Rr")),                           // Mi♭
    76: close(without("Rp", "Rr")),                     // Mi
    77: close(without("Rp", "Rr", "Rm")),               // Fa
    78: close([...LEFT, "Rm"]),                         // Fa♯
    79: close(LEFT),                                    // Sol
    80: close(["Lt", "Lp", "Lm", "Li", "Rt", "Rr"]),     // Sol♯
    81: close(["Lt", "Lp", "Lm", "Li", "Rt"]),           // La
    82: close(["Lt", "Lp", "Li", "Rt", "Ri"]),           // Si♭
    83: close(["Lt", "Lp", "Li", "Rt"]),                 // Si
    84: close(["Lt", "Lp", "Rt"]),                       // Do aigu
    85: close(["Lp", "Li", "Rt"]),                       // Do♯ aigu
    86: close(["Lp", "Rt"]),                             // Ré aigu
    87: close(["Lm", "Rt"]),                             // Mi♭ aigu
    88: close(["Rt"]),                                   // Mi aigu
    89: close([]),                                       // Fa aigu (tout ouvert)
  };
  const SHARPS = new Set([73, 75, 78, 80, 82, 85, 87]);
  const CHROMATIC_APPROX = new Set();

  function fingering(midi) {
    return FINGERINGS[midi] || null;
  }

  // ------------------------------------------------------------------
  //  Détection de hauteur : YIN (de Cheveigné & Kawahara)
  // ------------------------------------------------------------------
  function yin(buf, sr, fmin, fmax, threshold) {
    const W = Math.floor(buf.length / 2);
    const tauMin = Math.max(2, Math.floor(sr / fmax));
    const tauMax = Math.min(W - 1, Math.ceil(sr / fmin));
    const d = new Float32Array(tauMax + 2);
    for (let tau = tauMin; tau <= tauMax + 1; tau++) {
      let s = 0;
      for (let i = 0; i < W; i++) {
        const x = buf[i] - buf[i + tau];
        s += x * x;
      }
      d[tau] = s;
    }
    // différence cumulée normalisée
    let run = 0;
    for (let tau = 1; tau < tauMin; tau++) {
      let s = 0;
      for (let i = 0; i < W; i++) { const x = buf[i] - buf[i + tau]; s += x * x; }
      run += s;
    }
    const cmnd = new Float32Array(tauMax + 2);
    for (let tau = tauMin; tau <= tauMax + 1; tau++) {
      run += d[tau];
      cmnd[tau] = run > 0 ? (d[tau] * tau) / run : 1;
    }
    let best = -1;
    for (let tau = tauMin; tau <= tauMax; tau++) {
      if (cmnd[tau] < threshold) {
        while (tau + 1 <= tauMax && cmnd[tau + 1] < cmnd[tau]) tau++;
        best = tau;
        break;
      }
    }
    if (best < 0) return null;
    // interpolation parabolique
    const a = cmnd[best - 1] ?? cmnd[best], b = cmnd[best], c = cmnd[best + 1] ?? cmnd[best];
    const den = a + c - 2 * b;
    const shift = den !== 0 ? (a - c) / (2 * den) : 0;
    const t = best + Math.max(-1, Math.min(1, shift));
    return { freq: sr / t, clarity: 1 - b };
  }

  class PitchListener {
    constructor() {
      this.ctx = null; this.stream = null; this.analyser = null;
      this.buf = null; this.running = false; this.onPitch = null;
      this.sensitivity = 0.5; // 0..1
      this.history = [];
    }
    async start(ctx) {
      this.ctx = ctx;
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const src = ctx.createMediaStreamSource(this.stream);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass"; hp.frequency.value = 300;
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      src.connect(hp); hp.connect(this.analyser);
      this.buf = new Float32Array(this.analyser.fftSize);
      this.running = true;
      const loop = () => {
        if (!this.running) return;
        this.analyser.getFloatTimeDomainData(this.buf);
        this.onPitch && this.onPitch(this.analyse());
        requestAnimationFrame(loop);
      };
      loop();
    }
    analyse() {
      let rms = 0;
      for (let i = 0; i < this.buf.length; i++) rms += this.buf[i] * this.buf[i];
      rms = Math.sqrt(rms / this.buf.length);
      const gate = 0.004 + (1 - this.sensitivity) * 0.03;
      if (rms < gate) { this.history.length = 0; return { rms, freq: null }; }
      const r = yin(this.buf, this.ctx.sampleRate, 380, 3300, 0.15);
      if (!r || r.clarity < 0.8) { return { rms, freq: null }; }
      // médiane glissante pour lisser
      this.history.push(r.freq);
      if (this.history.length > 5) this.history.shift();
      const sorted = [...this.history].sort((a, b) => a - b);
      const freq = sorted[Math.floor(sorted.length / 2)];
      const midiF = 69 + 12 * Math.log2(freq / 440);
      return { rms, freq, midiF, midi: Math.round(midiF), cents: Math.round((midiF - Math.round(midiF)) * 100), clarity: r.clarity };
    }
    stop() {
      this.running = false;
      if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }

  // ------------------------------------------------------------------
  //  Petit synthé « ocarina » (sinus doux + souffle + vibrato)
  // ------------------------------------------------------------------
  // Synthèse d'ocarina : un ocarina (flûte globulaire) donne un son presque
  // sinusoïdal, avec très peu d'harmoniques, beaucoup de souffle, un petit
  // « chiff » d'attaque, une note qui monte légèrement en se posant et qui
  // baisse un peu quand le souffle s'arrête. Une petite réverbération
  // donne la sensation d'une pièce.
  class OcarinaSynth {
    constructor(ctx) {
      this.ctx = ctx;
      this.out = ctx.createGain();
      this.out.gain.value = 0.42;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 7000; lp.Q.value = 0.5;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.ratio.value = 3;
      this.out.connect(lp); lp.connect(comp); comp.connect(ctx.destination);
      // réverbération : réponse impulsionnelle générée (bruit qui s'éteint)
      try {
        const rl = Math.floor(ctx.sampleRate * 1.6), ir = ctx.createBuffer(2, rl, ctx.sampleRate);
        for (let c = 0; c < 2; c++) {
          const d = ir.getChannelData(c);
          for (let i = 0; i < rl; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rl, 3.2) * (i < 200 ? i / 200 : 1);
        }
        const conv = ctx.createConvolver(); conv.buffer = ir;
        const wet = ctx.createGain(); wet.gain.value = 0.22;
        lp.connect(conv); conv.connect(wet); wet.connect(comp);
      } catch (e) { /* pas de réverbération sur ce navigateur */ }
      // timbre : fondamentale + traces d'harmoniques
      this.wave = ctx.createPeriodicWave(new Float32Array([0, 0, 0, 0, 0, 0]), new Float32Array([0, 1, 0.055, 0.022, 0.008, 0.004]));
      // bruit de souffle partagé
      const len = ctx.sampleRate * 2;
      const nb = ctx.createBuffer(1, len, ctx.sampleRate);
      const ch = nb.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
      this.noiseBuf = nb;
    }
    // Une « voix » = un souffle continu : les notes d'une même phrase sont
    // liées (legato) — la hauteur glisse très vite d'une note à l'autre,
    // avec juste un petit coup de langue (« dou ») pour marquer chaque note.
    voice(start, vol = 1) {
      const ctx = this.ctx, self = this;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, start); g.connect(this.out);
      const o = ctx.createOscillator(); o.setPeriodicWave(this.wave);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 4.8 + Math.random() * 0.6;
      const vib = ctx.createGain(); vib.gain.setValueAtTime(0, start);
      const trem = ctx.createGain(); trem.gain.value = 1;
      const tremDepth = ctx.createGain(); tremDepth.gain.setValueAtTime(0, start);
      lfo.connect(vib); vib.connect(o.frequency); lfo.connect(tremDepth); tremDepth.connect(trem.gain);
      o.connect(trem); trem.connect(g);
      // souffle : large bande dans les aigus + bande étroite sur la note
      const n = ctx.createBufferSource(); n.buffer = this.noiseBuf; n.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 0.9;
      const ng = ctx.createGain(); ng.gain.value = 0.07;
      const bp2 = ctx.createBiquadFilter(); bp2.type = "bandpass"; bp2.Q.value = 12;
      const ng2 = ctx.createGain(); ng2.gain.value = 0.18;
      n.connect(bp); bp.connect(ng); ng.connect(g); n.connect(bp2); bp2.connect(ng2); ng2.connect(g);
      o.start(start); lfo.start(start); n.start(start, Math.random());
      let prevF = 0, prevMidi = null, lastF = 0;
      return {
        note(midi, t, dur) {
          const f = 440 * Math.pow(2, (midi - 69) / 12);
          const lvl = 0.72 * vol;
          if (!prevF) {
            // attaque : la note se pose en montant un peu
            o.frequency.setValueAtTime(f * 0.982, t);
            o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(0.88 * vol, t + 0.03);
            g.gain.setTargetAtTime(lvl, t + 0.04, 0.1);
            self.chiff(t, 0.22 * vol, f);
          } else {
            // liaison : glissé très court + petit creux de souffle (plus marqué si même note)
            const same = midi === prevMidi;
            o.frequency.setValueAtTime(prevF, t);
            o.frequency.exponentialRampToValueAtTime(f, t + (same ? 0.005 : 0.022));
            g.gain.setTargetAtTime(lvl * (same ? 0.18 : 0.55), Math.max(0, t - 0.012), same ? 0.006 : 0.008);
            g.gain.setTargetAtTime(lvl, t + (same ? 0.02 : 0.012), 0.03);
            self.chiff(t, (same ? 0.12 : 0.06) * vol, f);
          }
          bp.frequency.setValueAtTime(Math.min(9000, f * 2.6), t);
          bp2.frequency.setValueAtTime(f, t);
          // vibrato seulement sur les notes assez longues
          vib.gain.setValueAtTime(0, t); tremDepth.gain.setValueAtTime(0, t);
          if (dur > 0.35) {
            vib.gain.setValueAtTime(0, t + Math.min(0.25, dur * 0.4));
            vib.gain.linearRampToValueAtTime(f * 0.0035, t + Math.min(0.8, dur * 0.85));
            tremDepth.gain.linearRampToValueAtTime(0.07, t + Math.min(0.8, dur * 0.85));
          }
          prevF = f; prevMidi = midi; lastF = f;
        },
        end(t) {
          const rel = 0.07;
          g.gain.setTargetAtTime(0.0001, t, rel / 3);
          if (lastF) { o.frequency.setValueAtTime(lastF, t); o.frequency.exponentialRampToValueAtTime(lastF * 0.985, t + rel); }
          vib.gain.setValueAtTime(0, t);
          const stopAt = t + rel + 0.2;
          o.stop(stopAt); lfo.stop(stopAt); n.stop(stopAt);
        },
      };
    }
    chiff(t, amp, f) {
      const ctx = this.ctx;
      const c = ctx.createBufferSource(); c.buffer = this.noiseBuf;
      const hp = ctx.createBiquadFilter(); hp.type = "bandpass"; hp.frequency.value = Math.min(10000, f * 4); hp.Q.value = 0.7;
      const cg = ctx.createGain();
      cg.gain.setValueAtTime(0.0001, t);
      cg.gain.linearRampToValueAtTime(amp, t + 0.008);
      cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      c.connect(hp); hp.connect(cg); cg.connect(this.out);
      c.start(t, Math.random()); c.stop(t + 0.1);
    }
    // une note isolée (aperçu, indice, petites musiques)
    note(midi, start, dur, vol = 1) {
      const v = this.voice(start, vol);
      v.note(midi, start, Math.max(0.08, dur));
      v.end(start + Math.max(0.08, dur));
    }
    chime(kind) {
      const t = this.ctx.currentTime + 0.02;
      const seq = kind === "win"
        ? [[84, 0, .12], [88, .12, .12], [91, .24, .12], [96, .36, .5]]
        : kind === "ok" ? [[96, 0, .07]] : [[62, 0, .15], [61, .15, .25]];
      seq.forEach(([m, d, l]) => this.note(m, t + d, l, kind === "ok" ? 0.25 : 0.6));
    }
  }

  window.Music = {
    LOW, HIGH, parseNote, parseSong, midiToName, octaveLabel, midiToToken,
    fingering, CHROMATIC_APPROX, SHARPS, PitchListener, OcarinaSynth, yin,
  };
})();
