/** Rejouabilité : champs facultatifs de la partie, du profil et de la chemise (après 1.5.0). */
import { describe, expect, it } from 'vitest';
import {
  CaseCompletionSchema,
  CaseMetaSchema,
  isCaseSlot,
  SAVE_SLOT_IDS,
  SaveSlotIdSchema,
  SaveStateSchema,
} from '../src';
import { saveState } from './fixtures';

const validSave = () => structuredClone(saveState);

describe('partie : champs ajoutés après la 1.5.0', () => {
  it('une partie 1.5.0 (sans les champs) reste valide', () => {
    const s = validSave();
    for (const k of ['endedMs', 'reports', 'splits', 'contested']) expect(s).not.toHaveProperty(k);
    expect(SaveStateSchema.safeParse(s).success).toBe(true);
  });

  it('rapports remis, fractionnés, contestations : acceptés et bornés', () => {
    const s = {
      ...validSave(),
      ending: 'fin-a',
      endedMs: 4000,
      reports: [{ ending: 'fin-a', answers: { 'q-1': 'o-1' }, at: 10, elapsedMs: 4000 }],
      splits: [{ group: 'grp-a', elapsedMs: 1200 }],
      contested: { 'c-01': { at: 12, fields: ['portrait', 'occupation'] } },
    };
    expect(SaveStateSchema.safeParse(s).success).toBe(true);
    const tooMany = { ...s, reports: Array.from({ length: 21 }, () => s.reports[0]) };
    expect(SaveStateSchema.safeParse(tooMany).success).toBe(false);
    const badField = { ...s, contested: { 'c-01': { at: 1, fields: ['age'] } } };
    expect(SaveStateSchema.safeParse(badField).success).toBe(false);
  });

  it('emplacement `timed` : propre à chaque affaire, comme le secours', () => {
    expect(SAVE_SLOT_IDS).toContain('timed');
    expect(SaveSlotIdSchema.safeParse('timed').success).toBe(true);
    expect(isCaseSlot('timed')).toBe(true);
    expect(isCaseSlot('auto')).toBe(true);
    expect(isCaseSlot('slot-1')).toBe(false);
  });
});

describe('profil et chemise', () => {
  it('fiche d’affaire : dernière fin et fractionnés du meilleur temps facultatifs', () => {
    expect(CaseCompletionSchema.safeParse({ endings: [] }).success).toBe(true);
    const full = {
      endings: ['fin-a'],
      bestTimedMs: 5000,
      lastEnding: 'fin-a',
      bestSplits: [{ group: 'grp-a', elapsedMs: 1200 }],
    };
    expect(CaseCompletionSchema.safeParse(full).success).toBe(true);
  });

  it('cote et durée indicative de l’affaire', () => {
    const meta = { id: 'a', title: 'A', version: '1.0.0', intro: 'of-01' };
    expect(CaseMetaSchema.safeParse(meta).success).toBe(true);
    const ok = { ...meta, cote: '76-0012', durationMinutes: [290, 445] };
    expect(CaseMetaSchema.safeParse(ok).success).toBe(true);
    expect(CaseMetaSchema.safeParse({ ...meta, cote: 'a b' }).success).toBe(false);
    expect(CaseMetaSchema.safeParse({ ...meta, durationMinutes: [400, 300] }).success).toBe(false);
  });
});
