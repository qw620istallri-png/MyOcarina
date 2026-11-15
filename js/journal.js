// =====================================================================
//  Le carnet de progrès : temps de pratique, séries de jours, morceaux
//  appris, records et badges. Tout reste dans le navigateur (localStorage).
// =====================================================================
(function () {
  const KEY = "oca.journal";
  const empty = () => ({ v: 1, days: {}, songs: {}, totals: { hits: 0, done: 0, sec: 0, bestCombo: 0 }, badges: {}, goal: 10 });
  let J;
  try { J = Object.assign(empty(), JSON.parse(localStorage.getItem(KEY) || "{}")); } catch { J = empty(); }
  let dirty = false;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(J)); } catch {} dirty = false; };
  setInterval(() => dirty && save(), 5000);
  window.addEventListener("pagehide", () => dirty && save());
  document.addEventListener("visibilitychange", () => document.hidden && dirty && save());

  // ------------------------------------------------------------ dates
  const pad = (n) => String(n).padStart(2, "0");
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const today = () => (J.days[dayKey()] ||= { sec: 0, hits: 0, songs: [] });
  const song = (id) => (J.songs[id] ||= { plays: 0, done: 0, bestAcc: 0, bestCombo: 0, sec: 0, last: null, first: null });

  // jours d'affilée (aujourd'hui compte s'il y a eu de la pratique, sinon on part d'hier)
  function streak() {
    let d = new Date(), n = 0;
    const active = (k) => J.days[k] && J.days[k].sec >= 30;
    if (!active(dayKey(d))) d = addDays(d, -1);
    while (active(dayKey(d))) { n++; d = addDays(d, -1); }
    return n;
  }
  function bestStreak() {
    const keys = Object.keys(J.days).filter((k) => J.days[k].sec >= 30).sort();
    let best = 0, cur = 0, prev = null;
    keys.forEach((k) => {
      const d = new Date(k + "T12:00:00");
      cur = prev && Math.round((d - prev) / 864e5) === 1 ? cur + 1 : 1;
      best = Math.max(best, cur); prev = d;
    });
    return best;
  }

  // ------------------------------------------------------------ badges
  const BADGES = [
    { id: "note1", ico: "🎵", nom: "Première note", desc: "Jouer une note juste en mode « Jouer avec moi »", ok: () => J.totals.hits >= 1 },
    { id: "done1", ico: "🌱", nom: "Premier morceau", desc: "Aller jusqu'au bout d'une mélodie", ok: () => J.totals.done >= 1 },
    { id: "perfect", ico: "⭐", nom: "Sans faute", desc: "Finir un morceau sans aucune erreur", ok: (c) => Object.values(J.songs).some((s) => s.bestAcc >= 100) },
    { id: "combo10", ico: "🔥", nom: "Ça chauffe", desc: "Enchaîner 10 notes justes d'affilée", ok: () => J.totals.bestCombo >= 10 },
    { id: "combo50", ico: "💫", nom: "Dans le flow", desc: "Enchaîner 50 notes justes d'affilée", ok: () => J.totals.bestCombo >= 50 },
    { id: "hits500", ico: "🎶", nom: "500 notes", desc: "Jouer 500 notes justes en tout", ok: () => J.totals.hits >= 500 },
    { id: "hits2000", ico: "🏅", nom: "2 000 notes", desc: "Jouer 2 000 notes justes en tout", ok: () => J.totals.hits >= 2000 },
    { id: "songs5", ico: "📜", nom: "Répertoire", desc: "Terminer 5 morceaux différents", ok: () => doneSongs() >= 5 },
    { id: "songs15", ico: "🧭", nom: "Grande voyageuse", desc: "Terminer 15 morceaux différents", ok: () => doneSongs() >= 15 },
    { id: "days3", ico: "📅", nom: "Bonne habitude", desc: "Jouer 3 jours d'affilée", ok: () => bestStreak() >= 3 },
    { id: "days7", ico: "🗓️", nom: "Une semaine entière", desc: "Jouer 7 jours d'affilée", ok: () => bestStreak() >= 7 },
    { id: "hour1", ico: "⏳", nom: "Une heure de musique", desc: "Cumuler 1 heure de pratique", ok: () => J.totals.sec >= 3600 },
    { id: "hour10", ico: "🏰", nom: "Virtuose", desc: "Cumuler 10 heures de pratique", ok: () => J.totals.sec >= 36000 },
    { id: "goal", ico: "🎯", nom: "Objectif du jour", desc: "Atteindre son objectif de pratique dans la journée", ok: () => Object.values(J.days).some((d) => d.sec >= J.goal * 60) },
    { id: "night", ico: "🌙", nom: "Sérénade nocturne", desc: "Jouer un morceau en entier après 22 h", ok: (c) => c && c.done && new Date().getHours() >= 22 },
    { id: "morning", ico: "☀️", nom: "Lève-tôt", desc: "Jouer un morceau en entier avant 9 h", ok: (c) => c && c.done && new Date().getHours() < 9 },
    { id: "zelda", ico: "🗡️", nom: "Héros du temps", desc: "Terminer 5 morceaux de Zelda", ok: () => doneIn(["zelda", "zelda2"]) >= 5 },
    { id: "lotr", ico: "💍", nom: "Hobbit mélomane", desc: "Terminer un morceau de la Terre du Milieu", ok: () => doneIn(["lotr"]) >= 1 },
    { id: "valley", ico: "🐔", nom: "Fermière musicienne", desc: "Terminer un morceau de la Vallée", ok: () => doneIn(["stardew"]) >= 1 },
  ];
  const doneSongs = () => Object.values(J.songs).filter((s) => s.done > 0).length;
  const catOf = {};
  const doneIn = (cats) => Object.entries(J.songs).filter(([id, s]) => s.done > 0 && cats.includes(catOf[id])).length;

  let onBadge = null;
  function checkBadges(ctx) {
    const fresh = [];
    BADGES.forEach((b) => {
      if (!J.badges[b.id] && b.ok(ctx)) { J.badges[b.id] = dayKey(); fresh.push(b); }
    });
    if (fresh.length) { save(); if (onBadge && !(ctx && ctx.quiet)) fresh.forEach(onBadge); }
    return fresh;
  }

  // ------------------------------------------------------------ enregistrements
  const API = {
    setCatalog(songs) { songs.forEach((s) => s.id && (catOf[s.id] = s.cat)); },
    onBadge(fn) { onBadge = fn; },
    // appelé chaque seconde de pratique active
    tick(songId, sec = 1) {
      const d = today();
      d.sec += sec; J.totals.sec += sec;
      if (songId) { const s = song(songId); s.sec += sec; if (!d.songs.includes(songId)) d.songs.push(songId); }
      dirty = true;
      if (d.sec % 30 === 0) checkBadges();
    },
    start(songId) {
      if (!songId) return;
      const s = song(songId); s.plays++; s.last = dayKey(); dirty = true;
    },
    hit(songId, combo) {
      today().hits++; J.totals.hits++;
      if (combo > J.totals.bestCombo) J.totals.bestCombo = combo;
      if (songId && combo > song(songId).bestCombo) song(songId).bestCombo = combo;
      dirty = true;
      if (J.totals.hits === 1 || combo === 10 || combo === 50 || J.totals.hits % 100 === 0) checkBadges();
    },
    // fin d'un morceau : renvoie les records battus et les badges gagnés
    complete(songId, { acc, combo }) {
      const res = { records: [], badges: [] };
      J.totals.done++;
      if (songId) {
        const s = song(songId);
        if (s.done === 0) { res.records.push("Premier passage complet de ce morceau 🎉"); s.first = dayKey(); }
        else if (acc > s.bestAcc) res.records.push(`Nouveau record de justesse : ${acc} % (avant ${s.bestAcc} %)`);
        if (combo > s.bestCombo && s.done > 0 && combo >= 5) res.records.push(`Plus longue série sur ce morceau : ×${combo}`);
        s.done++; s.last = dayKey();
        s.bestAcc = Math.max(s.bestAcc, acc); s.bestCombo = Math.max(s.bestCombo, combo);
      }
      save();
      res.badges = checkBadges({ done: true, quiet: true });
      return res;
    },
    todayInfo() { const d = J.days[dayKey()] || { sec: 0 }; return { min: Math.floor(d.sec / 60), goal: J.goal, streak: streak() }; },
    songInfo(id) { return J.songs[id] || null; },
    setGoal(min) { J.goal = min; save(); },
    exportData() { save(); return JSON.stringify(J, null, 1); },
    importData(text) {
      const d = JSON.parse(text);
      if (!d || d.v !== 1 || !d.days || !d.songs) throw new Error("Ce fichier n'est pas une sauvegarde du carnet.");
      J = Object.assign(empty(), d); save();
    },
    data: () => J,
    BADGES, streak, bestStreak, dayKey, addDays,
  };

  // ------------------------------------------------------------ rendu de l'écran « Mon carnet »
  const fmtTime = (sec) => {
    const m = Math.round(sec / 60);
    if (m < 60) return `${m} min`;
    return `${Math.floor(m / 60)} h ${pad(m % 60)}`;
  };
  const ago = (k) => {
    if (!k) return "";
    const n = Math.round((new Date(dayKey() + "T12:00:00") - new Date(k + "T12:00:00")) / 864e5);
    return n <= 0 ? "aujourd'hui" : n === 1 ? "hier" : `il y a ${n} j`;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  API.render = function (root, { songs, categories, best, onOpen }) {
    API.setCatalog(songs);
    checkBadges({ quiet: true });
    const t = API.todayInfo();
    const done = songs.filter((s) => J.songs[s.id] && J.songs[s.id].done > 0);
    const mastered = songs.filter((s) => (best[s.id] || 0) >= 3);

    // semaine : 7 derniers jours
    const DOW = ["D", "L", "M", "M", "J", "V", "S"];
    const week = [];
    for (let i = 6; i >= 0; i--) { const d = addDays(new Date(), -i); const k = dayKey(d); week.push({ k, lab: DOW[d.getDay()], min: Math.round(((J.days[k] || {}).sec || 0) / 60), today: i === 0 }); }
    const maxMin = Math.max(J.goal, ...week.map((w) => w.min));
    const weekMin = week.reduce((a, w) => a + w.min, 0);

    // suggestion : un morceau commencé mais pas encore parfait, sinon un nouveau morceau facile
    const started = songs.filter((s) => J.songs[s.id] && J.songs[s.id].plays > 0 && (best[s.id] || 0) < 3)
      .sort((a, b) => (J.songs[b.id].last || "").localeCompare(J.songs[a.id].last || ""));
    const fresh = songs.filter((s) => !J.songs[s.id] && s.notes).sort((a, b) => (a.diff || 1) - (b.diff || 1));
    const sugg = started[0] || fresh[0];

    const goalPct = Math.min(100, Math.round((t.min / J.goal) * 100));
    let h = `
      <div class="j-grid">
        <div class="j-stat"><span>⏳</span><b>${fmtTime(J.totals.sec)}</b><small>de pratique</small></div>
        <div class="j-stat"><span>📅</span><b>${t.streak} jour${t.streak > 1 ? "s" : ""}</b><small>d'affilée · record ${bestStreak()}</small></div>
        <div class="j-stat"><span>🎵</span><b>${J.totals.hits.toLocaleString("fr-FR")}</b><small>notes justes</small></div>
        <div class="j-stat"><span>📜</span><b>${done.length} / ${songs.filter((s) => s.notes).length}</b><small>morceaux joués en entier · ${mastered.length} ★★★</small></div>
      </div>

      <section class="panel j-sec">
        <h3>Aujourd'hui</h3>
        <div class="j-goal"><div class="j-goal-bar" style="width:${goalPct}%"></div><span>${t.min} / ${J.goal} min ${goalPct >= 100 ? "· objectif atteint 🎉" : ""}</span></div>
        <label class="j-goal-set">Objectif par jour :
          <select id="j-goal">${[5, 10, 15, 20, 30, 45, 60].map((m) => `<option value="${m}" ${m === J.goal ? "selected" : ""}>${m} min</option>`).join("")}</select>
        </label>
        ${sugg ? `<button class="btn j-sugg" data-open="${esc(sugg.id)}">💡 ${started[0] ? "À reprendre" : "À découvrir"} : <b>${esc(sugg.titre)}</b></button>` : ""}
      </section>

      <section class="panel j-sec">
        <h3>Cette semaine <small>${fmtTime(weekMin * 60)}</small></h3>
        <div class="j-week">
          ${week.map((w) => `<div class="j-day${w.today ? " today" : ""}${w.min >= J.goal ? " goal" : ""}" title="${w.k} : ${w.min} min">
            <div class="j-bar-wrap"><div class="j-bar" style="height:${Math.round((w.min / maxMin) * 100)}%"></div><div class="j-line" style="bottom:${Math.round((J.goal / maxMin) * 100)}%"></div></div>
            <small>${w.min || ""}</small><b>${w.lab}</b></div>`).join("")}
        </div>
      </section>

      <section class="panel j-sec">
        <h3>Badges <small>${Object.keys(J.badges).length} / ${BADGES.length}</small></h3>
        <div class="j-badges">
          ${BADGES.map((b) => { const got = J.badges[b.id]; return `<div class="j-badge${got ? " got" : ""}" title="${esc(b.desc)}">
            <span class="ico">${got ? b.ico : "🔒"}</span><b>${esc(b.nom)}</b><small>${got ? "obtenu " + ago(got) : esc(b.desc)}</small></div>`; }).join("")}
        </div>
      </section>

      <section class="panel j-sec">
        <h3>Mes morceaux</h3>
        ${categories.map((c) => {
          const list = songs.filter((s) => s.cat === c.id && s.notes);
          if (!list.length) return "";
          const nDone = list.filter((s) => J.songs[s.id] && J.songs[s.id].done > 0).length;
          return `<details class="j-cat" ${nDone ? "open" : ""}><summary>${c.icone} ${esc(c.nom)} <small>${nDone} / ${list.length}</small>
              <span class="j-mini"><span style="width:${Math.round((nDone / list.length) * 100)}%"></span></span></summary>
            ${list.map((s) => {
              const st = J.songs[s.id], b = best[s.id] || 0;
              const status = !st ? "new" : st.done ? (b >= 3 ? "master" : "done") : "started";
              const lab = { new: "à découvrir", started: "commencé", done: "joué en entier", master: "maîtrisé" }[status];
              return `<button class="j-song ${status}" data-open="${esc(s.id)}">
                <span class="j-stars">${"★".repeat(b)}<i>${"★".repeat(3 - b)}</i></span>
                <span class="j-name"><b>${esc(s.titre)}</b><small>${lab}${st && st.bestAcc ? ` · ${st.bestAcc} %` : ""}${st && st.plays ? ` · ${st.plays} essai${st.plays > 1 ? "s" : ""}` : ""}${st && st.last ? ` · ${ago(st.last)}` : ""}</small></span>
              </button>`;
            }).join("")}
          </details>`;
        }).join("")}
      </section>

      <section class="panel j-sec j-save">
        <h3>Sauvegarde</h3>
        <p>Le carnet est gardé dans ce navigateur. Pour le transférer sur un autre appareil (ou le mettre à l'abri), enregistre-le dans un fichier.</p>
        <div class="home-tools"><button class="btn" id="j-export">💾 Enregistrer mon carnet</button>
        <label class="btn" for="j-import-file">📂 Restaurer un carnet</label><input type="file" id="j-import-file" accept=".json,application/json" hidden></div>
      </section>`;
    root.innerHTML = h;

    const args = arguments[1];
    root.querySelectorAll("[data-open]").forEach((b) => (b.onclick = () => { const s = songs.find((x) => x.id === b.dataset.open); if (s) onOpen(s); }));
    root.querySelector("#j-goal").onchange = (e) => { API.setGoal(+e.target.value); API.render(root, args); };
    root.querySelector("#j-export").onclick = () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([API.exportData()], { type: "application/json" }));
      a.download = `carnet-ocarina-${dayKey()}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };
    root.querySelector("#j-import-file").onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try { API.importData(await f.text()); API.render(root, args); }
      catch (err) { alert(err.message || "Fichier illisible."); }
    };
  };

  window.Journal = API;
})();
