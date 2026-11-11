"""Generate the app icons: a black-figure lyre with cream strings on terracotta.

Run from the repository root:  python3 tools/make_icons.py
Requires Pillow.
"""
from PIL import Image, ImageDraw

BG = (208, 108, 66)      # terracotta
FRAME = (27, 21, 18)     # black figure
STRING = (241, 223, 189) # cream
PLUCK = (246, 239, 224)  # one plucked string


def lyre(size, inset):
    s = 4  # supersample for smooth edges
    W = size * s
    img = Image.new("RGB", (W, W), BG)
    d = ImageDraw.Draw(img)
    m = W * inset
    inner = W - 2 * m
    cx = W / 2
    top = m + inner * 0.16
    bottom = m + inner * 0.86
    half = inner * 0.30
    arm = inner * 0.07
    # two curved arms rising from the sound box, bowing outwards, ending in the crossbar
    def bezier(p0, p1, p2, steps=40):
        return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
                 (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1])
                for t in (i / steps for i in range(steps + 1))]
    for sgn in (-1, 1):
        pts = bezier((cx + sgn * half * 0.75, bottom - inner * 0.06),
                     (cx + sgn * half * 1.75, (top + bottom) / 2),
                     (cx + sgn * half * 1.0, top - inner * 0.06))
        d.line(pts, fill=FRAME, width=int(arm), joint="curve")
        for (x, y) in (pts[0], pts[-1]):
            d.ellipse((x - arm / 2, y - arm / 2, x + arm / 2, y + arm / 2), fill=FRAME)
    d.rounded_rectangle((cx - half * 1.05, top - arm * 0.5, cx + half * 1.05, top + arm * 0.5), radius=arm * 0.5, fill=FRAME)
    # sound box
    d.rounded_rectangle((cx - half * 0.95, bottom - inner * 0.12, cx + half * 0.95, bottom + inner * 0.04), radius=inner * 0.06, fill=FRAME)
    # strings
    n = 5
    for i in range(n):
        x = cx - half * 0.6 + i * (half * 1.2) / (n - 1)
        col = PLUCK if i == 3 else STRING
        d.line((x, top + arm * 0.5, x, bottom - inner * 0.12), fill=col, width=int(inner * (0.022 if i == 3 else 0.016)))
    return img.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    lyre(192, 0.08).save("icons/icon-192.png")
    lyre(512, 0.08).save("icons/icon-512.png")
    lyre(512, 0.2).save("icons/icon-maskable-512.png")
    lyre(180, 0.08).save("icons/apple-touch-icon.png")
    print("icons written")
