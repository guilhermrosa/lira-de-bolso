// The built-in melodies (public domain), as plain data so tests can check them without a page.
// Each melody: notes as "Name+octave:beats" (A3:.5 = Lá 3 for half a beat; # for sharps), the scale
// whose 15 strings it is played on (from Ré 3 to Ré 5), and seconds per beat.
// tests/songbook.test.js checks that every note exists on those strings.

export const SONGBOOK = [
  {
    name: 'Brilha, Brilha, Estrelinha', from: 'Melodia tradicional francesa', mode: 'jonio', beat: 0.55,
    mel: `D4 D4 A4 A4 B4 B4 A4:2 G4 G4 F#4 F#4 E4 E4 D4:2
          A4 A4 G4 G4 F#4 F#4 E4:2 A4 A4 G4 G4 F#4 F#4 E4:2
          D4 D4 A4 A4 B4 B4 A4:2 G4 G4 F#4 F#4 E4 E4 D4:2`,
  },
  {
    name: 'Ode à Alegria', from: 'Beethoven, 9ª Sinfonia', mode: 'jonio', beat: 0.55,
    mel: `F#4 F#4 G4 A4 A4 G4 F#4 E4 D4 D4 E4 F#4 F#4:1.5 E4:.5 E4:2
          F#4 F#4 G4 A4 A4 G4 F#4 E4 D4 D4 E4 F#4 E4:1.5 D4:.5 D4:2`,
  },
  {
    name: 'Frère Jacques', from: 'Cânone tradicional francês', mode: 'jonio', beat: 0.55,
    mel: `D4 E4 F#4 D4 D4 E4 F#4 D4 F#4 G4 A4:2 F#4 G4 A4:2
          A4:.5 B4:.5 A4:.5 G4:.5 F#4 D4 A4:.5 B4:.5 A4:.5 G4:.5 F#4 D4
          D4 A3 D4:2 D4 A3 D4:2`,
  },
  {
    name: 'Mary Had a Little Lamb', from: 'Canção infantil tradicional', mode: 'jonio', beat: 0.55,
    mel: `F#4 E4 D4 E4 F#4 F#4 F#4:2 E4 E4 E4:2 F#4 A4 A4:2
          F#4 E4 D4 E4 F#4 F#4 F#4 F#4 E4 E4 F#4 E4 D4:4`,
  },
  {
    // The consensus transcription (6/8, D major), an octave lower to fit the strings.
    name: 'Epitáfio de Seikilos', from: 'Grécia antiga, séc. I · a canção completa mais antiga que se conhece', mode: 'jonio', beat: 0.75,
    mel: `A3:.5 E4 E4:1.5 C#4:.5 D4:.5 E4:.5 D4:1.5
          C#4 D4:.5 E4:.5 D4:.5 C#4:.5 B3:.5 A3 B3:.5 G3
          A3:.5 C#4:.5 E4:.5 D4:.5 C#4:.5 D4:.5 C#4:.5 A3 B3:.5 G3
          A3:.5 C#4:.5 B3:.5 D4:.5 E4:.5 C#4:.5 A3:.5 A3 A3:.5 F#3:.5 E3:2`,
  },
  {
    // The familiar tune, in its own Dorian mode (the scale of the game's "Ruína" sound).
    name: 'Scarborough Fair', from: 'Balada tradicional inglesa', mode: 'dorico', beat: 0.5,
    mel: `D4:2 D4 A4:2 A4 E4:1.5 F4:.5 E4 D4:4
          A4 C5 D5:2 C5 A4 B4 G4 A4:5
          D5 D5:2 D5 C5:2 A4 A4 G4 F4 E4 C4:3
          D4:2 A4 G4:2 F4 E4 D4 C4 D4:3`,
  },
  {
    // Played in Dorian, as in many old versions (the leading note before the last Ré is not raised).
    name: 'Greensleeves', from: 'Canção tradicional inglesa, séc. XVI', mode: 'dorico', beat: 0.45,
    mel: `D4 F4:2 G4 A4:1.5 B4:.5 A4 G4:2 E4 C4:1.5 D4:.5 E4 F4:2 D4 D4:1.5 C4:.5 D4 E4:2 C4 A3:2
          D4 F4:2 G4 A4:1.5 B4:.5 A4 G4:2 E4 C4:1.5 D4:.5 E4 F4:1.5 E4:.5 D4 C4:1.5 B3:.5 C4 D4:4
          C5:3 C5:1.5 B4:.5 A4 G4:2 E4 C4:1.5 D4:.5 E4 F4:2 D4 D4:1.5 C4:.5 D4 E4:2 C4 A3:3
          C5:3 C5:1.5 B4:.5 A4 G4:2 E4 C4:1.5 D4:.5 E4 F4:1.5 E4:.5 D4 C4:1.5 B3:.5 C4 D4:3`,
  },
  {
    name: 'Ciranda, Cirandinha', from: 'Cantiga de roda brasileira', mode: 'jonio', beat: 0.6,
    mel: `A3:.5 D4:.5 D4:.5 F#4:.5 F#4:.5 A4:.5 A4:.5 G4:.5 F#4:.5 E4:.5 G4:.5 F#4:.5 E4:.5
          D4 F#4:.5 A4:.5 G4:.5 F#4:.5 E4:.5 D4:.5 C#4:.5 A3:.5 G4:.5 E4:.5 F#4:.5 D4:.5 E4:.5 C#4:.5 D4:2`,
  },
  {
    name: 'Atirei o Pau no Gato', from: 'Cantiga de roda brasileira', mode: 'jonio', beat: 0.5,
    mel: `A4:1.5 G4:.5 F#4:.5 E4:.5 F#4:.5 G4:.5 A4 A4 A4 B4:.5 A4:.5 G4 G4 G4 A4:.5 G4:.5
          F#4 F#4 F#4 D4:.5 D4:.5 B4 B4 B4 C#5:.5 B4:.5 A4 A4 A4 G4:.5 F#4:.5
          A4 G4:.5 F#4:.5 A4:.5 G4:.5 F#4:.5 E4:.5 D4:2 D5:2`,
  },
  {
    name: 'Escravos de Jó', from: 'Cantiga de roda brasileira', mode: 'jonio', beat: 0.55,
    mel: `A3:.5 D4 C#4:.5 B3:.5 A3:1.5 A3:.5 G3:.5 F#3:.5 G3:.5 B3:.5 A3:2
          A3 F#3 A3 F#3 A3:.5 F#3:.5 A3:.5 D4:.5 F#4 F#4:.5 E4:.5 D4:1.5
          A3:.5 B3:.5 A3:.5 A3:.5 A3:.5 B3:.5 A3:.5 A3:.5 A3:.5 B3:.5 A3:.5 B3:.5 C#4:.5 D4:1.5
          A3:.5 B3:.5 A3:.5 A3:.5 A3:.5 B3:.5 A3:.5 A3:.5 A3:.5 B3:.5 A3:.5 B3:.5 C#4:.5 D4:2`,
  },
  {
    name: 'O Cravo Brigou com a Rosa', from: 'Cantiga de roda brasileira', mode: 'jonio', beat: 0.55,
    mel: `F#4:.5 A4 F#4:.5 D5:.5 C#5:.5 B4:.5 A4 G4 E4
          G4 E4:.5 B4:.5 A4:.5 G4:.5 A4 A4:1.5 F#4:.5
          F#4 D4:.5 E4:.5 F#4:.5 G4:.5 F#4 E4 E4 E4 C#4:.5 D4:.5 E4:.5 F#4:.5 D4 D4:2`,
  },
  {
    name: 'Cai, Cai, Balão', from: 'Cantiga junina brasileira', mode: 'jonio', beat: 0.6,
    mel: `A4:.5 A4:.75 G4:.25 F#4:.5 A4:.5 A4:.75 G4:.25 F#4:.5 A4:.5 B4:.5 A4:.5 G4:.5 F#4:.5 E4:1.5
          E4:.25 F#4:.25 G4:.5 E4:.25 F#4:.25 G4:.5 E4:.25 F#4:.25 G4 A4:.5 B4:.5 A4:.5 G4:.5 F#4:.5 E4:.5 D4:2`,
  },
  {
    name: 'Pirulito que Bate Bate', from: 'Cantiga de roda brasileira', mode: 'jonio', beat: 0.6,
    mel: `F#4:.25 G4:.25 A4:.5 A4:.25 A4:.25 G4:.5 F#4:.5 B4:.5 B4:1 E4:.25 F#4:.25
          G4:.5 G4:.25 G4:.25 F#4:.5 E4:.5 A4:1.5 F#4:.25 G4:.25 A4:.5 A4:.5 G4:.5 F#4:.5
          B4:.5 D5:.5 C#5:.5 B4:.5 A4:.5 G4:.5 F#4:.5 E4:.5 D4:2`,
  },
  {
    name: 'Sapo Jururu', from: 'Cantiga de ninar brasileira', mode: 'jonio', beat: 0.65,
    mel: `A3:.75 B3:.25 A3:.5 F#3:.5 D4:2 A3:.5 B3:.5 A3:.5 F#3:.5 D4:2
          F#4:.5 F#4:.5 E4:.5 F#4:.5 G4:.25 E4:.25 C#4:.5 A3:.5 A3:.5 B3:.5 B3:.5 A3:.5 G3:.5 F#3:2`,
  },
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
