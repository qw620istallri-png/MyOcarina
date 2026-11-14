# Le Carnet d'Ocarina 🎶

Petite appli web (PC + mobile, hors-ligne) pour apprendre l'ocarina traversier **11 trous** en Do (Musique de Terre) : tessiture Do → Fa aigu, doigtés d'après la tablature officielle du fabricant.

- **Jouer avec moi** : l'appli écoute au micro, avance quand la bonne note est jouée et signale les fausses notes.
- **Écouter** : démo jouée par le synthé, avec les doigtés qui défilent.
- **Libre** : accordeur, affiche la note jouée, sa justesse et son doigté.
- **Mes mélodies** : ajouter un air en tapant les notes ou en le jouant à l'ocarina (enregistreur).

## Mettre en ligne (GitHub Pages)
Settings → Pages → Source « Deploy from a branch » → `main` / `(root)`. L'appli est servie en https (obligatoire pour le micro).

## Ajouter des mélodies dans le code
Éditer `js/songs.js` : format `"NOTE:durée ..."` en notation ocarina (C5 = Do grave tout bouché → F6 = Fa aigu), ex. `"C5:2 D5 E5:.5 | R:1 F5"`.
Les doigtés sont dans `js/music.js` (`FINGERINGS`).

## Crédits
Les grands morceaux viennent des tablatures d'[OcWalk](https://www.ocwalk.com), converties par `tools/convert-ocwalk.py` (rythme approximatif). Usage privé.

Décors peints : images CC0 d'OpenGameArt (ansimuz, FabinhoSC, Blackwolfdave), détail dans `assets/bg/CREDITS.txt`.
