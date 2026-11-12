// The built-in melodies (public domain), as plain data so tests can check them without a page.
// Each melody: a group (GROUPS below), notes as "Name+octave:beats" (A3:.5 = Lá 3 for half a beat; # for sharps), the scale
// whose 15 strings it is played on (from Ré 3 to Ré 5), and seconds per beat.
// tests/songbook.test.js checks that every note exists on those strings.

export const SONGBOOK = [
  {
    group: 'infantis', name: 'Brilha, Brilha, Estrelinha', from: 'Melodia tradicional francesa', mode: 'jonio', beat: 0.55,
    mel: `D4 D4 A4 A4 B4 B4 A4:2 G4 G4 F#4 F#4 E4 E4 D4:2
          A4 A4 G4 G4 F#4 F#4 E4:2 A4 A4 G4 G4 F#4 F#4 E4:2
          D4 D4 A4 A4 B4 B4 A4:2 G4 G4 F#4 F#4 E4 E4 D4:2`,
  },
  {
    group: 'classicas', name: 'Ode à Alegria', from: 'Beethoven, 9ª Sinfonia', mode: 'jonio', beat: 0.55,
    mel: `F#4 F#4 G4 A4 A4 G4 F#4 E4 D4 D4 E4 F#4 F#4:1.5 E4:.5 E4:2
          F#4 F#4 G4 A4 A4 G4 F#4 E4 D4 D4 E4 F#4 E4:1.5 D4:.5 D4:2`,
  },
  {
    group: 'infantis', name: 'Frère Jacques', from: 'Cânone tradicional francês', mode: 'jonio', beat: 0.55,
    mel: `D4 E4 F#4 D4 D4 E4 F#4 D4 F#4 G4 A4:2 F#4 G4 A4:2
          A4:.5 B4:.5 A4:.5 G4:.5 F#4 D4 A4:.5 B4:.5 A4:.5 G4:.5 F#4 D4
          D4 A3 D4:2 D4 A3 D4:2`,
  },
  {
    group: 'infantis', name: 'Mary Had a Little Lamb', from: 'Canção infantil tradicional', mode: 'jonio', beat: 0.55,
    mel: `F#4 E4 D4 E4 F#4 F#4 F#4:2 E4 E4 E4:2 F#4 A4 A4:2
          F#4 E4 D4 E4 F#4 F#4 F#4 F#4 E4 E4 F#4 E4 D4:4`,
  },
  {
    // The consensus transcription (6/8, D major), an octave lower to fit the strings.
    group: 'antigas', name: 'Epitáfio de Seikilos', from: 'Grécia antiga, séc. I · a canção completa mais antiga que se conhece', mode: 'jonio', beat: 0.75,
    mel: `A3:.5 E4 E4:1.5 C#4:.5 D4:.5 E4:.5 D4:1.5
          C#4 D4:.5 E4:.5 D4:.5 C#4:.5 B3:.5 A3 B3:.5 G3
          A3:.5 C#4:.5 E4:.5 D4:.5 C#4:.5 D4:.5 C#4:.5 A3 B3:.5 G3
          A3:.5 C#4:.5 B3:.5 D4:.5 E4:.5 C#4:.5 A3:.5 A3 A3:.5 F#3:.5 E3:2`,
  },
  {
    // The familiar tune, in its own Dorian mode (the scale of the game's "Ruína" sound).
    group: 'antigas', name: 'Scarborough Fair', from: 'Balada tradicional inglesa', mode: 'dorico', beat: 0.5,
    mel: `D4:2 D4 A4:2 A4 E4:1.5 F4:.5 E4 D4:4
          A4 C5 D5:2 C5 A4 B4 G4 A4:5
          D5 D5:2 D5 C5:2 A4 A4 G4 F4 E4 C4:3
          D4:2 A4 G4:2 F4 E4 D4 C4 D4:3`,
  },
  {
    // Played in Dorian, as in many old versions (the leading note before the last Ré is not raised).
    group: 'antigas', name: 'Greensleeves', from: 'Canção tradicional inglesa, séc. XVI', mode: 'dorico', beat: 0.45,
    mel: `D4 F4:2 G4 A4:1.5 B4:.5 A4 G4:2 E4 C4:1.5 D4:.5 E4 F4:2 D4 D4:1.5 C4:.5 D4 E4:2 C4 A3:2
          D4 F4:2 G4 A4:1.5 B4:.5 A4 G4:2 E4 C4:1.5 D4:.5 E4 F4:1.5 E4:.5 D4 C4:1.5 B3:.5 C4 D4:4
          C5:3 C5:1.5 B4:.5 A4 G4:2 E4 C4:1.5 D4:.5 E4 F4:2 D4 D4:1.5 C4:.5 D4 E4:2 C4 A3:3
          C5:3 C5:1.5 B4:.5 A4 G4:2 E4 C4:1.5 D4:.5 E4 F4:1.5 E4:.5 D4 C4:1.5 B3:.5 C4 D4:3`,
  },
  {
    group: 'infantis', name: 'Ciranda, Cirandinha', from: 'Cantiga de roda brasileira', mode: 'jonio', beat: 0.6,
    mel: `A3:.5 D4:.5 D4:.5 F#4:.5 F#4:.5 A4:.5 A4:.5 G4:.5 F#4:.5 E4:.5 G4:.5 F#4:.5 E4:.5
          D4 F#4:.5 A4:.5 G4:.5 F#4:.5 E4:.5 D4:.5 C#4:.5 A3:.5 G4:.5 E4:.5 F#4:.5 D4:.5 E4:.5 C#4:.5 D4:2`,
  },
  {
    group: 'infantis', name: 'Atirei o Pau no Gato', from: 'Cantiga de roda brasileira', mode: 'jonio', beat: 0.5,
    mel: `A4:1.5 G4:.5 F#4:.5 E4:.5 F#4:.5 G4:.5 A4 A4 A4 B4:.5 A4:.5 G4 G4 G4 A4:.5 G4:.5
          F#4 F#4 F#4 D4:.5 D4:.5 B4 B4 B4 C#5:.5 B4:.5 A4 A4 A4 G4:.5 F#4:.5
          A4 G4:.5 F#4:.5 A4:.5 G4:.5 F#4:.5 E4:.5 D4:2 D5:2`,
  },
  {
    group: 'infantis', name: 'Escravos de Jó', from: 'Cantiga de roda brasileira', mode: 'jonio', beat: 0.55,
    mel: `A3:.5 D4 C#4:.5 B3:.5 A3:1.5 A3:.5 G3:.5 F#3:.5 G3:.5 B3:.5 A3:2
          A3 F#3 A3 F#3 A3:.5 F#3:.5 A3:.5 D4:.5 F#4 F#4:.5 E4:.5 D4:1.5
          A3:.5 B3:.5 A3:.5 A3:.5 A3:.5 B3:.5 A3:.5 A3:.5 A3:.5 B3:.5 A3:.5 B3:.5 C#4:.5 D4:1.5
          A3:.5 B3:.5 A3:.5 A3:.5 A3:.5 B3:.5 A3:.5 A3:.5 A3:.5 B3:.5 A3:.5 B3:.5 C#4:.5 D4:2`,
  },
  {
    group: 'infantis', name: 'O Cravo Brigou com a Rosa', from: 'Cantiga de roda brasileira', mode: 'jonio', beat: 0.55,
    mel: `F#4:.5 A4 F#4:.5 D5:.5 C#5:.5 B4:.5 A4 G4 E4
          G4 E4:.5 B4:.5 A4:.5 G4:.5 A4 A4:1.5 F#4:.5
          F#4 D4:.5 E4:.5 F#4:.5 G4:.5 F#4 E4 E4 E4 C#4:.5 D4:.5 E4:.5 F#4:.5 D4 D4:2`,
  },
  {
    group: 'infantis', name: 'Cai, Cai, Balão', from: 'Cantiga junina brasileira', mode: 'jonio', beat: 0.6,
    mel: `A4:.5 A4:.75 G4:.25 F#4:.5 A4:.5 A4:.75 G4:.25 F#4:.5 A4:.5 B4:.5 A4:.5 G4:.5 F#4:.5 E4:1.5
          E4:.25 F#4:.25 G4:.5 E4:.25 F#4:.25 G4:.5 E4:.25 F#4:.25 G4 A4:.5 B4:.5 A4:.5 G4:.5 F#4:.5 E4:.5 D4:2`,
  },
  {
    group: 'infantis', name: 'Pirulito que Bate Bate', from: 'Cantiga de roda brasileira', mode: 'jonio', beat: 0.6,
    mel: `F#4:.25 G4:.25 A4:.5 A4:.25 A4:.25 G4:.5 F#4:.5 B4:.5 B4:1 E4:.25 F#4:.25
          G4:.5 G4:.25 G4:.25 F#4:.5 E4:.5 A4:1.5 F#4:.25 G4:.25 A4:.5 A4:.5 G4:.5 F#4:.5
          B4:.5 D5:.5 C#5:.5 B4:.5 A4:.5 G4:.5 F#4:.5 E4:.5 D4:2`,
  },
  {
    group: 'infantis', name: 'Sapo Cururu', from: 'Cantiga de ninar brasileira', mode: 'jonio', beat: 0.65,
    mel: `A3:.75 B3:.25 A3:.5 F#3:.5 D4:2 A3:.5 B3:.5 A3:.5 F#3:.5 D4:2
          F#4:.5 F#4:.5 E4:.5 F#4:.5 G4:.25 E4:.25 C#4:.5 A3:.5 A3:.5 B3:.5 B3:.5 A3:.5 G3:.5 F#3:2`,
  },
  {
    // Cantiga 10 (13th century), transcription by Ali Corbin from the codices; two passing B flats
    // are played as B natural, the Dorian mode's own note.
    group: 'antigas', name: 'Rosa das Rosas', from: 'Cantigas de Santa Maria, séc. XIII', mode: 'dorico', beat: 0.45,
    mel: `D4:1.5 C4:.5 D4 E4:.25 F4:.25 G4 F4:.25 E4:.25 D4 D4:1.5 C4:.5 D4 F4 F4:2 F4:1.5 G4:.5
          A4 A4 G4:.5 F4:.25 E4:.25 D4 C4:1.5 D4:.5 E4 D4 D4:1.5 E4:.5 C5:1.5 C5:.5 D5 C5
          B4:.5 A4:.5 G4:.5 A4:.5 F4:1.5 G4:.5 A4:.5 B4:.5 A4:3 C5:1.5 C5:.5 D5 C5 B4:.5 A4:.5 G4:.5
          A4:.5 F4:1.5 G4:.5 A4:.5 B4:.5 A4:3 F4:1.5 F4:.5 F4 G4:1.5 G4:.5 A4 G4:.25 F4 E4:.25 D4:.5
          D4:.5 E4:.5 C4:3 F4:1.5 G4:.5 A4 A4 G4:.5 F4:.25 E4:.25 D4 C4:1.5 D4:.5 E4 D4 D4:3`,
  },
  {
    group: 'classicas', name: 'Minueto em Sol', from: 'Christian Petzold (por muito tempo atribuído a Bach)', mode: 'jonio', beat: 0.5,
    mel: `A4 D4:.5 E4:.5 F#4:.5 G4:.5 A4 D4 D4 B4 G4:.5 A4:.5 B4:.5 C#5:.5 D5 D4 D4
          G4 A4:.5 G4:.5 F#4:.5 E4:.5 F#4 G4:.5 F#4:.5 E4:.5 D4:.5 C#4 D4:.5 E4:.5 F#4:.5 D4:.5 E4:3
          A4 D4:.5 E4:.5 F#4:.5 G4:.5 A4 D4 D4 B4 G4:.5 A4:.5 B4:.5 C#5:.5 D5 D4 D4
          G4 A4:.5 G4:.5 F#4:.5 E4:.5 F#4 G4:.5 F#4:.5 E4:.5 D4:.5 E4 F#4:.5 E4:.5 D4:.5 C#4:.5 D4:3`,
  },
  {
    // The violin line's first entries: the descending theme an octave down, then the eighth-note variation.
    group: 'classicas', name: 'Cânone em Ré', from: 'Johann Pachelbel · tema', mode: 'jonio', beat: 0.6,
    mel: `F#4 E4 D4 C#4 B3 A3 B3 C#4 D4 C#4 B3 A3 G3 F#3 G3 E3
          D4:.5 F#4:.5 A4:.5 G4:.5 F#4:.5 D4:.5 F#4:.5 E4:.5 D4:.5 B3:.5 D4:.5 A4:.5 G4:.5 B4:.5 A4:.5 G4:.5 F#4:2`,
  },
  {
    // The opening melody, an octave down; the long notes are shortened a little.
    group: 'classicas', name: 'Gymnopédie nº 1', from: 'Erik Satie · tema', mode: 'jonio', beat: 0.8,
    mel: `F#4 A4 G4 F#4 C#4 B3 C#4 D4 A3:3 F#3:6
          F#4 A4 G4 F#4 C#4 B3 C#4 D4 A3:3 C#4:3 F#4:3 E3:6`,
  },
  {
    group: 'classicas', name: 'Canção de Ninar', from: 'Johannes Brahms (Wiegenlied)', mode: 'jonio', beat: 0.55,
    mel: `F#4:.5 F#4:.5 A4:1.5 F#4:.5 F#4 A4:2 F#4:.5 A4:.5 D5 C#5:1.5 B4:.5 B4 A4 E4:.5 F#4:.5 G4
          E4 E4:.5 F#4:.5 G4:2 E4:.5 G4:.5 C#5:.5 B4:.5 A4 C#5 D5:2 D4:.5 D4:.5 D5:2 B4:.5 G4:.5
          A4:2 F#4:.5 D4:.5 G4 A4 B4 A4:2 D4:.5 D4:.5 D5:2 B4:.5 G4:.5 A4:2 F#4:.5 D4:.5 G4
          F#4 E4 D4:2.5`,
  },
  {
    // The chorus "Não há, ó gente, ó não", read from the voice part of the Musica Brasilis edition.
    group: 'populares', name: 'Luar do Sertão', from: 'Catulo da Paixão Cearense e João Pernambuco · refrão', mode: 'jonio', beat: 1.0,
    mel: `A3:.5 D4:.875 E4:.125 F#4:.875 E4:.125 G4:.875 F#4:.125 E4:.875 D4:.125 C#4:.875 D4:.125 C#4:.875 G3:.125 F#3:2.5
          A3:.5 D4:.875 E4:.125 F#4:.875 E4:.125 G4:.875 F#4:.125 E4:.875 D4:.125 C#4:.875 D4:.125 C#4:.875 G3:.125 F#3:3`,
  },
  {
    // Played in Mixolídio: from Ré, its strings are the notes of Sol maior, where the tune sits.
    group: 'populares', name: 'Danny Boy', from: 'Londonderry Air, melodia tradicional irlandesa', mode: 'mixo', beat: 0.55,
    mel: `F#3:.5 G3:.5 A3:.5 B3:1.5 A3:.5 B3:.5 E4:.5 D4:.5 B3:.5 A3:.5 G3:.5 E3:1.5 G3:.5 B3:.5 C4:.5 D4:1.5
          E4:.5 D4:.5 B3:.5 G3:.5 B3:.5 A3:2.5 F#3:.5 G3:.5 A3:.5 B3:1.5 A3:.5 B3:.5 E4:.5 D4:.5 B3:.5 A3:.5
          G3:.5 E3:1.5 F#3:.5 G3:.5 A3:.5 B3:1.5 C4:.5 B3:.5 A3:.5 G3:.5 A3:.5 G3:2.5 D4:.5 E4:.5 F#4:.5 G4:1.5
          F#4:.5 F#4:.5 E4:.5 D4:.5 E4:.5 D4:.5 B3:.5 G3:1.5 D4:.5 E4:.5 F#4:.5 G4:1.5 F#4:.5 F#4:.5 E4:.5 D4:.5
          B3:.5 A3:2.5 D4:.5 D4:.5 D4:.5 B4:1.5 A4:.5 A4:.5 G4:.5 E4:.5 G4:.5 D4:.5 B3:.5 G3:1.5 F#3:.5 G3:.5
          A3:.5 B3:.5 E4:.5 D4:.5 B3:.5 A3:.5 G3:.5 E3:.5 F#3:.5 G3:3`,
  },
  {
    group: 'populares', name: 'Amazing Grace', from: 'Hino tradicional americano (New Britain, 1831)', mode: 'jonio', beat: 0.5,
    mel: `D4 G4:2 B4:.5 G4:.5 B4:2 A4 G4:2 E4 D4:2 D4 G4:2 B4:.5 G4:.5 B4:2 A4 D5:5
          B4 D5:2 B4:.5 G4:.5 B4:2 A4 G4:2 E4 D4:2 D4 G4:2 B4:.5 G4:.5 B4:2 A4 G4:5`,
  },
  {
    group: 'populares', name: 'Sakura', from: 'Canção tradicional japonesa', mode: 'jonio', beat: 0.6,
    mel: `B4 B4 C#5:2 B4 B4 C#5:2 B4 C#5 D5 C#5 B4 C#5:.5 B4:.5 G4:2
          F#4 D4 F#4 G4 F#4 F#4:.5 D4:.5 C#4:2 B4 C#5 D5 C#5 B4 C#5:.5 B4:.5 G4:2
          F#4 D4 F#4 G4 F#4 F#4:.5 D4:.5 C#4:2 B4 B4 C#5:2 B4 B4 C#5:2 F#4 G4 C#5:.5 B4:.5 G4 F#4:3`,
  },
];

// Groups in the order they are shown.
export const GROUPS = [
  { key: 'antigas', name: 'Antigas e medievais' },
  { key: 'classicas', name: 'Clássicas' },
  { key: 'populares', name: 'Populares' },
  { key: 'infantis', name: 'Infantis e cantigas de roda' },
];

const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// "F#4:.5" → [midi, beats]; a bare name is one beat.
export function parseMelody(text) {
  return text.trim().split(/\s+/).map(tok => {
    const m = /^([A-G])(#|b)?(\d)(?::([\d.]+))?$/.exec(tok);
    if (!m) throw new Error('bad note: ' + tok);
    const midi = 12 * (+m[3] + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return [midi, m[4] ? +m[4] : 1];
  });
}
