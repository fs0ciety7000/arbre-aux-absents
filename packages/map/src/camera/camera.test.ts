import { describe, expect, it } from 'vitest';
import type { Camera, CameraBounds, Viewport } from './types';
import {
  baseScale,
  cameraOps,
  clamp,
  fitTo,
  mapSizePx,
  panBy,
  toMap,
  toScreen,
  visibleRect,
  zoomAt,
} from './camera';
import { easeCamera, easeInOutCubic } from './motion';

const B: CameraBounds = { aspect: Math.SQRT2, minZoom: 1, maxZoom: 8 };
const LANDSCAPE: Viewport = { width: 1280, height: 720 };
const PORTRAIT: Viewport = { width: 390, height: 844 };
const EPS = 1e-9;

/** Deterministic PRNG (mulberry32) for property tests without a dependency. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(42);
const between = (lo: number, hi: number) => lo + (hi - lo) * rand();
const randomViewport = (): Viewport => ({ width: between(200, 2600), height: between(200, 1600) });
const randomBounds = (): CameraBounds => {
  const minZoom = between(0.5, 1.5);
  return { aspect: between(0.5, 2.5), minZoom, maxZoom: minZoom * between(1, 10) };
};
const randomCamera = (b: CameraBounds): Camera => ({
  center: { x: between(-0.5, 1.5), y: between(-0.5, 1.5) },
  zoom: between(b.minZoom * 0.5, b.maxZoom * 1.5),
});
const N = 300;

/** Map edges on screen for camera c. */
function edges(c: Camera, v: Viewport, b: CameraBounds) {
  const tl = toScreen({ x: 0, y: 0 }, c, v, b);
  const br = toScreen({ x: 1, y: 1 }, c, v, b);
  return { left: tl.x, top: tl.y, right: br.x, bottom: br.y };
}

describe('zoom 1 = whole map in « contain »', () => {
  it('landscape viewport wider than the map: height fits, map centred horizontally', () => {
    const c = clamp({ center: { x: 0.2, y: 0.9 }, zoom: 1 }, LANDSCAPE, B);
    expect(c.center).toEqual({ x: 0.5, y: 0.5 });
    const e = edges(c, LANDSCAPE, B);
    expect(e.top).toBeCloseTo(0);
    expect(e.bottom).toBeCloseTo(720);
    expect(e.right - e.left).toBeCloseTo(720 * Math.SQRT2);
    expect((e.left + e.right) / 2).toBeCloseTo(640);
  });
  it('portrait viewport: width fits, map centred vertically', () => {
    const c = clamp({ center: { x: 0.5, y: 0.5 }, zoom: 1 }, PORTRAIT, B);
    const e = edges(c, PORTRAIT, B);
    expect(e.left).toBeCloseTo(0);
    expect(e.right).toBeCloseTo(390);
    expect((e.top + e.bottom) / 2).toBeCloseTo(422);
  });
  it('baseScale and mapSizePx', () => {
    expect(baseScale(LANDSCAPE, B)).toBeCloseTo(720);
    expect(baseScale(PORTRAIT, B)).toBeCloseTo(390 / Math.SQRT2);
    expect(mapSizePx({ center: { x: 0.5, y: 0.5 }, zoom: 2 }, LANDSCAPE, B).height).toBeCloseTo(
      1440,
    );
  });
});

describe('clamp', () => {
  it('bounds zoom', () => {
    expect(clamp({ center: { x: 0.5, y: 0.5 }, zoom: 0.1 }, LANDSCAPE, B).zoom).toBe(1);
    expect(clamp({ center: { x: 0.5, y: 0.5 }, zoom: 100 }, LANDSCAPE, B).zoom).toBe(8);
  });
  it('keeps the map covering the viewport once larger (exact edges)', () => {
    const c = clamp({ center: { x: 0, y: 0 }, zoom: 4 }, LANDSCAPE, B);
    const e = edges(c, LANDSCAPE, B);
    expect(e.left).toBeCloseTo(0);
    expect(e.top).toBeCloseTo(0);
    const d = clamp({ center: { x: 1, y: 1 }, zoom: 4 }, LANDSCAPE, B);
    const f = edges(d, LANDSCAPE, B);
    expect(f.right).toBeCloseTo(1280);
    expect(f.bottom).toBeCloseTo(720);
  });
  it('property: idempotent, within bounds, map never leaves the viewport', () => {
    for (let k = 0; k < N; k++) {
      const v = randomViewport();
      const b = randomBounds();
      const c = clamp(randomCamera(b), v, b);
      expect(clamp(c, v, b)).toEqual(c);
      expect(c.zoom).toBeGreaterThanOrEqual(b.minZoom);
      expect(c.zoom).toBeLessThanOrEqual(b.maxZoom);
      const e = edges(c, v, b);
      const w = e.right - e.left;
      const h = e.bottom - e.top;
      if (w <= v.width + EPS) expect((e.left + e.right) / 2).toBeCloseTo(v.width / 2, 6);
      else {
        expect(e.left).toBeLessThanOrEqual(1e-6);
        expect(e.right).toBeGreaterThanOrEqual(v.width - 1e-6);
      }
      if (h <= v.height + EPS) expect((e.top + e.bottom) / 2).toBeCloseTo(v.height / 2, 6);
      else {
        expect(e.top).toBeLessThanOrEqual(1e-6);
        expect(e.bottom).toBeGreaterThanOrEqual(v.height - 1e-6);
      }
    }
  });
  it('survives degenerate input', () => {
    const nan = clamp({ center: { x: NaN, y: Infinity }, zoom: NaN }, LANDSCAPE, B);
    expect(nan).toEqual({ center: { x: 0.5, y: 0.5 }, zoom: 1 });
    const empty = clamp({ center: { x: 3, y: -1 }, zoom: 2 }, { width: 0, height: 0 }, B);
    expect(empty).toEqual({ center: { x: 1, y: 0 }, zoom: 2 });
    const bad = clamp({ center: { x: 0.5, y: 0.5 }, zoom: 5 }, LANDSCAPE, {
      aspect: -1,
      minZoom: 0,
      maxZoom: NaN,
    });
    expect(bad.zoom).toBe(1);
    const inverted = clamp({ center: { x: 0.5, y: 0.5 }, zoom: 5 }, LANDSCAPE, {
      aspect: 1,
      minZoom: 3,
      maxZoom: 2,
    });
    expect(inverted.zoom).toBe(3);
  });
});

describe('toScreen / toMap', () => {
  it('the camera centre is at the viewport centre', () => {
    const c = { center: { x: 0.3, y: 0.7 }, zoom: 3 };
    expect(toScreen(c.center, c, LANDSCAPE, B)).toEqual({ x: 640, y: 360 });
    expect(toMap({ x: 640, y: 360 }, c, LANDSCAPE, B)).toEqual(c.center);
  });
  it('property: toMap ∘ toScreen = id and toScreen ∘ toMap = id', () => {
    for (let k = 0; k < N; k++) {
      const v = randomViewport();
      const b = randomBounds();
      const c = randomCamera(b);
      const p = { x: rand(), y: rand() };
      const back = toMap(toScreen(p, c, v, b), c, v, b);
      expect(back.x).toBeCloseTo(p.x, 9);
      expect(back.y).toBeCloseTo(p.y, 9);
      const s = { x: between(0, v.width), y: between(0, v.height) };
      const again = toScreen(toMap(s, c, v, b), c, v, b);
      expect(again.x).toBeCloseTo(s.x, 6);
      expect(again.y).toBeCloseTo(s.y, 6);
    }
  });
  it('distances scale with zoom and the aspect is preserved', () => {
    const c = { center: { x: 0.5, y: 0.5 }, zoom: 2 };
    const a = toScreen({ x: 0, y: 0 }, c, LANDSCAPE, B);
    const z = toScreen({ x: 1, y: 1 }, c, LANDSCAPE, B);
    expect((z.x - a.x) / (z.y - a.y)).toBeCloseTo(Math.SQRT2);
    expect(z.y - a.y).toBeCloseTo(1440);
  });
  it('toMap on an empty viewport returns the centre', () => {
    const c = { center: { x: 0.2, y: 0.4 }, zoom: 2 };
    expect(toMap({ x: 10, y: 10 }, c, { width: 0, height: 100 }, B)).toEqual(c.center);
  });
  it('visibleRect covers the viewport', () => {
    const c = clamp({ center: { x: 0.5, y: 0.5 }, zoom: 1 }, LANDSCAPE, B);
    const r = visibleRect(c, LANDSCAPE, B);
    expect(r.y0).toBeCloseTo(0);
    expect(r.y1).toBeCloseTo(1);
    expect(r.x0).toBeLessThan(0);
    expect(r.x1).toBeGreaterThan(1);
  });
});

describe('zoomAt', () => {
  it('keeps the point under the cursor fixed (example)', () => {
    const c = clamp({ center: { x: 0.5, y: 0.5 }, zoom: 2 }, LANDSCAPE, B);
    const at = { x: 700, y: 300 };
    const before = toMap(at, c, LANDSCAPE, B);
    const z = zoomAt(c, 1.5, at, LANDSCAPE, B);
    expect(z.zoom).toBeCloseTo(3);
    const after = toMap(at, z, LANDSCAPE, B);
    expect(after.x).toBeCloseTo(before.x, 9);
    expect(after.y).toBeCloseTo(before.y, 9);
  });
  it('property: fixed point whenever neither zoom nor edges are clamped', () => {
    let checked = 0;
    for (let k = 0; k < N * 3; k++) {
      const v = randomViewport();
      const b = randomBounds();
      const c = clamp(randomCamera(b), v, b);
      const factor = between(0.5, 2);
      const at = { x: between(0, v.width), y: between(0, v.height) };
      const anchor = toMap(at, c, v, b);
      const target = c.zoom * factor;
      const z = zoomAt(c, factor, at, v, b);
      // Unclamped result, recomputed independently.
      const s = baseScale(v, b) * target;
      const free = {
        zoom: target,
        center: {
          x: anchor.x - (at.x - v.width / 2) / (s * b.aspect),
          y: anchor.y - (at.y - v.height / 2) / s,
        },
      };
      const clamped = clamp(free, v, b);
      if (
        target >= b.minZoom &&
        target <= b.maxZoom &&
        Math.abs(clamped.center.x - free.center.x) < 1e-12 &&
        Math.abs(clamped.center.y - free.center.y) < 1e-12
      ) {
        checked++;
        const after = toMap(at, z, v, b);
        expect(after.x).toBeCloseTo(anchor.x, 9);
        expect(after.y).toBeCloseTo(anchor.y, 9);
      }
      // Always: a valid, clamped camera.
      expect(clamp(z, v, b)).toEqual(z);
    }
    expect(checked).toBeGreaterThan(50);
  });
  it('zoom in then out by the inverse factor returns to the start (unclamped)', () => {
    const c = clamp({ center: { x: 0.4, y: 0.6 }, zoom: 3 }, LANDSCAPE, B);
    const at = { x: 500, y: 400 };
    const back = zoomAt(zoomAt(c, 1.25, at, LANDSCAPE, B), 1 / 1.25, at, LANDSCAPE, B);
    expect(back.zoom).toBeCloseTo(c.zoom, 9);
    expect(back.center.x).toBeCloseTo(c.center.x, 9);
    expect(back.center.y).toBeCloseTo(c.center.y, 9);
  });
  it('respects zoom bounds and ignores invalid factors', () => {
    const c = clamp({ center: { x: 0.5, y: 0.5 }, zoom: 7 }, LANDSCAPE, B);
    expect(zoomAt(c, 10, { x: 0, y: 0 }, LANDSCAPE, B).zoom).toBe(8);
    expect(zoomAt(c, 0.001, { x: 0, y: 0 }, LANDSCAPE, B).zoom).toBe(1);
    for (const f of [0, -2, NaN, Infinity])
      expect(zoomAt(c, f, { x: 1, y: 1 }, LANDSCAPE, B)).toEqual(c);
    expect(zoomAt(c, 2, { x: 1, y: 1 }, { width: 0, height: 0 }, B)).toEqual(
      clamp(c, { width: 0, height: 0 }, B),
    );
  });
});

describe('panBy', () => {
  it('moves the map with the pointer (unclamped)', () => {
    const c = clamp({ center: { x: 0.5, y: 0.5 }, zoom: 4 }, LANDSCAPE, B);
    const p = { x: 0.5, y: 0.5 };
    const before = toScreen(p, c, LANDSCAPE, B);
    const moved = panBy(c, 30, -20, LANDSCAPE, B);
    const after = toScreen(p, moved, LANDSCAPE, B);
    expect(after.x - before.x).toBeCloseTo(30);
    expect(after.y - before.y).toBeCloseTo(-20);
  });
  it('stops at the edges and cannot pan a map smaller than the viewport', () => {
    const c = clamp({ center: { x: 0.5, y: 0.5 }, zoom: 2 }, LANDSCAPE, B);
    const far = panBy(c, 1e6, 1e6, LANDSCAPE, B);
    const e = edges(far, LANDSCAPE, B);
    expect(e.left).toBeCloseTo(0);
    expect(e.top).toBeCloseTo(0);
    const whole = clamp({ center: { x: 0.5, y: 0.5 }, zoom: 1 }, LANDSCAPE, B);
    expect(panBy(whole, 200, 0, LANDSCAPE, B)).toEqual(whole);
  });
  it('ignores non-finite deltas and empty viewports', () => {
    const c = clamp({ center: { x: 0.5, y: 0.5 }, zoom: 3 }, LANDSCAPE, B);
    expect(panBy(c, NaN, Infinity, LANDSCAPE, B)).toEqual(c);
    expect(panBy(c, 10, 10, { width: 0, height: 10 }, B)).toEqual(
      clamp(c, { width: 0, height: 10 }, B),
    );
  });
});

describe('fitTo', () => {
  it('centres on a point at the requested zoom, clamped near the edges', () => {
    const c = fitTo({ x: 0.5, y: 0.4 }, 3, LANDSCAPE, B);
    expect(c).toEqual({ center: { x: 0.5, y: 0.4 }, zoom: 3 });
    const edge = fitTo({ x: 0, y: 1 }, 3, LANDSCAPE, B);
    expect(edge.center.x).toBeGreaterThan(0);
    expect(edge.center.y).toBeLessThan(1);
    expect(fitTo({ x: 0.5, y: 0.5 }, 99, LANDSCAPE, B).zoom).toBe(8);
  });
});

describe('easeCamera', () => {
  const from: Camera = { center: { x: 0.2, y: 0.3 }, zoom: 1 };
  const to: Camera = { center: { x: 0.8, y: 0.6 }, zoom: 4 };
  it('starts at from, ends at to, clamps t', () => {
    expect(easeCamera(from, to, 0)).toEqual(from);
    expect(easeCamera(from, to, 1)).toEqual(to);
    expect(easeCamera(from, to, -3)).toEqual(from);
    expect(easeCamera(from, to, 7)).toEqual(to);
    expect(easeCamera(from, to, NaN)).toEqual(to);
  });
  it('interpolates zoom geometrically and the centre linearly on the eased progress', () => {
    const mid = easeCamera(from, to, 0.5);
    expect(mid.zoom).toBeCloseTo(2);
    expect(mid.center.x).toBeCloseTo(0.5);
    expect(mid.center.y).toBeCloseTo(0.45);
    const linear = easeCamera(from, to, 0.25, (t) => t);
    expect(linear.center.x).toBeCloseTo(0.35);
    expect(linear.zoom).toBeCloseTo(4 ** 0.25);
  });
  it('is monotonic in zoom and returns fresh objects', () => {
    let prev = 0;
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const z = easeCamera(from, to, t).zoom;
      expect(z).toBeGreaterThanOrEqual(prev - EPS);
      prev = z;
    }
    expect(easeCamera(from, to, 0).center).not.toBe(from.center);
  });
  it('easeInOutCubic is symmetric with fixed ends', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5);
    expect(easeInOutCubic(0.2) + easeInOutCubic(0.8)).toBeCloseTo(1);
  });
});

describe('cameraOps', () => {
  it('exposes the contract operations', () => {
    expect(Object.keys(cameraOps).sort()).toEqual(
      ['clamp', 'fitTo', 'panBy', 'toMap', 'toScreen', 'zoomAt'].sort(),
    );
  });
});
