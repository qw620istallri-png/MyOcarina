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
    id: "soleil", cat: "zelda", titre: "Chant du Soleil", sous: "Chant d'ocarina",
    tempo: 110, diff: 1, notes: "A5:.5 F5:.5 D6:2 | A5:.5 F5:.5 D6:2"
  },
  {
    id: "bolero", cat: "zelda", titre: "Boléro du Feu", sous: "Chant de téléportation",
    tempo: 110, diff: 1, notes: "F5:.5 D5:.5 F5:.5 D5:.5 | A5:.5 F5:.5 A5:.5 F5:2"
  },
  {
    id: "nocturne", cat: "zelda", titre: "Nocturne de l'Ombre", sous: "Chant de téléportation",
    tempo: 90, diff: 1, notes: "B5 A5 A5:2 D5 | B5 A5 F5:3"
  },
  {
    id: "prelude", cat: "zelda", titre: "Prélude de la Lumière", sous: "Chant de téléportation",
    tempo: 100, diff: 1, notes: "D6 A5:2 D6 A5 | B5 D6:3"
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
