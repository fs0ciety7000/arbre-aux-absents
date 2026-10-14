import { SAVE_LIMITS, SaveStateSchema, type SaveState } from '@arbre/contract';
import { describe, expect, it } from 'vitest';
import { MAX_SAVE_CHARS, migrateSave, parseSave, type Migration } from '../src';
import { C, deepFreeze, fill, find, open, play, researched, start, clone } from './helpers';

function sample(): SaveState {
  return play(researched(), [
    fill('g1-tam', 12000),
    { type: 'pin', target: { kind: 'document', id: 'lettre-notaire' }, at: 12001 },
    { type: 'note', id: 'n1', target: { kind: 'slot', id: 'g1-tam' }, text: 'marin ?', at: 12002 },
    {
      type: 'highlight',
      h: { doc: 'lettre-notaire', path: [0], start: 0, end: 4, color: 2 },
      at: 12003,
    },
  ]).state;
}

describe('parseSave', () => {
  it('aller-retour JSON : état identique, rien de retiré, conforme au schéma', () => {
    const s = sample();
    const r = parseSave(JSON.stringify(s), C);
    expect(r).toEqual({ ok: true, state: s, dropped: [] });
    expect(SaveStateSchema.safeParse(s).success).toBe(true);
    expect(parseSave(deepFreeze(clone(s)), C)).toEqual({
      ok: true,
      state: s,
      dropped: [],
    });
  });

  it.each([
    ['JSON invalide', '{"schemaVersion":1,', 'illisible'],
    ['tableau', '[]', 'objet attendu'],
    ['nombre', 42, 'objet attendu'],
    ['null', null, 'objet attendu'],
    ['sans version', { caseId: 'affaire-test' }, 'Version'],
    ['version négative', { schemaVersion: -1 }, 'Version'],
    ['version future', { schemaVersion: 2 }, 'plus récente'],
    ['trop volumineux', 'x'.repeat(MAX_SAVE_CHARS + 1), 'volumineuse'],
  ])('refus : %s', (_, raw, message) => {
    const r = parseSave(raw, C);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain(message);
  });

  it('refus : champ corrompu (chemin indiqué), clé inconnue, autre affaire', () => {
    const s = sample();
    const bad = parseSave({ ...s, elapsedMs: -5 }, C);
    expect(bad).toEqual({ ok: false, error: 'Sauvegarde corrompue (elapsedMs).' });
    const extra = parseSave({ ...s, triche: true }, C);
    expect(extra.ok).toBe(false);
    const other = parseSave({ ...s, caseId: 'autre-affaire' }, C);
    expect(other).toEqual({ ok: false, error: 'Cette sauvegarde appartient à une autre affaire.' });
  });

  it('retire les ids inconnus du contenu et les liste', () => {
    const s = sample();
    const raw = {
      ...s,
      unlocked: { ...s.unlocked, 'doc-supprime': 1 },
      read: { ...s.read, 'doc-supprime': 1 },
      searched: [...s.searched, 'kw-supprime', 'kw-marrel'],
      searchLog: [...s.searchLog, { query: 'x', keyword: 'kw-supprime', at: 1 }],
      visited: [...s.visited, 'lieu-supprime'],
      revealedSlots: ['case-supprimee'],
      tree: {
        ...s.tree,
        'case-supprimee': { given: 'A', family: 'B', portrait: null, occupation: null },
        'g1-lisbe': {
          given: 'Lisbé',
          family: 'Marrel',
          portrait: 'p-supprime',
          occupation: 'metier-supprime',
        },
      },
      locked: { ...s.locked, 'case-supprimee': 1, 'g2-mira': 2 },
      secrets: { 'secret-supprime': 1 },
      hintsUsed: { 'h-supprime': 1, 'h-tam-1': 2 },
      notebook: {
        pins: [
          ...s.notebook.pins,
          { kind: 'keyword', id: 'kw-supprime' },
          { kind: 'slot', id: 'g1-tam' },
        ],
        highlights: [
          ...s.notebook.highlights,
          { doc: 'doc-supprime', path: [0], start: 0, end: 1, color: 1 },
        ],
        notes: [
          ...s.notebook.notes,
          { id: 'n2', target: { kind: 'document', id: 'doc-supprime' }, text: 't', at: 1 },
        ],
      },
      ending: 'fin-supprimee',
    };
    const r = parseSave(raw, C);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.dropped).toEqual([
      'document:doc-supprime',
      'document:doc-supprime',
      'slot:case-supprimee',
      'portrait:p-supprime',
      'occupation:metier-supprime',
      'slot:case-supprimee',
      'locked:g2-mira',
      'keyword:kw-supprime',
      'pin:keyword:kw-supprime',
      'highlight:doc-supprime',
      'note-target:document:doc-supprime',
      'ending:fin-supprimee',
      'keyword:kw-supprime',
      'place:lieu-supprime',
      'slot:case-supprimee',
      'secret:secret-supprime',
      'hint:h-supprime',
    ]);
    expect(r.state.unlocked['doc-supprime']).toBeUndefined();
    expect(r.state.searched).toEqual(s.searched); // doublon et inconnu retirés
    expect(r.state.tree['g1-lisbe']).toEqual({
      given: 'Lisbé',
      family: 'Marrel',
      portrait: null,
      occupation: null,
    });
    expect(r.state.locked['g2-mira']).toBeUndefined();
    expect(r.state.searchLog.at(-1)?.keyword).toBeNull();
    expect(r.state.notebook.notes[1]).toEqual({ id: 'n2', text: 't', at: 1 });
    expect(r.state.ending).toBeNull();
    expect(r.state.hintsUsed).toEqual({ 'h-tam-1': 2 });
    expect(SaveStateSchema.safeParse(r.state).success).toBe(true);
  });

  it('répare : lu ⇒ débloqué, documents de départ, case pré-remplie, point fixe', () => {
    const s = start();
    const raw = {
      ...s,
      unlocked: {},
      read: { 'telegramme-juno': 5 },
      tree: {},
      locked: {},
      updatedAt: 7000,
    };
    const r = parseSave(raw, C);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.unlocked).toMatchObject({
      'telegramme-juno': 5,
      'lettre-notaire': s.createdAt,
      'photo-noces': s.createdAt,
      'note-juno': 7000, // point fixe
    });
    expect(r.state.locked).toEqual({ 'g0-ivo': 7000 });
    expect(r.state.revealedSlots).toEqual(['g2-juno']);
  });

  it('adopte l’empreinte et l’édition du contenu chargé (import démo → complet)', () => {
    const s = { ...start(), contentHash: '00000000', edition: 'demo' as const };
    const r = parseSave(s, C);
    expect(r.ok && r.state.contentHash).toBe('a1b2c3d4');
    expect(r.ok && r.state.edition).toBe('full');
  });

  it('borne les listes trop longues avant validation', () => {
    const s = start();
    const raw = {
      ...s,
      searchLog: Array.from({ length: SAVE_LIMITS.searchLog + 10 }, (_, i) => ({
        query: `q${i}`,
        keyword: null,
        at: i,
      })),
      notebook: {
        ...s.notebook,
        pins: Array.from({ length: SAVE_LIMITS.pins + 3 }, () => ({
          kind: 'document',
          id: 'lettre-notaire',
        })),
      },
    };
    const r = parseSave(raw, C);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.searchLog).toHaveLength(SAVE_LIMITS.searchLog);
    expect(r.state.searchLog[0]?.query).toBe('q10');
    expect(r.state.notebook.pins).toHaveLength(SAVE_LIMITS.pins);
  });
});

describe('migrateSave', () => {
  const v0: Record<string, unknown> = { schemaVersion: 0, old: true };
  const to1: Migration = (raw) => {
    const { old: _old, ...rest } = raw;
    return { ...rest, schemaVersion: 1, migrated: true };
  };

  it('applique la chaîne de migrations, sans muter l’entrée', () => {
    const frozen = deepFreeze({ ...v0 });
    expect(migrateSave(frozen, { 0: to1 })).toEqual({
      ok: true,
      raw: { schemaVersion: 1, migrated: true },
    });
    const to2: Migration = (raw) => ({ ...raw, schemaVersion: 2 });
    expect(migrateSave(frozen, { 0: to1, 1: to2 }, 2)).toMatchObject({
      ok: true,
      raw: { schemaVersion: 2 },
    });
  });

  it('refus : migration manquante, qui lève, ou incohérente', () => {
    expect(migrateSave(v0, {})).toEqual({
      ok: false,
      error: 'Aucune migration depuis la version 0.',
    });
    expect(
      migrateSave(v0, {
        0: () => {
          throw new Error('x');
        },
      }),
    ).toEqual({ ok: false, error: 'Migration depuis la version 0 impossible.' });
    expect(migrateSave(v0, { 0: (r) => ({ ...r, schemaVersion: 5 }) })).toEqual({
      ok: false,
      error: 'Migration depuis la version 0 incohérente.',
    });
    expect(migrateSave({ schemaVersion: 1.5 })).toMatchObject({ ok: false });
  });

  it('parseSave refuse une version ancienne sans migration connue', () => {
    expect(parseSave({ ...start(), schemaVersion: 0 }, C)).toEqual({
      ok: false,
      error: 'Aucune migration depuis la version 0.',
    });
  });
});

describe('parseSave après une vraie partie', () => {
  it('reprend une partie en cours et continue de jouer', () => {
    const s = play(start(), [open('lettre-notaire', 2000), find('marrel', 2100)]).state;
    const r = parseSave(JSON.parse(JSON.stringify(s)) as unknown, C);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const next = play(r.state, [open('registre-marrel', 3000)]);
    expect(next.state.read['registre-marrel']).toBe(3000);
  });
});

describe('parseSave : jamais d’établissement au chargement (GAME_DESIGN §7.4, R1)', () => {
  const ELDERS = ['g0-elna', 'g1-tam', 'g1-lisbe'];
  // Groupe rempli en validation manuelle (ou évaluation perdue) : juste, mais jamais évalué.
  const filled = () =>
    play(
      researched(),
      ELDERS.map((id, i) => fill(id, 12000 + i)),
      { validation: 'manual' },
    ).state;

  it('un groupe complet et juste reste non établi après chargement', () => {
    const s = filled();
    expect(s.locked).not.toHaveProperty('g0-elna');
    const r = parseSave(JSON.stringify(s), C);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    for (const id of ELDERS) expect(r.state.locked).not.toHaveProperty(id);
    expect(r.state.locked).toEqual(s.locked);
  });

  it('ni un groupe faux ou partiel ; seule la validation normale établit', () => {
    const s = filled();
    const wrong = { ...s, tree: { ...s.tree, 'g1-tam': { ...s.tree['g1-tam']!, given: 'Ivo' } } };
    const partial = {
      ...s,
      tree: { ...s.tree, 'g1-lisbe': { ...s.tree['g1-lisbe']!, given: '' } },
    };
    for (const state of [wrong, partial]) {
      const r = parseSave(JSON.stringify(state), C);
      expect(r.ok && Object.keys(r.state.locked)).toEqual(Object.keys(s.locked));
    }
    const loaded = parseSave(JSON.stringify(s), C);
    if (!loaded.ok) throw new Error(loaded.error);
    const after = play(loaded.state, [{ type: 'validate', at: 13000 }]).state;
    for (const id of ELDERS) expect(after.locked[id]).toBe(13000);
  });
});
