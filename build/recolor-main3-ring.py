#!/usr/bin/env python3
"""Recolor only warm-gold ring pixels in existing main-3 web icons.
Never redraw or generate the Hermes artwork. Original non-gold pixels are byte-identical.
"""
from pathlib import Path
from PIL import Image
import colorsys

FILES = ("icon-180.png", "icon-192.png", "icon-512.png")
for name in FILES:
    source = Path(name)
    image = Image.open(source).convert("RGBA")
    w, h = image.size
    output = image.copy()
    pixels = image.load()
    target = output.load()
    changed = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            hue, sat, val = colorsys.rgb_to_hsv(r/255, g/255, b/255)
            # Select only the gold/yellow circle; blue-black Hermes head is excluded.
            gold = (0.075 <= hue <= 0.175 and sat >= 0.24 and r >= 90
                    and r > g * 1.05 and g > b * 1.22)
            if not gold:
                continue
            # Keep the original luminance, alpha, anti-aliasing and silhouette.
            nr, ng, nb = colorsys.hsv_to_rgb(0.0, min(1.0, max(sat, 0.75)), val)
            target[x, y] = (round(nr*255),round(ng*255),round(nb*255),a)
            changed += 1
    fraction=changed/(w*h)
    if not 0.002 < fraction < 0.35:
        raise RuntimeError(f"{name}: suspicious tint region {fraction:.4%}; refusing to overwrite")
    # Pixel-perfect guarantee that only gold-toned original pixels were touched.
    for y in range(h):
        for x in range(w):
            if target[x,y] != pixels[x,y]:
                r,g,b,a=pixels[x,y]; hue,sat,val=colorsys.rgb_to_hsv(r/255,g/255,b/255)
                assert a == target[x,y][3]
                assert 0.075 <= hue <= 0.175 and sat >= 0.24 and r >= 90 and r > g*1.05 and g > b*1.22
    output.save(source, optimize=True)
    print(f"PASS: {name}: only {changed} original warm-gold pixels recolored red; all other pixels unchanged")

# main-3-only deployment marker: native iOS and production icons are never modified.
