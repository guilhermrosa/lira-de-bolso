# Converts a single-voice ABC tune into a songbook.js melody ("F#4:.5 ..."), choosing the scale and
# transposition that fit the 15 strings from Ré 3 (or forcing them), and listing notes that do not fit.
# Used for the v0.6 songs; check the result by ear and with npm test.
# ABC (single voice) -> lyre melody string "F#4:.5 ..." in beats (quarter = 1), transposed to fit
# the 15 strings from D3 of a mode. Usage: python3 abc2lyre.py file.abc [mode|auto] [shift|auto] [maxbars]
import re, sys
STEPS = {'jonio': [0,2,4,5,7,9,11], 'dorico': [0,2,3,5,7,9,10], 'mixo': [0,2,4,5,7,9,10], 'frigio': [0,1,3,5,7,8,10]}
NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
PC = {'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}
ORDER_SHARP = 'FCGDAEB'; ORDER_FLAT = 'BEADGCF'
KEYS = {'C':0,'G':1,'D':2,'A':3,'E':4,'B':5,'F#':6,'F':-1,'Bb':-2,'Eb':-3,'Ab':-4,'Db':-5}
MODE_OFF = {'':0,'maj':0,'ion':0,'m':-3,'min':-3,'aeo':-3,'dor':-2,'mix':-1,'phr':-4,'lyd':1,'loc':-5}

def keysig(k):
    m = re.match(r'([A-G][b#]?)\s*([A-Za-z]*)', k.strip())
    tonic, mode = m.group(1), m.group(2).lower()[:3]
    n = KEYS.get(tonic, 0) + MODE_OFF.get(mode, 0)
    # relative major count from tonic+mode: recompute via circle
    sig = {}
    if n > 0:
        for c in ORDER_SHARP[:n]: sig[c] = 1
    elif n < 0:
        for c in ORDER_FLAT[:-n]: sig[c] = -1
    return sig

def parse(text, maxbars=None):
    L = 1/8; sig = {}; body = []
    for line in text.splitlines():
        if re.match(r'^[A-Za-z]:', line):
            if line.startswith('L:'): a,b = line[2:].strip().split('/'); L = int(a)/int(b)
            if line.startswith('K:'): sig = keysig(line[2:])
            continue
        if line.startswith('%') or line.startswith('w:'): continue
        body.append(line)
    s = ' '.join(body)
    s = re.sub(r'\[[A-Za-z]:[^\]]*\]', '', s)  # inline fields like [I:...]
    s = re.sub(r'"[^"]*"', '', s)          # chords / annotations
    s = re.sub(r'![^!]*!', '', s)          # decorations
    s = re.sub(r'\{[^}]*\}', '', s)        # grace notes
    s = s.replace('(', ' ').replace(')', ' ')  # slurs (triplets ignored: rare here)
    notes = []; bar_acc = {}; bars = 0
    tok = re.compile(r"(\|\]|\|\||\|:|:\||\||\[\d|\d)|([\^_=]*)([A-Ga-gz])([,']*)(\d*)(/*)(\d*)(-?)|([<>])")
    pend_tie = False; broken = None
    for m in tok.finditer(s):
        if m.group(1):
            if m.group(1).startswith('|') or m.group(1).startswith(':'):
                bar_acc = {}; bars += 1
                if maxbars and bars >= maxbars: break
            continue
        if m.group(9):
            broken = m.group(9); continue
        acc, letter, octs, num, slashes, den, tie = m.group(2,3,4,5,6,7,8)
        d = int(num) if num else 1
        if slashes: d = d / (int(den) if den else 2 ** len(slashes))
        beats = d * L * 4
        if broken and notes:  # previous note > this note
            prev = notes[-1]
            f = 1.5 if broken == '>' else 0.5
            tot = prev[1] + beats
            prev[1] = prev[1] * f; beats = tot - prev[1]
            broken = None
        if letter == 'z':
            if notes: notes[-1][1] += beats
            continue
        up = letter.upper(); octave = 4 if letter.isupper() else 5
        octave += octs.count("'") - octs.count(',')
        if acc:
            a = {'^':1,'_':-1,'=':0,'^^':2,'__':-2}.get(acc, 0); bar_acc[(up, octave)] = a
        a = bar_acc.get((up, octave), sig.get(up, 0))
        midi = 12 * (octave + 1) + PC[up] + a
        if pend_tie and notes and notes[-1][0] == midi: notes[-1][1] += beats
        else: notes.append([midi, beats])
        pend_tie = bool(tie)
    return notes

def strings(mode):
    st = STEPS[mode]; return [50 + o*12 + x for o in range(2) for x in st] + [74]

def fit(notes, mode='auto', shift='auto'):
    best = None
    modes = STEPS if mode == 'auto' else [mode]
    shifts = range(-30, 31) if shift == 'auto' else [int(shift)]
    for md in modes:
        S = set(strings(md))
        for sh in shifts:
            miss = sum(1 for n, _ in notes if n + sh not in S)
            score = (miss, md != 'jonio', md != 'dorico', abs(sh))
            if best is None or score < best[0]: best = (score, md, sh)
    return best

def fmt(notes, sh):
    out = []
    for n, b in notes:
        m = n + sh; name = NAMES[m % 12] + str(m // 12 - 1)
        b = round(b, 3); out.append(name if b == 1 else f"{name}:{('%g' % b).lstrip('0') if b < 1 else '%g' % b}")
    return ' '.join(out)

if __name__ == '__main__':
    text = open(sys.argv[1]).read()
    mode = sys.argv[2] if len(sys.argv) > 2 else 'auto'
    shift = sys.argv[3] if len(sys.argv) > 3 else 'auto'
    maxbars = int(sys.argv[4]) if len(sys.argv) > 4 else None
    notes = parse(text, maxbars)
    (miss, *_), md, sh = fit(notes, mode, shift)
    S = set(strings(md))
    bad = [NAMES[(n+sh) % 12] + str((n+sh)//12-1) for n, _ in notes if n + sh not in S]
    print(f'# {len(notes)} notes, {sum(b for _, b in notes):g} beats, mode {md}, shift {sh}, missing {miss} {bad}')
    print(fmt(notes, sh))
