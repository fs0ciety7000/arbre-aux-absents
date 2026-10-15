import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  ProfileSchema,
  READ_SCALES,
  SIDE_WIDTH,
  SettingsSchema,
  defaultProfile,
  defaultSettings,
} from '../src';

/** « Confort de lecture » (PROPOSITION-INTERFACE option 1) : `readScale` et `sideWidth`. */
describe('réglages de lecture', () => {
  it('valeurs par défaut : texte du Lecteur 1, volet standard', () => {
    expect(DEFAULT_SETTINGS.readScale).toBe(1);
    expect(DEFAULT_SETTINGS.sideWidth).toBe(SIDE_WIDTH.standard);
    expect(READ_SCALES).toContain(DEFAULT_SETTINGS.readScale);
    expect(READ_SCALES.length).toBeGreaterThanOrEqual(4);
    expect(READ_SCALES.length).toBeLessThanOrEqual(5);
    expect([...READ_SCALES]).toEqual([...READ_SCALES].sort((a, b) => a - b));
  });

  it('accepte chaque cran et chaque largeur entière dans les bornes', () => {
    for (const readScale of READ_SCALES) {
      expect(SettingsSchema.safeParse({ ...defaultSettings(), readScale }).success).toBe(true);
    }
    for (const sideWidth of [SIDE_WIDTH.min, 512, SIDE_WIDTH.wide, SIDE_WIDTH.max]) {
      expect(SettingsSchema.safeParse({ ...defaultSettings(), sideWidth }).success).toBe(true);
    }
  });

  it('refuse un cran inconnu, une largeur hors bornes ou non entière', () => {
    const bad = (patch: Record<string, unknown>) =>
      SettingsSchema.safeParse({ ...defaultSettings(), ...patch }).success;
    expect(bad({ readScale: 1.1 })).toBe(false);
    expect(bad({ readScale: '1' })).toBe(false);
    expect(bad({ sideWidth: SIDE_WIDTH.min - 1 })).toBe(false);
    expect(bad({ sideWidth: SIDE_WIDTH.max + 1 })).toBe(false);
    expect(bad({ sideWidth: 440.5 })).toBe(false);
  });

  it('migration douce : un profil antérieur sans ces champs les reçoit par défaut', () => {
    const {
      readScale: _r,
      sideWidth: _w,
      ...oldSettings
    } = {
      ...defaultSettings(),
      textScale: 1.25 as const,
      validation: 'manual' as const,
    };
    const old = { ...defaultProfile(), settings: oldSettings };
    const parsed = ProfileSchema.safeParse(old);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.settings.readScale).toBe(1);
    expect(parsed.data.settings.sideWidth).toBe(SIDE_WIDTH.standard);
    // Les autres réglages du joueur sont gardés tels quels.
    expect(parsed.data.settings.textScale).toBe(1.25);
    expect(parsed.data.settings.validation).toBe('manual');
  });

  it('un profil récent garde ses valeurs', () => {
    const p = {
      ...defaultProfile(),
      settings: { ...defaultSettings(), readScale: 1.3, sideWidth: 600 },
    };
    expect(ProfileSchema.parse(p)).toEqual(p);
  });
});
