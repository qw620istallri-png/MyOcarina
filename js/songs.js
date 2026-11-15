// =====================================================================
//  RÉPERTOIRE DES MÉLODIES
// ---------------------------------------------------------------------
//  Format très simple, facile à compléter :
//    "NOTE:durée NOTE:durée ..."
//    - NOTE  : nom anglais + octave, en notation ocarina en Do
//              (de C5 = Do grave, tout bouché, jusqu'à F6 = Fa aigu, tout ouvert)
//              Dièses : C#5, F#5...   Bémols : Bb5, Eb5...
//    - durée : en temps (1 = noire, .5 = croche, 2 = blanche...). Défaut 1.
//    - R:1   : un silence d'un temps.
//    - |     : simple séparateur de phrase (sert à l'affichage et à la respiration).
//  Option : theme: "foret" | "orage" | "nuit" | "comte"… (voir js/themes.js) pour choisir le décor.
//  Si l'ocarina sonne une octave plus haut, l'appli s'adapte toute seule.
//  Les grands morceaux viennent de js/songs-ocwalk.js (tablatures OcWalk).
// =====================================================================

window.SONGS = [
  // ---------------------------------------------------- POUR DÉBUTER
  {
    id: "gamme", cat: "debut", titre: "La gamme de Do", sous: "Échauffement",
    tempo: 70, diff: 1,
    notes: "C5:2 D5:2 E5:2 F5:2 | G5:2 A5:2 B5:2 C6:4 | C6:2 B5:2 A5:2 G5:2 | F5:2 E5:2 D5:2 C5:4"
  },
  {
    id: "gamme-complete", cat: "debut", titre: "Toute la tessiture", sous: "Du Do grave au Fa aigu",
    tempo: 70, diff: 2,
    notes: "C5:2 D5:2 E5:2 F5:2 G5:2 A5:2 B5:2 | C6:2 D6:2 E6:2 F6:4 | E6:2 D6:2 C6:2 B5:2 | A5:2 G5:2 F5:2 E5:2 D5:2 C5:4"
  },
  {
    id: "clair-lune", cat: "debut", titre: "Au clair de la lune", sous: "Traditionnel",
    tempo: 90, diff: 1,
    notes: "C5 C5 C5 D5 | E5:2 D5:2 | C5 E5 D5 D5 | C5:4 | C5 C5 C5 D5 | E5:2 D5:2 | C5 E5 D5 D5 | C5:4"
  },
  {
    id: "frere-jacques", cat: "debut", titre: "Frère Jacques", sous: "Traditionnel",
    tempo: 100, diff: 1,
    notes: "G5 A5 B5 G5 | G5 A5 B5 G5 | B5 C6 D6:2 | B5 C6 D6:2 | D6:.5 E6:.5 D6:.5 C6:.5 B5 G5 | D6:.5 E6:.5 D6:.5 C6:.5 B5 G5 | G5 D5 G5:2 | G5 D5 G5:2"
  },

  // ---------------------------------------------------- CHANTS D'OCARINA (OoT) absents d'OcWalk
  {
    id: "berceuse-ocarina", cat: "zelda", titre: "Berceuse de Zelda – chant d'ocarina", sous: "Comme dans le jeu",
    tempo: 84, diff: 1, notes: "B5:2 D6 A5:3 | B5:2 D6 A5:3"
  },
  {
    // d'après une tablature 12 trous (page 1), transposée d'un demi-ton pour tenir dans Do → Fa aigu
    id: "valley-comes-alive", cat: "stardew", titre: "The Valley Comes Alive", sous: "Stardew Valley – le printemps (rythme approximatif)",
    tempo: 104, diff: 2, theme: "vallee",
    notes: "F6 D#6 D6 C6 A#5 C6 A5:2 | G5 F5 D#5 F5 G5 F5:2 | F6 D#6 D6 C6 A#5 C6 A5:2 | G5 F5 G5 A#5 C6 A#5:2 | A#5 A5 A#5 C6 A#5 A5 F5 D#5:2 | F5 G5 F5 D5 F5 C5:2 | A5 A#5 C6 A#5 A5 F5:2 | D#5 D5 D#5 F5 D5 D#5 F5:2 | A5 A#5 C6 A#5 A5 F5 D#5:2 | F5 G5 F5 D5 F5 C5:2 | G5 A5 A#5 C6 A#5 A5 F5 G5:2 | F5 D#5 D5 D#5 G5 F5:2"
  },
  {
    id: "soleil", cat: "zelda", titre: "Chant du Soleil", sous: "Version longue (avec la montée finale)",
    tempo: 110, diff: 2, notes: "E5:.5 C5:.5 A5:2 | E5:.5 C5:.5 A5:2 | G5:.25 A5:.25 B5:.25 C6:.25 D6:1 | D6:.5 D6:.5 D6:1 D6:.5 E6:.5 D6:3"
  },
  {
    // version longue d'après Part'Ocarina (tablature 11320) ; la montée finale,
    // trop aiguë pour l'ocarina 11 trous, est rejouée une octave plus bas
    id: "bolero", cat: "zelda", titre: "Boléro du Feu", sous: "Chant de téléportation – version longue",
    tempo: 120, diff: 2, src: "partocarina", notes: "F5 D5 F5 D5 R:.5 A5 F5 A5 F5:2 | F5 D5 F5 D5 R:.5 A5 F5 A5 F5:2 | G5 E5 G5 E5 R:.5 Bb5 G5 Bb5 G5:2 | A5 F5 A5 F5 R:.5 D6 A5 D6 A5 | F6 D6 F6 D6 R:.5 A5 E5 A5 E5 | G5 D5 G5 D5 F5 R:.5 A5 F5 E5 D5:3"
  },
  {
    // version longue d'après Part'Ocarina (tablature 11282)
    id: "nocturne", cat: "zelda", titre: "Nocturne de l'Ombre", sous: "Chant de téléportation – version longue",
    tempo: 96, diff: 2, src: "partocarina", notes: "B5 A5:2 A5 D5 B5 A5 F5:3 | B5 A5:2 A5 D5 B5 A5 F5:3 | G#5 F#5 R:.5 F#5 D5 G#5 F#5 | A5 G5:2 G5 D5 A5 G5 F#5:3"
  },
  {
    // version longue d'après Part'Ocarina (tablature 11493)
    id: "prelude", cat: "zelda", titre: "Prélude de la Lumière", sous: "Chant de téléportation – version longue",
    tempo: 100, diff: 1, src: "partocarina", notes: "D6 A5 D6 A5 B5 D6:2 | D6 A5 D6 A5 B5 D6:2 | D6 D6 C#6:3"
  },
  {
    // d'après Part'Ocarina (tablature 13244), transposée d'un ton
    id: "po-stillness-rain", cat: "stardew", titre: "A Stillness in the Rain", sous: "Stardew Valley – jour de pluie (rythme approximatif)",
    tempo: 100, diff: 2, theme: "orage", src: "partocarina",
    notes: "D6:2 E6 D6:2 C6:2 A5:2 F5:2 G5 | A5 G5:2 E5:3 D5:2 E5 F5 G5 A5:2 F5:2 A5:2 A#5 A5 G5:2 F5 E5 | D5:2 E5 F5 G5 A5:2 F5:2 A5:2 A#5:2 D6 A#5:2 A5:2 G5 A5 G5:2 A#5 G5:2 A5:2 F5:2 D5:2 E5:2 F5:2 E5:2 D5:3 | D6:2 E6 D6:2 C6:2 A5:2 F5:2 G5 | A5 G5:2 E5:3 D5:2 E5 F5 G5 A5:2 F5:2 A5:2 A#5 A5 G5:2 F5 E5 | D5:2 E5 F5 G5 A5:2 F5:2 A5:2 A#5:2 D6 A#5:2 A5:2 G5 A5 G5:2 A#5 G5:2 A5:2 F5:2 D5:2 E5:2 F5:2 E5:2 D5:3"
  },
  {
    // d'après Part'Ocarina (tablature 10300), transposée en Do
    id: "po-may-it-be", cat: "lotr", titre: "May It Be", sous: "Enya – La Communauté de l'Anneau (rythme approximatif)",
    tempo: 84, diff: 2, theme: "elfique", src: "partocarina",
    notes: "C5 D5 E5:3 D5 E5 G5 A5:3 A5 C6 G5:2 | E5:2 C5 D5:3 C5 D5 E5:3 D5 E5 G5 A5:3 A5 C6 G5:2 | E5:2 C5 D5:3 | E5 G5 A5:2 G5 A5 C6 G5:3 E5 G5 A5:2 | G5 E5 D5 E5 G5:3 G5 A5 C6 G5 C6 C#6 D6 | C6 B5:2 B5 C6:2 G5 F5 E5 F5 G5 A5 G5:3 | E5 G5 A5 C6:2 G5 C6:2 D6 C6 B5:2 G5 | B5 C6:2 G5 A5 G5 F5 G5:3"
  },
  {
    // d'après Part'Ocarina (tablature 9666)
    id: "po-in-dreams", cat: "lotr", titre: "In Dreams", sous: "La Communauté de l'Anneau (rythme approximatif)",
    tempo: 88, diff: 2, theme: "comte", src: "partocarina",
    notes: "D5 E5 F#5:2 A5 F#5 E5 D5:3 D5 F#5 A5 | B5:3 D6 C#6 A5 F#5:2 G5 F#5 E5:3 | D5 C5 C5 C5 D5:3 G5 A5 A#5 A5 G5 F5 G5 | A5 G5 F5 E5 D5 C5 C5 C5 D5:2 | G5 A5 A#5:2 A5 A#5 C6 A#5 C6 D6:2"
  },
];

window.CATEGORIES = [
  { id: "zelda",  nom: "Ocarina of Time",  icone: "🎵" },
  { id: "zelda2", nom: "Autres Zelda",     icone: "🗡️" },
  { id: "lotr",   nom: "Terre du Milieu",  icone: "💍" },
  { id: "stardew",nom: "Vallée",           icone: "🌱" },
  { id: "debut",  nom: "Pour débuter",     icone: "🐣" },
  { id: "perso",  nom: "Mes mélodies",     icone: "📜" },
];
