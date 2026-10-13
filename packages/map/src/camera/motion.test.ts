import { describe, expect, it } from 'vitest';
import { clamp, toScreen } from './camera';
import {
  INERTIA_MAX_SPEED,
  INERTIA_MIN_SPEED,
  cameraAt,
  coastStep,
  releaseVelocity,
  shouldCoast,
  startTransition,
  transitionDuration,
  type PanSample,
} from './motion';
import type { Camera, CameraBounds, Viewport } from './types';

const B: CameraBounds = { aspect: 1.6, minZoom: 1, maxZoom: 6 };
const V: Viewport = { width: 1000, height: 600 };
const FULL = { reducedMotion: false };
const REDUCED = { reducedMotion: true };

describe('transitionDuration', () => {
  it('keeps the duration, 0 in reduced motion or under one frame', () => {
    expect(transitionDuration(400, FULL)).toBe(400);
    expect(transitionDuration(400, REDUCED)).toBe(0);
    expect(transitionDuration(10, FULL)).toBe(0);
    expect(transitionDuration(NaN, FULL)).toBe(0);
    expect(transitionDuration(-50, FULL)).toBe(0);
  });
});

describe('startTransition / cameraAt', () => {
  const from: Camera = { center: { x: 0.5, y: 0.5 }, zoom: 1 };
  const to: Camera = { center: { x: 0.7, y: 0.3 }, zoom: 4 };

  it('runs from `from` to the clamped `to` over the duration', () => {
    const tr = startTransition(from, to, 1000, 400, V, B, FULL);
    expect(tr.to).toEqual(clamp(to, V, B));
    expect(cameraAt(tr, 1000)).toEqual({ camera: from, done: false });
    const mid = cameraAt(tr, 1200);
    expect(mid.done).toBe(false);
    expect(mid.camera.zoom).toBeGreaterThan(1);
    expect(mid.camera.zoom).toBeLessThan(4);
    expect(cameraAt(tr, 1400)).toEqual({ camera: tr.to, done: true });
    expect(cameraAt(tr, 9999).done).toBe(true);
    expect(cameraAt(tr, 500).camera).toEqual(from); // before start: clamped to t = 0
  });

  it('is instant in reduced motion (done at once, at the goal)', () => {
    const tr = startTransition(from, to, 1000, 400, V, B, REDUCED);
    expect(tr.duration).toBe(0);
    expect(cameraAt(tr, 1000)).toEqual({ camera: tr.to, done: true });
  });

  it('copies `from` (no shared reference) and accepts a custom easing', () => {
    const tr = startTransition(from, to, NaN, 100, V, B, FULL);
    expect(tr.from.center).not.toBe(from.center);
    expect(tr.start).toBe(0);
    const linear = cameraAt(tr, 50, (t) => t);
    expect(linear.camera.center.x).toBeCloseTo((0.5 + tr.to.center.x) / 2);
    expect(cameraAt(tr, NaN).done).toBe(true);
  });
});

describe('releaseVelocity', () => {
  const steady: PanSample[] = [0, 16, 32, 48, 64, 80].map((t) => ({ t, dx: 8, dy: -4 }));

  it('measures the speed over the final window', () => {
    const v = releaseVelocity(steady, 80);
    expect(v.vx).toBeCloseTo(0.5);
    expect(v.vy).toBeCloseTo(-0.25);
  });

  it('is zero when the pointer stopped before release, or with too few samples', () => {
    expect(releaseVelocity(steady, 400)).toEqual({ vx: 0, vy: 0 });
    expect(releaseVelocity([{ t: 0, dx: 5, dy: 5 }], 0)).toEqual({ vx: 0, vy: 0 });
    expect(releaseVelocity([], 0)).toEqual({ vx: 0, vy: 0 });
  });

  it('ignores degenerate samples and inputs', () => {
    const noisy: PanSample[] = [
      ...steady,
      { t: NaN, dx: 1e9, dy: 0 },
      { t: 70, dx: Infinity, dy: 0 },
    ];
    expect(releaseVelocity(noisy, 80).vx).toBeCloseTo(0.5);
    expect(releaseVelocity(steady, NaN)).toEqual({ vx: 0, vy: 0 });
    expect(releaseVelocity(steady, 80, 0)).toEqual({ vx: 0, vy: 0 });
    // Two samples at the release instant: no time span.
    expect(
      releaseVelocity(
        [
          { t: 10, dx: 3, dy: 3 },
          { t: 10, dx: 3, dy: 3 },
        ],
        10,
      ),
    ).toEqual({ vx: 0, vy: 0 });
  });

  it('caps a jerky release', () => {
    const v = releaseVelocity(
      [
        { t: 0, dx: 0, dy: 0 },
        { t: 1, dx: 500, dy: 0 },
      ],
      1,
    );
    expect(Math.hypot(v.vx, v.vy)).toBeCloseTo(INERTIA_MAX_SPEED);
  });
});

describe('shouldCoast', () => {
  it('never coasts in reduced motion or below the minimum speed', () => {
    expect(shouldCoast({ vx: 1, vy: 0 }, FULL)).toBe(true);
    expect(shouldCoast({ vx: 1, vy: 0 }, REDUCED)).toBe(false);
    expect(shouldCoast({ vx: INERTIA_MIN_SPEED / 2, vy: 0 }, FULL)).toBe(false);
  });
});

describe('coastStep', () => {
  const start = clamp({ center: { x: 0.5, y: 0.5 }, zoom: 4 }, V, B);

  it('moves the map with the velocity and decays it', () => {
    const p = { x: 0.5, y: 0.5 };
    const r = coastStep(start, { vx: 0.5, vy: 0 }, 16, V, B);
    const dx = toScreen(p, r.camera, V, B).x - toScreen(p, start, V, B).x;
    expect(dx).toBeGreaterThan(7);
    expect(dx).toBeLessThan(8);
    expect(r.velocity.vx).toBeLessThan(0.5);
    expect(r.done).toBe(false);
  });

  it('is frame-rate independent: two half steps = one full step', () => {
    const vel = { vx: 1, vy: -0.6 };
    const one = coastStep(start, vel, 32, V, B);
    const a = coastStep(start, vel, 16, V, B);
    const two = coastStep(a.camera, a.velocity, 16, V, B);
    expect(two.camera.center.x).toBeCloseTo(one.camera.center.x, 12);
    expect(two.camera.center.y).toBeCloseTo(one.camera.center.y, 12);
    expect(two.velocity.vx).toBeCloseTo(one.velocity.vx, 12);
  });

  it('stops against an edge or once slow, and converges', () => {
    const edge = clamp({ center: { x: 0, y: 0.5 }, zoom: 4 }, V, B);
    expect(coastStep(edge, { vx: 2, vy: 0 }, 16, V, B).done).toBe(true);
    expect(coastStep(start, { vx: INERTIA_MIN_SPEED, vy: 0 }, 16, V, B).done).toBe(true);
    let s = { camera: start, velocity: { vx: 1, vy: 0.5 }, done: false };
    let frames = 0;
    while (!s.done && frames < 1000) {
      s = coastStep(s.camera, s.velocity, 16, V, B);
      frames++;
    }
    expect(s.done).toBe(true);
    expect(frames).toBeLessThan(200);
    expect(clamp(s.camera, V, B)).toEqual(s.camera);
  });

  it('ignores invalid steps', () => {
    const vel = { vx: 1, vy: 0 };
    expect(coastStep(start, vel, 0, V, B)).toEqual({ camera: start, velocity: vel, done: false });
    expect(coastStep(start, vel, NaN, V, B).camera).toEqual(start);
    expect(coastStep(start, vel, 16, V, B, 0).camera).toEqual(start);
  });
});
