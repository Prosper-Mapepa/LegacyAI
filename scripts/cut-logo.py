import sys
import zlib
import struct

w, h = 1668, 943
rgb = sys.stdin.buffer.read()
if len(rgb) != w * h * 3:
    raise SystemExit(f"unexpected size {len(rgb)}")

def alpha(r: int, g: int, b: int) -> int:
    if r > 170 and g > 170 and b > 170:
        return 255
    if r > 80 and abs(r - g) < 45 and r + 20 >= b:
        return min(255, max(0, (min(r, g) - 28) * 3))
    if r > 90 and r > g and r > b + 15:
        return min(255, max(0, (r - 36) * 2))
    if b > 145 and b > r + 50 and g > 35:
        return 255
    return 0

rgba = bytearray(w * h * 4)
minx, miny, maxx, maxy = w, h, 0, 0
for y in range(h):
    row = y * w
    for x in range(w):
        i = (row + x) * 3
        r, g, b = rgb[i], rgb[i + 1], rgb[i + 2]
        a = alpha(r, g, b)
        o = (row + x) * 4
        rgba[o : o + 4] = bytes((r, g, b, a))
        if a > 20:
            if x < minx:
                minx = x
            if y < miny:
                miny = y
            if x > maxx:
                maxx = x
            if y > maxy:
                maxy = y

pad = 16
minx = max(0, minx - pad)
miny = max(0, miny - pad)
maxx = min(w - 1, maxx + pad)
maxy = min(h - 1, maxy + pad)
cw, ch = maxx - minx + 1, maxy - miny + 1
crop = bytearray(cw * ch * 4)
for y in range(ch):
    src = ((miny + y) * w + minx) * 4
    dst = y * cw * 4
    crop[dst : dst + cw * 4] = rgba[src : src + cw * 4]


def chunk(tag: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + tag
        + data
        + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    )


raw = b"".join(b"\x00" + bytes(crop[y * cw * 4 : (y + 1) * cw * 4]) for y in range(ch))
png = (
    b"\x89PNG\r\n\x1a\n"
    + chunk(b"IHDR", struct.pack(">IIBBBBB", cw, ch, 8, 6, 0, 0, 0))
    + chunk(b"IDAT", zlib.compress(raw, 9))
    + chunk(b"IEND", b"")
)
with open("public/logo-mark.png", "wb") as handle:
    handle.write(png)
print(f"wrote {cw}x{ch}")
