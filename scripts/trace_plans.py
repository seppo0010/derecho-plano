"""Trace the raster floor plans in scripts/source-images into vector data.

Writes src/Plans.ts. Run from the repo root (needs numpy and opencv-python):

    python3 scripts/trace_plans.py

Only the red walls, blue windows, red columns and the public stairs (the
"S"/"B" markers) are kept; the rest of the drawing (floor tiling, circulation
arrows, labels, ...) is dropped. Coordinates stay in the 2993x2117 pixel space
of the source images, so the room boxes in src/Data.tsx line up unchanged.
"""
import json
import os

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FLOORS = ["planta baja", "planta principal", "primer piso", "segundo piso", "tercer piso"]
MIN_RUN = 15  # shortest straight run kept as a wall; shorter means diagonal
PADDING = 60
# Stairs without an S/B marker, placed by hand: the flight between rooms 12 and
# 59 that runs from planta baja to tercer piso, the two next to rooms 46/48 that
# go from planta baja down to the basement, and E8 on tercer piso.
EXTRA_STAIRS = {
    "planta baja": [[613, 1569], [1592, 899], [1592, 1128]],
    "planta principal": [[504, 1525]],
    "primer piso": [[550, 1650]],
    "segundo piso": [[560, 1615]],
    "tercer piso": [[548, 1630], [1620, 693]],
}
# Elevators, placed by hand: on tercer piso they are bow-tie symbols, below it
# they are the numbered shafts (1-4) on both sides of the two top staircases.
# Every floor also has the "ASC" shaft just above the bottom-left staircase.
ELEVATORS = {
    "planta baja": [[432, 424], [551, 424], [1903, 424], [2021, 424], [612, 1493]],
    "planta principal": [[319, 352], [441, 352], [1841, 352], [1963, 352], [503, 1434]],
    "primer piso": [[357, 412], [483, 412], [1928, 411], [2053, 411], [548, 1551]],
    "segundo piso": [[372, 398], [497, 398], [1925, 398], [2049, 398], [563, 1525]],
    "tercer piso": [[795, 1428], [1562, 1428], [1841, 1547], [542, 1550]],
}


def straight_rects(mask):
    """Axis-aligned rectangles covering the horizontal and vertical strokes."""
    rects = []
    for kernel in (np.ones((1, MIN_RUN), np.uint8), np.ones((MIN_RUN, 1), np.uint8)):
        runs = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        n, _, stats, _ = cv2.connectedComponentsWithStats(runs, connectivity=4)
        for x, y, w, h, area in stats[1:]:
            # a component that fills little of its box is not a straight stroke
            if area >= 0.5 * w * h:
                rects.append((int(x), int(y), int(w), int(h)))
            else:
                rects.extend(straight_rects_rows(runs[y:y + h, x:x + w], x, y, w >= h))
    return rects


def straight_rects_rows(sub, ox, oy, horizontal):
    """Split an L/T shaped component into one rect per row or column run."""
    open_runs = {}  # (start, end) -> (first line, thickness)
    rects = []

    def close(a, b, i, n):
        rects.append((ox + a, oy + i, b - a, n) if horizontal else (ox + i, oy + a, n, b - a))

    lines = sub if horizontal else sub.T
    for i, line in enumerate(lines):
        on = np.flatnonzero(np.diff(np.concatenate(([0], line > 0, [0])).astype(int)))
        runs = {(int(a), int(b)) for a, b in zip(on[::2], on[1::2]) if b - a >= MIN_RUN}
        for run in list(open_runs):
            if run not in runs:
                close(*run, *open_runs.pop(run))
        for run in runs:
            first, n = open_runs.get(run, (i, 0))
            open_runs[run] = (first, n + 1)
    for run, (first, n) in open_runs.items():
        close(*run, first, n)
    return rects


def rect_path(rects):
    return "".join(f"M{x} {y}h{w}v{h}h{-w}z" for x, y, w, h in rects)


def polygon_path(mask, min_area):
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    parts = []
    for c in contours:
        if cv2.contourArea(c) < min_area:
            continue
        pts = cv2.approxPolyDP(c, 1.5, True).reshape(-1, 2)
        parts.append("M" + "L".join(f"{x} {y}" for x, y in pts) + "z")
    return "".join(parts)


def stair_markers(im):
    """Centres of the big green "B" / cyan "S" letters marking public stairs."""
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
    h = hsv[..., 0].astype(int) * 2
    letters = ((h >= 90) & (h <= 200) & (hsv[..., 1] > 140) & (hsv[..., 2] > 100)).astype(np.uint8)
    letters = cv2.dilate(letters, np.ones((5, 5), np.uint8))
    n, _, stats, centroids = cv2.connectedComponentsWithStats(letters)
    # legend text is much smaller than the markers
    return [[int(cx), int(cy)] for (_, _, w, hh, _), (cx, cy) in zip(stats[1:], centroids[1:])
            if 40 <= hh <= 150 and w <= 120]


def trace(floor):
    im = cv2.imread(os.path.join(ROOT, "scripts", "source-images", f"{floor}.png"))
    b, g, r = (im[..., i].astype(int) for i in range(3))
    red = ((r > 180) & (g < 90) & (b < 90)).astype(np.uint8) * 255
    blue = ((b > 180) & (r < 90) & (g < 90)).astype(np.uint8) * 255

    # erase the thin diagonal lines (crossed-out voids) before looking for walls;
    # shallow ones would otherwise survive as short straight runs
    thin = cv2.subtract(red, cv2.dilate(cv2.erode(red, np.ones((5, 5), np.uint8)), np.ones((5, 5), np.uint8)))
    lines = cv2.HoughLinesP(thin, 1, np.pi / 360, 80, minLineLength=150, maxLineGap=6)
    for (lx0, ly0, lx1, ly1), in (lines if lines is not None else []):
        angle = abs(np.degrees(np.arctan2(ly1 - ly0, lx1 - lx0))) % 180
        if 2 < angle < 88 or 92 < angle < 178:
            cv2.line(red, (int(lx0), int(ly0)), (int(lx1), int(ly1)), 0, 5)

    walls = straight_rects(red)
    windows = straight_rects(blue)

    # columns: solid red blobs that are not part of a straight wall
    covered = np.zeros_like(red)
    for x, y, w, h in walls:
        covered[y:y + h, x:x + w] = 255
    solid = cv2.dilate(cv2.erode(red, np.ones((7, 7), np.uint8)), np.ones((7, 7), np.uint8))
    columns = cv2.subtract(solid, cv2.dilate(covered, np.ones((5, 5), np.uint8)))
    columns = cv2.morphologyEx(columns, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))

    pts = np.array([(x, y) for x, y, w, h in walls] + [(x + w, y + h) for x, y, w, h in walls])
    x0, y0 = pts.min(axis=0) - PADDING
    x1, y1 = pts.max(axis=0) + PADDING
    elevators = ELEVATORS.get(floor, [])
    stairs = stair_markers(im) + EXTRA_STAIRS.get(floor, [])
    for stair in stairs:
        # line a staircase up with the elevators on both sides of it
        beside = [y for x, y in elevators if abs(x - stair[0]) < 100 and abs(y - stair[1]) < 80]
        if len(beside) >= 2:
            stair[1] = round(sum(beside) / len(beside))
    return {
        "viewBox": [int(x0), int(y0), int(x1 - x0), int(y1 - y0)],
        "walls": rect_path(walls) + polygon_path(columns, 60),
        "windows": rect_path(windows),
        "stairs": stairs,
        "elevators": elevators,
    }


def main():
    plans = {floor: trace(floor) for floor in FLOORS}
    out = [
        "// Generated by scripts/trace_plans.py from scripts/source-images. Do not edit.",
        "",
        "export interface Plan {",
        "  viewBox: [number, number, number, number];",
        "  walls: string;",
        "  windows: string;",
        "  stairs: [number, number][];",
        "  elevators: [number, number][];",
        "}",
        "",
        "export const plans: Record<string, Plan> = {",
    ]
    for floor, plan in plans.items():
        out.append(f"  {json.dumps(floor)}: {{")
        for key, value in plan.items():
            out.append(f"    {key}: {json.dumps(value, separators=(',', ':'))},")
        out.append("  },")
    out.append("};")
    with open(os.path.join(ROOT, "src", "Plans.ts"), "w") as f:
        f.write("\n".join(out) + "\n")


if __name__ == "__main__":
    main()
