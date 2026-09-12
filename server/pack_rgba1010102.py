#!/usr/bin/env python3
"""Pack little-endian RGB48 into Android RGBA1010102 (R10 G10 B10 A2)."""

import sys
from array import array

PIXELS_PER_CHUNK = 65536


def to10(value, shift):
    return min(value >> shift, 1023)


def pack(src, dst, width, height):
    expected_rgb = width * height * 6
    with open(src, "rb") as handle:
        handle.seek(0, 2)
        size = handle.tell()
        handle.seek(0)
        if size != expected_rgb:
            raise SystemExit(
                "unexpected raw size %s, expected %s (%sx%s rgb48)"
                % (size, expected_rgb, width, height)
            )

        sample = handle.read(min(size, 6 * 4096))
        probe = array("H")
        probe.frombytes(sample)
        shift = 6 if (probe and max(probe) > 1023) else 0
        handle.seek(0)

        with open(dst, "wb") as out:
            while True:
                chunk = handle.read(6 * PIXELS_PER_CHUNK)
                if not chunk:
                    break
                rgb = array("H")
                rgb.frombytes(chunk)
                packed = array("I")
                packed.extend(
                    to10(rgb[i], shift)
                    | (to10(rgb[i + 1], shift) << 10)
                    | (to10(rgb[i + 2], shift) << 20)
                    | (0x3 << 30)
                    for i in range(0, len(rgb), 3)
                )
                packed.tofile(out)


def unpack(src, dst, width, height):
    expected = width * height * 4
    with open(src, "rb") as handle:
        handle.seek(0, 2)
        size = handle.tell()
        handle.seek(0)
        if size != expected:
            raise SystemExit(
                "unexpected raw size %s, expected %s (%sx%s rgba1010102)"
                % (size, expected, width, height)
            )
        with open(dst, "wb") as out:
            while True:
                chunk = handle.read(4 * PIXELS_PER_CHUNK)
                if not chunk:
                    break
                packed = array("I")
                packed.frombytes(chunk)
                rgb = array("H")
                for pix in packed:
                    rgb.extend((
                        (pix & 1023) << 6,
                        ((pix >> 10) & 1023) << 6,
                        ((pix >> 20) & 1023) << 6,
                    ))
                rgb.tofile(out)


if __name__ == "__main__":
    if len(sys.argv) == 6 and sys.argv[1] == "unpack":
        unpack(sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5]))
    elif len(sys.argv) == 5:
        pack(sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]))
    else:
        raise SystemExit("usage: pack_rgba1010102.py [unpack] SRC DST WIDTH HEIGHT")
