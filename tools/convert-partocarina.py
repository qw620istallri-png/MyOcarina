#!/usr/bin/env python3
"""Convertit une tablature de part-ocarina.com au format de l'appli.

Usage : python3 tools/convert-partocarina.py <slug ou id> [...]
Affiche, pour chaque tablature, la ligne « notes » prête à coller dans js/songs.js.

Format source (JSON de /tablature/infos?tablatureId=ID) : une liste d'éléments
- notes : "D5", "A-5" (= La♯5)…
- "tiret" / "tiretx2" : la note précédente est tenue 1 (ou 2) temps de plus
- "parenthesis-open" … "parenthesis-close" "x2" : passage répété
- "empty" : petit silence, "enter" : fin de ligne (= fin de phrase)
Le rythme exact n'est pas noté sur ces tablatures : il est donc approximatif.
"""
import json, re, subprocess, sys

NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
LOW, HIGH = 72, 89  # Do5 → Fa6 (ocarina 11 trous en Do)


def curl(url):
    return subprocess.run(["curl", "-sS", "-H", "X-Requested-With: XMLHttpRequest", url], capture_output=True, text=True).stdout


def tab_id(ref):
    if str(ref).isdigit():
        return int(ref)
    html = curl("https://part-ocarina.com/tablature/partition-ocarina/" + ref)
    m = re.search(r"nb-like-(\d+)", html)
    if not m:
        raise SystemExit("tablature introuvable : " + ref)
    return int(m.group(1))


def midi(n):
    m = re.fullmatch(r"([A-G])(-?)(\d)", n)
    return NAMES.index(m.group(1)) + (1 if m.group(2) else 0) + 12 * (int(m.group(3)) + 1)


def expand(items):
    """Déplie les reprises « ( … ) xN »."""
    out, stack = [], [[]]
    i = 0
    while i < len(items):
        it = items[i]
        if it == "parenthesis-open":
            stack.append([])
        elif it == "parenthesis-close":
            if len(stack) > 1: grp = stack.pop()
            else: grp, stack[0] = stack[0], []  # « ) x2 » sans « ( » : reprise depuis le début
            reps = 1
            if i + 1 < len(items) and re.fullmatch(r"x\d", items[i + 1]):
                reps = int(items[i + 1][1:]); i += 1
            stack[-1].extend(grp * reps)
        else:
            stack[-1].append(it)
        i += 1
    while len(stack) > 1:
        grp = stack.pop(); stack[-1].extend(grp)
    return stack[0]


def convert(items):
    seq = []  # [midi|None|'|', dur]
    unknown = set()
    for it in expand(items):
        if re.fullmatch(r"[A-G]-?\d", it):
            seq.append([midi(it), 1.0])
        elif it.startswith("tiret"):
            k = int(it[6:]) if it[5:6] == "x" and it[6:].isdigit() else 1
            for e in reversed(seq):
                if isinstance(e[0], int):
                    e[1] += k; break
        elif it == "empty":
            if seq and seq[-1][0] is not None and seq[-1][0] != "|":
                seq.append([None, 0.5])
        elif it == "enter":
            if seq and seq[-1][0] != "|":
                while seq and seq[-1][0] is None: seq.pop()
                seq.append(["|", 0])
        else:
            unknown.add(it)
    while seq and seq[-1][0] in (None, "|"): seq.pop()
    notes = [e[0] for e in seq if isinstance(e[0], int)]
    # phrases (séparées par « | ») : si une phrase sort de la tessiture, on la
    # déplace d'une octave en bloc plutôt que de casser la mélodie note à note
    phrases, cur = [], []
    for e in seq:
        if e[0] == "|": phrases.append(cur); cur = []
        else: cur.append(e)
    phrases.append(cur)

    def plan(sh):
        """renvoie (score, [décalage d'octave par phrase])"""
        folds, out, nfold = [], 0, 0
        for ph in phrases:
            ms = [m + sh for m, _ in ph if m is not None]
            best = None
            for k in (0, -12, 12, -24, 24):
                o = sum(1 for m in ms if not LOW <= m + k <= HIGH)
                if best is None or o < best[0]: best = (o, k)
            folds.append(best[1]); out += best[0]; nfold += best[1] != 0
        acc = sum(1 for m in notes if NAMES[(m + sh) % 12].endswith("#"))
        # on garde la tonalité d'origine si possible (les mélodies connues
        # restent reconnaissables), sinon le moins d'altérations possible
        return out * 100 + nfold * 4 + acc + (0 if sh == 0 else 6 + abs(sh) * 0.2), folds

    sh = min(range(-12, 13), key=lambda x: plan(x)[0])
    folds = plan(sh)[1]
    toks = []
    for pi, ph in enumerate(phrases):
        if pi: toks.append("|")
        for m, d in ph:
            if m is None: name = "R"
            else:
                mm = m + sh + folds[pi]
                while mm < LOW: mm += 12  # repli des rares notes encore hors tessiture
                while mm > HIGH: mm -= 12
                name = NAMES[mm % 12] + str(mm // 12 - 1)
            d = ("%g" % d).lstrip("0") if d < 1 else "%g" % d
            toks.append(name if d == "1" else name + ":" + d)
    unknown |= {"repli:%d" % i for i, f in enumerate(folds) if f}
    return " ".join(toks), sh, unknown, len(notes)


if __name__ == "__main__":
    for ref in sys.argv[1:]:
      try:
        tid = tab_id(ref)
        d = json.loads(curl("https://part-ocarina.com/tablature/infos?tablatureId=%d" % tid))["tablature"]
        items = [n["note"] for n in d["data"]["notes"]]
        notes, sh, unknown, n = convert(items)
        print(json.dumps({"ref": ref, "id": tid, "title": d["title"], "likes": d["nbLikes"], "tuning": (d.get("tuning") or {}).get("name"),
                          "fingering": (d.get("fingering") or {}).get("name"), "n": n, "shift": sh, "unknown": sorted(unknown), "notes": notes},
                         ensure_ascii=False))
      except Exception as e:
        print(json.dumps({"ref": ref, "error": str(e)}), flush=True)
