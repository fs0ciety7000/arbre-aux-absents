/**
 * Indépendance des sauvegardes vis-à-vis de la langue (docs/i18n/PLAN.md D4, D5) : une partie
 * commencée en français se charge et se valide à l'identique sur le compilé anglais, et les
 * surlignages gardent leur langue.
 */
import type { CompiledCase, Highlight, SaveState } from '@arbre/contract';
import { SaveStateSchema } from '@arbre/contract';
import { describe, expect, it } from 'vitest';
import { applyAction, parseSave, progress, search, summarize, validate } from '../src';
import { fixtureCaseEn } from './fixtures/case-en';
import {
  AINES_RESEARCH,
  C,
  CADETS_RESEARCH,
  clone,
  deepFreeze,
  fill,
  find,
  open,
  play,
  researched,
  start,
} from './helpers';

const EN: CompiledCase = deepFreeze(clone(fixtureCaseEn));

describe('fixture anglaise', () => {
  it('même structure que le français : seuls la langue et les textes changent', () => {
    expect(C.locale).toBe('fr');
    expect(EN.locale).toBe('en');
    expect(EN.id).toBe(C.id);
    expect(EN.contentHash).toBe(C.contentHash);
    expect(EN.salt).toBe(C.salt);
    expect(EN.meta.title).not.toBe(C.meta.title);
    expect(Object.keys(EN.documents)).toEqual(Object.keys(C.documents));
    for (const [id, slot] of Object.entries(C.slots)) expect(EN.slots[id]).toEqual(slot);
    expect(EN.groups.map((g) => g.slots)).toEqual(C.groups.map((g) => g.slots));
    expect(EN.progression.unlocks).toEqual(C.progression.unlocks);
    expect(EN.candidates).toEqual(C.candidates);
  });
});

/** États variés : début, recherches, groupe juste non validé, groupe faux, partie avancée. */
function states(): Array<[string, SaveState]> {
  const s0 = start();
  const r = researched();
  const filled = play(
    r,
    ['g0-elna', 'g1-tam', 'g1-lisbe'].map((id, i) => fill(id, 12000 + i)),
    {
      validation: 'manual',
    },
  ).state;
  const wrong = play(r, [fill('g1-tam', 12000, { given: 'Ivo' })], {
    validation: 'manual',
  }).state;
  const locked = play(
    r,
    ['g0-elna', 'g1-tam', 'g1-lisbe'].map((id, i) => fill(id, 12000 + i)),
  ).state;
  const cadets = play(
    locked,
    [...CADETS_RESEARCH, ...['g1-oren', 'g2-cael'].map((id, i) => fill(id, 30000 + i))],
    { validation: 'manual' },
  ).state;
  return [
    ['début', s0],
    ['recherches', r],
    ['aînés justes, non validés', filled],
    ['case fausse', wrong],
    ['aînés établis', locked],
    ['cadets partiels', cadets],
  ];
}

describe('sauvegarde chargée sur le compilé de l’autre langue', () => {
  it.each(states())('%s : même état, rien de retiré, même validate et même progression', (_, s) => {
    const json = JSON.stringify(s);
    const fr = parseSave(json, C);
    const en = parseSave(json, EN);
    expect(fr.ok && en.ok).toBe(true);
    if (!fr.ok || !en.ok) return;
    expect(en.dropped).toEqual([]);
    expect(en.state).toEqual(fr.state);
    expect(validate(en.state, EN)).toEqual(validate(fr.state, C));
    expect(progress(en.state, EN)).toEqual(progress(fr.state, C));
  });

  it('une partie aux aînés justes se valide pareil dans les deux langues', () => {
    const s = states()[2]![1];
    const r = validate(s, EN);
    expect(r).toEqual(validate(s, C));
    expect(r.groups).toEqual(['grp-aines']);
  });

  it('la partie continue en anglais : termes anglais, mots-clés et ids identiques', () => {
    const s = researched();
    expect(search('school', s, EN).keyword).toBe('kw-ecole');
    expect(search('École', s, C).keyword).toBe('kw-ecole');
    const loaded = parseSave(JSON.stringify(s), EN);
    if (!loaded.ok) throw new Error(loaded.error);
    const next = play(loaded.state, [find('Port-Lanne school', 13000)], {}, EN).state;
    expect(next.searched).toContain('kw-ecole');
    // Repassée en français : toujours valide, rien de perdu.
    const back = parseSave(JSON.stringify(next), C);
    expect(back.ok && back.dropped).toEqual([]);
  });

  it('les actions donnent le même état dans les deux langues (termes propres à chaque langue)', () => {
    const actions = (school: string) =>
      AINES_RESEARCH.map((a) =>
        a.type === 'search' && a.query === 'École' ? find(school, a.at) : a,
      ).concat([fill('g1-tam', 12000), open('lettre-lisbe', 12100)]);
    const fr = play(start(), actions('École')).state;
    const en = play(start(), actions('school'), {}, EN).state;
    // Seule la requête tapée diffère (journal de recherche) ; tout le reste est identique.
    expect({ ...en, searchLog: [] }).toEqual({ ...fr, searchLog: [] });
    expect(en.searchLog.map((e) => e.keyword)).toEqual(fr.searchLog.map((e) => e.keyword));
    expect(en.read['lettre-lisbe']).toBe(11000);
  });
});

describe('surlignages : langue acceptée et conservée (D5)', () => {
  const H = (lang?: Highlight['lang']): Highlight => ({
    doc: 'lettre-notaire',
    path: [0],
    start: 0,
    end: 6,
    color: 3,
    ...(lang ? { lang } : {}),
  });

  it('`lang` est conservé ; absent reste absent', () => {
    const s = play(researched(), [
      { type: 'highlight', h: H('en'), at: 12000 },
      { type: 'highlight', h: H(), at: 12001 },
    ]).state;
    expect(s.notebook.highlights).toEqual([H('en'), H()]);
    expect('lang' in s.notebook.highlights[1]!).toBe(false);
  });

  it('même intervalle dans deux langues : pas un doublon ; même langue : doublon', () => {
    const s = play(researched(), [
      { type: 'highlight', h: H('fr'), at: 12000 },
      { type: 'highlight', h: H('en'), at: 12001 },
      { type: 'highlight', h: H(), at: 12002 }, // absent = fr : doublon de H('fr')
      { type: 'highlight', h: H('en'), at: 12003 },
    ]).state;
    expect(s.notebook.highlights).toEqual([H('fr'), H('en')]);
  });

  it('langue inconnue refusée', () => {
    const t = applyAction(
      researched(),
      { type: 'highlight', h: { ...H(), lang: 'de' } as unknown as Highlight, at: 12000 },
      C,
    );
    expect(t.events).toEqual([{ type: 'rejected', reason: 'notAvailable' }]);
  });

  it('aller-retour de sauvegarde avec `lang`, dans les deux langues, sans rien retirer', () => {
    const s = play(
      researched(),
      [
        { type: 'highlight', h: H('en'), at: 12000 },
        { type: 'highlight', h: H('fr'), at: 12001 },
        { type: 'highlight', h: { ...H(), start: 7, end: 9 }, at: 12002 },
      ],
      {},
      EN,
    ).state;
    expect(SaveStateSchema.safeParse(s).success).toBe(true);
    for (const c of [C, EN]) {
      const r = parseSave(JSON.stringify(s), c);
      expect(r).toEqual({ ok: true, state: s, dropped: [] });
    }
  });
});

describe('summarize', () => {
  it('renseigne caseId (depuis la sauvegarde) et le titre de la langue', () => {
    const s = researched();
    expect(summarize(s, C)).toMatchObject({
      slot: 'slot-1',
      caseId: 'affaire-test',
      caseTitle: 'Les Marrel de Port-Lanne',
    });
    const en = summarize(s, EN);
    expect(en.caseId).toBe('affaire-test');
    expect(en.caseTitle).toBe('The Marrels of Port-Lanne');
    expect(en.progress).toBe(summarize(s, C).progress);
  });
});
