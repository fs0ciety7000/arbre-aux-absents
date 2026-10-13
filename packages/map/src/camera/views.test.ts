import type { WorldMap } from '@arbre/contract';
import { describe, expect, it } from 'vitest';
import * as api from '../index';
import { boundsFromWorldMap, overview } from './bounds';
import { clamp, mapSizePx, toScreen } from './camera';
import type { CameraBounds, Viewport } from './types';
import { comfortMargin, defaultFocusZoom, firstView, focusOn, needsReveal, reveal } from './views';

const MAP: WorldMap = {
  aspect: 1.25,
  layers: ['base', 'labels'],
  minZoom: 1,
  maxZoom: 9,
  title: 'Carte',
};
const B = boundsFromWorldMap(MAP);
const DESKTOP: Viewport = { width: 1280, height: 800 };
const PHONE: Viewport = { width: 390, height: 844 };

describe('boundsFromWorldMap / overview', () => {
  it('takes aspect and zoom bounds from WorldMap', () => {
    expect(B).toEqual({ aspect: 1.25, minZoom: 1, maxZoom: 9 });
    expect(overview(B)).toEqual({ center: { x: 0.5, y: 0.5 }, zoom: 1 });
  });
  it('sanitises absurd bounds (the camera stays total)', () => {
    expect(boundsFromWorldMap({ aspect: 0, minZoom: -1, maxZoom: NaN })).toEqual({
      aspect: 1,
      minZoom: 1,
      maxZoom: 1,
    });
    expect(boundsFromWorldMap({ aspect: 2, minZoom: 3, maxZoom: 2 }).maxZoom).toBe(3);
  });
  it('a variable aspect changes the « contain » size', () => {
    const wide = boundsFromWorldMap({ aspect: 3, minZoom: 1, maxZoom: 4 });
    const size = mapSizePx(overview(wide), DESKTOP, wide);
    expect(size.width).toBeCloseTo(1280);
    expect(size.height).toBeCloseTo(1280 / 3);
  });
  it('overview starts at minZoom when it is above 1', () => {
    const b: CameraBounds = { aspect: 1, minZoom: 1.5, maxZoom: 4 };
    expect(overview(b).zoom).toBe(1.5);
  });
});

describe('firstView', () => {
  it('desktop: the whole map (no boost)', () => {
    expect(firstView(DESKTOP, B)).toEqual(clamp(overview(B), DESKTOP, B));
  });
  it('tall phone: closer, at most ×2, still valid', () => {
    const c = firstView(PHONE, B);
    expect(c.zoom).toBeGreaterThan(1);
    expect(c.zoom).toBeLessThanOrEqual(2);
    expect(clamp(c, PHONE, B)).toEqual(c);
    const size = mapSizePx(c, PHONE, B);
    expect(size.height).toBeGreaterThan(PHONE.height * 0.6);
  });
  it('never beyond maxZoom, and sane on an empty viewport', () => {
    const tight: CameraBounds = { aspect: 2, minZoom: 1, maxZoom: 1.2 };
    expect(firstView(PHONE, tight).zoom).toBe(1.2);
    expect(firstView({ width: 0, height: 0 }, B)).toEqual(overview(B));
  });
});

describe('focusOn', () => {
  const place = { x: 0.3, y: 0.6 };
  it('centres the place at the default focus zoom', () => {
    expect(defaultFocusZoom(B)).toBeCloseTo(3);
    const c = focusOn(overview(B), place, DESKTOP, B);
    expect(c.zoom).toBeCloseTo(3);
    const s = toScreen(place, c, DESKTOP, B);
    expect(s.x).toBeCloseTo(640);
    expect(s.y).toBeCloseTo(400);
  });
  it('never zooms out to focus, honours an explicit zoom, stays bounded', () => {
    expect(focusOn({ center: { x: 0.5, y: 0.5 }, zoom: 6 }, place, DESKTOP, B).zoom).toBe(6);
    expect(focusOn(overview(B), place, DESKTOP, B, 5).zoom).toBe(5);
    expect(focusOn(overview(B), place, DESKTOP, B, 99).zoom).toBe(9);
    expect(focusOn(overview(B), place, DESKTOP, B, NaN).zoom).toBeCloseTo(3);
    const corner = focusOn(overview(B), { x: 0, y: 0 }, DESKTOP, B);
    expect(toScreen({ x: 0, y: 0 }, corner, DESKTOP, B).x).toBeCloseTo(0);
  });
});

describe('needsReveal / reveal', () => {
  const c = clamp({ center: { x: 0.5, y: 0.5 }, zoom: 4 }, DESKTOP, B);
  it('comfort margin is 15 % of each side, capped at 160 px', () => {
    expect(comfortMargin(DESKTOP)).toEqual({ x: 160, y: 120 });
    expect(comfortMargin({ width: -5, height: 100 })).toEqual({ x: 0, y: 15 });
  });
  it('leaves a centred place alone', () => {
    expect(needsReveal({ x: 0.5, y: 0.5 }, c, DESKTOP, B)).toBe(false);
    expect(reveal({ x: 0.5, y: 0.5 }, c, DESKTOP, B)).toBeNull();
  });
  it('recentres an off-screen place at the same zoom', () => {
    const p = { x: 0.9, y: 0.1 };
    expect(needsReveal(p, c, DESKTOP, B)).toBe(true);
    const r = reveal(p, c, DESKTOP, B)!;
    expect(r.zoom).toBe(c.zoom);
    expect(needsReveal(p, r, DESKTOP, B)).toBe(false);
  });
  it('does nothing on an empty viewport', () => {
    expect(needsReveal({ x: 0.9, y: 0.9 }, c, { width: 0, height: 0 }, B)).toBe(false);
  });
});

describe('module', () => {
  it('the package entry exports the camera', () => {
    for (const name of ['clamp', 'zoomAt', 'panBy', 'fitTo', 'toScreen', 'toMap', 'cameraAt'])
      expect(typeof (api as Record<string, unknown>)[name]).toBe('function');
  });
  // « Aucun DOM » est garanti à la compilation : tsconfig sans lib DOM ni types node.
});
