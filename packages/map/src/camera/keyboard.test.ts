import { describe, expect, it } from 'vitest';
import { clamp, toScreen } from './camera';
import {
  KEY_PAN_STEP,
  KEY_PAN_STEP_FAR,
  KEY_ZOOM_STEP,
  applyKeyAction,
  keyAction,
  keyPanStep,
} from './keyboard';
import type { CameraBounds, Viewport } from './types';

const B: CameraBounds = { aspect: 1.5, minZoom: 1, maxZoom: 8 };
const V: Viewport = { width: 800, height: 600 };

describe('keyAction', () => {
  it('maps arrows, zoom keys and 0', () => {
    expect(keyAction({ key: 'ArrowLeft' })).toEqual({ kind: 'pan', dx: 1, dy: 0, far: false });
    expect(keyAction({ key: 'ArrowRight', shiftKey: true })).toEqual({
      kind: 'pan',
      dx: -1,
      dy: 0,
      far: true,
    });
    expect(keyAction({ key: 'ArrowUp' })).toMatchObject({ dx: 0, dy: 1 });
    expect(keyAction({ key: 'ArrowDown' })).toMatchObject({ dx: 0, dy: -1 });
    for (const key of ['+', '=', 'Add'])
      expect(keyAction({ key })).toEqual({ kind: 'zoom', factor: KEY_ZOOM_STEP });
    for (const key of ['-', '_', 'Subtract'])
      expect(keyAction({ key })).toEqual({ kind: 'zoom', factor: 1 / KEY_ZOOM_STEP });
    expect(keyAction({ key: '0' })).toEqual({ kind: 'reset' });
  });

  it('leaves other keys and modified keys to the page', () => {
    expect(keyAction({ key: 'a' })).toBeNull();
    expect(keyAction({ key: 'Tab' })).toBeNull();
    expect(keyAction({ key: 'toString' })).toBeNull();
    expect(keyAction({ key: '__proto__' })).toBeNull();
    expect(keyAction({ key: '+', ctrlKey: true })).toBeNull();
    expect(keyAction({ key: 'ArrowLeft', metaKey: true })).toBeNull();
    expect(keyAction({ key: '0', altKey: true })).toBeNull();
  });
});

describe('keyPanStep', () => {
  it('is a fraction of the short side, 0 for an empty viewport', () => {
    expect(keyPanStep(V, false)).toBeCloseTo(600 * KEY_PAN_STEP);
    expect(keyPanStep(V, true)).toBeCloseTo(600 * KEY_PAN_STEP_FAR);
    expect(keyPanStep({ width: 0, height: 0 }, true)).toBe(0);
    expect(keyPanStep({ width: NaN, height: 10 }, false)).toBe(0);
  });
});

describe('applyKeyAction', () => {
  const base = clamp({ center: { x: 0.5, y: 0.5 }, zoom: 4 }, V, B);

  it('ArrowLeft moves the map right by one step', () => {
    const p = { x: 0.5, y: 0.5 };
    const c = applyKeyAction(base, { kind: 'pan', dx: 1, dy: 0, far: false }, V, B);
    expect(toScreen(p, c, V, B).x - toScreen(p, base, V, B).x).toBeCloseTo(600 * KEY_PAN_STEP);
  });

  it('zooms around the viewport centre (the centre stays put)', () => {
    const c = applyKeyAction(base, { kind: 'zoom', factor: KEY_ZOOM_STEP }, V, B);
    expect(c.zoom).toBeCloseTo(4 * KEY_ZOOM_STEP);
    expect(c.center.x).toBeCloseTo(base.center.x);
    expect(c.center.y).toBeCloseTo(base.center.y);
  });

  it('0 goes back to the overview, whatever the base', () => {
    expect(applyKeyAction(base, { kind: 'reset' }, V, B)).toEqual({
      center: { x: 0.5, y: 0.5 },
      zoom: 1,
    });
  });

  it('repeats accumulate on the goal and stay bounded', () => {
    let c = base;
    for (let k = 0; k < 20; k++)
      c = applyKeyAction(c, { kind: 'zoom', factor: KEY_ZOOM_STEP }, V, B);
    expect(c.zoom).toBe(8);
    for (let k = 0; k < 50; k++)
      c = applyKeyAction(c, { kind: 'pan', dx: 1, dy: 1, far: true }, V, B);
    expect(clamp(c, V, B)).toEqual(c);
    expect(toScreen({ x: 0, y: 0 }, c, V, B).x).toBeCloseTo(0);
  });
});
