import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  DESK_LAYOUTS,
  ProfileSchema,
  SettingsSchema,
  defaultProfile,
  defaultSettings,
} from '../src';

/** Dispositions du Bureau (PROPOSITION-INTERFACE option 2) : `layout` et `cardPosition`. */
describe('disposition du Bureau', () => {
  it('par défaut : Enquête, fiche en haut à droite', () => {
    expect(DEFAULT_SETTINGS.layout).toBe('investigate');
    expect(DEFAULT_SETTINGS.cardPosition).toEqual({ x: 1, y: 0 });
    expect([...DESK_LAYOUTS]).toEqual(['investigate', 'read', 'tree']);
    const a = defaultSettings();
    a.cardPosition.x = 0;
    expect(DEFAULT_SETTINGS.cardPosition.x).toBe(1);
  });

  it('accepte chaque disposition et toute position dans [0, 1]', () => {
    for (const layout of DESK_LAYOUTS) {
      expect(SettingsSchema.safeParse({ ...defaultSettings(), layout }).success).toBe(true);
    }
    for (const cardPosition of [
      { x: 0, y: 0 },
      { x: 0.42, y: 1 },
    ]) {
      expect(SettingsSchema.safeParse({ ...defaultSettings(), cardPosition }).success).toBe(true);
    }
  });

  it('refuse une disposition inconnue, une position hors bornes ou incomplète', () => {
    const bad = (patch: Record<string, unknown>) =>
      SettingsSchema.safeParse({ ...defaultSettings(), ...patch }).success;
    expect(bad({ layout: 'free' })).toBe(false);
    expect(bad({ cardPosition: { x: 1.2, y: 0 } })).toBe(false);
    expect(bad({ cardPosition: { x: -0.1, y: 0 } })).toBe(false);
    expect(bad({ cardPosition: { x: 0.5 } })).toBe(false);
    expect(bad({ cardPosition: { x: 0.5, y: 0.5, z: 1 } })).toBe(false);
  });

  it('migration douce : un profil antérieur reçoit Enquête et la position par défaut', () => {
    const {
      layout: _l,
      cardPosition: _c,
      readScale: _r,
      sideWidth: _w,
      ...oldSettings
    } = { ...defaultSettings(), showTimer: true };
    const parsed = ProfileSchema.safeParse({ ...defaultProfile(), settings: oldSettings });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.settings.layout).toBe('investigate');
    expect(parsed.data.settings.cardPosition).toEqual({ x: 1, y: 0 });
    expect(parsed.data.settings.showTimer).toBe(true);
  });

  it('un profil récent garde ses valeurs', () => {
    const p = {
      ...defaultProfile(),
      settings: { ...defaultSettings(), layout: 'tree' as const, cardPosition: { x: 0.2, y: 0.7 } },
    };
    expect(ProfileSchema.parse(p)).toEqual(p);
  });
});
