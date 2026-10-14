import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { CompiledCase } from '@arbre/contract';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { checkContentRoot, demoCanaries, findLeaks, type CheckResult } from '../src/check';
import type { RuleId } from '../src/issues';
import { isComplete } from '../src/load';
import { solveReport } from '../src/report';
import { hashAnswer } from '../src/shared';
import { bundleFor, compareCases } from '../src/build';
import { claimedGuess, personPortraits } from '../src/compile';
import { CLAIM_SOURCE, solve, type SolverModel } from '../src/solver';

const FIXTURE = resolve(import.meta.dirname, '../fixtures/mini');
const CASE = 'content/cases/mini';
const temps: string[] = [];

/** Copie la fixture, applique une modification, contrôle. */
async function checkWith(mutate: (root: string) => Promise<void>): Promise<CheckResult> {
  const root = await mkdtemp(join(tmpdir(), 'arbre-ct-'));
  temps.push(root);
  await cp(FIXTURE, root, { recursive: true });
  await mutate(root);
  return checkContentRoot(root);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON modifié librement par les tests
type Json = any;

async function editJson(root: string, file: string, fn: (j: Json) => void): Promise<void> {
  const path = join(root, CASE, file);
  const data = JSON.parse(await readFile(path, 'utf8'));
  fn(data);
  await writeFile(path, JSON.stringify(data));
}

async function editText(root: string, file: string, fn: (s: string) => string): Promise<void> {
  const path = join(root, file.startsWith('art/') ? '' : CASE, file);
  await writeFile(path, fn(await readFile(path, 'utf8')));
}

function errorsOf(r: CheckResult, rule: RuleId): string[] {
  return r.issues.errors
    .filter((i) => i.rule === rule)
    .map((i) => `${i.file}:${i.line ?? ''} ${i.message}`);
}

let base: CheckResult;
beforeAll(async () => {
  base = await checkContentRoot(FIXTURE);
});
afterAll(async () => {
  await Promise.all(temps.map((t) => rm(t, { recursive: true, force: true })));
});

describe('fixture mini', () => {
  it('passe les 11 règles sans erreur ni avertissement', () => {
    expect(base.issues.items).toEqual([]);
    expect(base.cases).toHaveLength(1);
  });

  it('compile les éditions complète et démo', () => {
    const c = base.cases[0]!;
    const full = c.full!.compiled;
    const demo = c.demo!.compiled;
    expect(full.format).toBe(1);
    expect(full.edition).toBe('full');
    expect(full.contentHash).toMatch(/^[0-9a-f]{8}$/);
    expect(demo.contentHash).not.toBe(full.contentHash);
    expect(Object.keys(full.documents)).toHaveLength(12);
    expect(Object.keys(full.slots)).toHaveLength(6);
    expect(Object.keys(full.endings).sort()).toEqual(['fin-arbre', 'fin-edda']);
    expect(full.endings['fin-arbre']!.title).toBe('L’arbre retrouvé');
    // Liens automatiques et index de recherche.
    expect(full.documents['intro']!.keywords).toEqual(['ancel-morvan', 'val-dormant']);
    expect(full.searchIndex['val dormant']).toBe('val-dormant');
    expect(full.keywords['val-dormant']).not.toHaveProperty('terms');
    // Liens de parenté entre cases.
    expect(full.slots['s-maren']!.parents).toEqual(['s-tomas', 's-lena']);
    expect(full.slots['s-ida']!.unions).toEqual(['s-ancel']);
    // Réponses hachées, variantes comprises.
    const ida = full.slots['s-ida']!.answer;
    expect(ida.family).toEqual([
      hashAnswer(full.salt, 's-ida', 'family', 'Brask'),
      hashAnswer(full.salt, 's-ida', 'family', 'morvan'),
    ]);
    expect(ida.portrait).toEqual([hashAnswer(full.salt, 's-ida', 'portrait', 'portrait-b')]);
    // Portraits inlinés, nettoyés, ids préfixés.
    const svg = full.portraits['portrait-a']!.svg;
    expect(svg).toMatch(/^<svg class="art"/);
    expect(svg).toContain('id="mini-portrait-a-tete"');
    expect(svg).toContain('url(#art-hatch)');
    // Candidats : prénoms et noms (leurre compris) lus dans les documents.
    expect(full.candidates.given).toEqual([
      'Ancel',
      'Edda',
      'Ida',
      'Léna',
      'Maren',
      'Oskar',
      'Tomas',
    ]);
    expect(full.candidates.family).toEqual(['Brask', 'Morvan', 'Solvig']);
    expect(c.full!.illustrations['illustrations/carte-val.svg']).toContain('mini-carte-val-cadre');
  });

  it('fins à sections et rapport final compilés', () => {
    const c = base.cases[0]!;
    const full = c.full!.compiled;
    const edda = full.endings['fin-edda']!;
    expect(edda.sections.map((x) => [x.label, x.title, x.when ?? null])).toEqual([
      [null, null, null],
      ['maren', 'La malle chez Maren', { answered: { question: 'heritier', option: 'maren' } }],
      ['oskar', 'La malle au moulin', { answered: { question: 'heritier', option: 'oskar' } }],
      ['commun', 'Épilogue', null],
    ]);
    // Un `## Titre` sans étiquette reste un titre dans la section courante.
    expect(edda.sections[2]!.body[1]).toEqual({
      t: 'h',
      level: 2,
      c: [{ t: 'text', v: 'Une note' }],
    });
    expect(full.endings['fin-arbre']!.sections).toHaveLength(1);
    expect(full.report.map((q) => q.id)).toEqual(['heritier', 'lettres']);
    // Démo : le rapport cite un secret hors démo → retiré.
    expect(c.demo!.compiled.report).toEqual([]);
  });

  it('compilation déterministe', async () => {
    const again = await checkContentRoot(FIXTURE);
    expect(again.cases[0]!.full!.compiled).toEqual(base.cases[0]!.full!.compiled);
  });

  it('démo physiquement réduite', () => {
    const demo = base.cases[0]!.demo!.compiled;
    expect(Object.keys(demo.documents).sort()).toEqual([
      'acte-mariage',
      'carte-postale',
      'intro',
      'lettre-ancel',
      'photo-bac',
      'photo-couple',
      'registre-val-dormant',
    ]);
    expect(Object.keys(demo.slots)).toEqual(['s-ancel', 's-ida', 's-tomas']);
    expect(demo.groups.map((g) => g.id)).toEqual(['aines']);
    expect(demo.endings).toEqual({});
    expect(demo.progression.secrets).toEqual([]);
    expect(demo.progression.unlocks).toEqual({
      'photo-couple': { read: 'acte-mariage' },
      'photo-bac': { read: 'carte-postale' },
    });
    // Mot-clé hors démo retiré, lien déroulé en texte.
    expect(demo.keywords['edda-brask']).toBeUndefined();
    expect(JSON.stringify(demo.documents['acte-mariage'])).not.toContain('edda-brask');
    expect(demo.hints.map((h) => h.id)).toEqual(['h-ida-1']);
    expect(demo.achievements.map((a) => a.id)).toEqual(['tout-trouve']);
    expect(Object.keys(demo.portraits).sort()).toEqual([
      'portrait-a',
      'portrait-b',
      'portrait-c',
      'portrait-d',
      'portrait-g',
    ]);
  });

  it('canaris : aucun texte hors démo dans le bundle démo', () => {
    const c = base.cases[0]!;
    const bundle = JSON.stringify(c.demo!.compiled);
    for (const s of [
      'Lettre de Maren',
      'moulin',
      'Rentrée',
      'La voix d’Edda',
      'Edda Brask ne cède pas',
    ]) {
      expect(bundle).not.toContain(s);
    }
    expect(demoCanaries(c.demo!, c.prep!)).toEqual([]);
    // Canari déclenché si un texte hors démo y est injecté.
    const tampered = structuredClone(c.demo!);
    tampered.compiled.meta.subtitle = 'Je relie toujours des registres pour la mairie.';
    expect(demoCanaries(tampered, c.prep!).join()).toMatch(/hors démo \(lettre-maren\)/);
  });

  it('aucune fuite : bibleNotes, liaison case → personne, réponses en clair', () => {
    const c = base.cases[0]!;
    for (const ed of [c.full!, c.demo!]) {
      const json = JSON.stringify(ed.compiled);
      expect(json).not.toContain('bibleNotes');
      expect(json).not.toContain('SECRET-BIBLE');
      expect(json).not.toContain('"person":');
      expect(findLeaks(ed.compiled, c.prep!.src)).toEqual([]);
    }
    const leaky = structuredClone(c.full!.compiled) as CompiledCase & { bibleNotes?: string };
    leaky.slots['s-ida']!.answer.given = ['Ida'];
    leaky.bibleNotes = 'x';
    const leaks = findLeaks(leaky, c.prep!.src).join('\n');
    expect(leaks).toMatch(/bibleNotes/);
    expect(leaks).toMatch(/non hachée/);
  });

  it('solveur : parcours complet, fins avec et sans négation', () => {
    const s = base.cases[0]!.solve!;
    expect(s.locked.size).toBe(6);
    expect([...s.endings.keys()].sort()).toEqual(['fin-arbre', 'fin-edda']);
    expect(s.endingsAtEnd).toEqual(['fin-arbre', 'fin-edda']);
    expect(s.reportCombinations).toBe(4);
    expect(s.endingAnswers.get('fin-edda')).toMatchObject({ lettres: 'garder' });
    expect(s.endingAnswers.get('fin-arbre')).toMatchObject({ lettres: 'bruler' });
    expect(solveReport(base)).toContain('`fin-edda` : `heritier` → `maren`, `lettres` → `garder`');
    expect(s.evidence.get('s-maren')!.portraitDocs).toEqual(['photo-fratrie']);
    expect(solveReport(base)).toContain('Établir `s-ancel`, `s-ida`, `s-tomas`');
  });
});

describe('règles de content:check (un cas rouge par règle)', () => {
  it('1 · schémas : clé inconnue, id ≠ nom de fichier', async () => {
    const r = await checkWith(async (root) => {
      await editJson(root, 'case.json', (j) => (j.inconnu = 1));
      await writeFile(
        join(root, 'content/world/places/autre-lieu.json'),
        JSON.stringify({ id: 'pas-pareil', name: 'X', kind: 'city', position: { x: 0, y: 0 } }),
      );
    });
    expect(errorsOf(r, 1).join('\n')).toMatch(/inconnu/);
    expect(errorsOf(r, 1).join('\n')).toMatch(/≠ nom de fichier/);
  });

  it('1 · brouillon : fichiers obligatoires absents = avertissement', async () => {
    const r = await checkWith((root) => rm(join(root, CASE, 'tree.json')));
    expect(r.issues.errors).toEqual([]);
    expect(r.issues.warnings[0]?.message).toMatch(/brouillon/);
    expect(isComplete(r.source.cases[0]!)).toBe(false);
  });

  it('2 · références : document inconnu, image absente', async () => {
    const r = await checkWith(async (root) => {
      await editJson(root, 'progression.json', (j) => j.start.push('inexistant'));
    });
    expect(errorsOf(r, 2).join('\n')).toMatch(/« inexistant »/);
  });

  it('3 · arbre : partition des groupes, parent né après l’enfant, cycle', async () => {
    const r = await checkWith(async (root) => {
      await editJson(root, 'tree.json', (j) => j.groups[0].slots.push('s-lena'));
      await editJson(root, 'family.json', (j) => {
        j.persons[0].born = '1950';
        j.persons[0].parents = ['maren-morvan', null];
      });
    });
    const e = errorsOf(r, 3).join('\n');
    expect(e).toMatch(/partitionner/);
    expect(e).toMatch(/pas né avant/);
    expect(e).toMatch(/cycle/);
  });

  it('4 · conditions : auto-dépendance', async () => {
    const r = await checkWith((root) =>
      editJson(root, 'progression.json', (j) => {
        j.unlocks['photo-bac'] = { read: 'photo-bac' };
      }),
    );
    expect(errorsOf(r, 4).join('\n')).toMatch(/« photo-bac » dépend de lui-même/);
  });

  it('4 · conditions : `not` hors fins et succès', async () => {
    const r = await checkWith((root) =>
      editJson(root, 'tree.json', (j) => (j.slots[4].revealedBy = { not: { read: 'intro' } })),
    );
    expect(errorsOf(r, 4).join('\n')).toMatch(/`not` interdit/);
  });

  it('5 · mots-clés : terme partagé entre deux mots-clés', async () => {
    const r = await checkWith((root) =>
      editJson(root, 'progression.json', (j) => j.keywords[1].terms.push('ancel morvan')),
    );
    expect(errorsOf(r, 5).join('\n')).toMatch(/partagé par « ancel-morvan » et « ida-brask »/);
  });

  it('5 · mots-clés : chevauchement, mot-clé jamais écrit', async () => {
    const r = await checkWith(async (root) => {
      await editJson(root, 'progression.json', (j) => {
        j.keywords.push({
          id: 'horlogerie',
          label: 'Horlogerie',
          kind: 'other',
          terms: ['Morvan, horloger'],
          results: [{ documents: ['intro'] }],
        });
        j.keywords.push({
          id: 'fantome',
          label: 'Fantôme',
          kind: 'other',
          terms: ['spectre bleu'],
          results: [{ documents: ['intro'] }],
        });
      });
    });
    const e = errorsOf(r, 5).join('\n');
    expect(e).toMatch(/chevauchement de liens/);
    expect(e).toMatch(/« fantome » absent de tout texte accessible/);
  });

  it('6 · solveur : fixture insoluble détectée (portrait jamais débloqué)', async () => {
    const r = await checkWith((root) =>
      editText(root, 'documents/photo-fratrie.md', (s) =>
        s.replace('reveals: { portraits: [portrait-e, portrait-f] }\n', ''),
      ),
    );
    const e = errorsOf(r, 6).join('\n');
    expect(e).toMatch(/case « s-maren » jamais établie : portrait jamais débloqué/);
    expect(e).toMatch(/fin « fin-arbre » inatteignable/);
    expect(e).toMatch(/aucune fin vraie à 100 %/);
  });

  it('6 · solveur : document inatteignable (déblocage circulaire)', async () => {
    const r = await checkWith((root) =>
      editJson(root, 'progression.json', (j) => {
        j.unlocks['lettre-maren'] = { read: 'annonce-moulin' };
      }),
    );
    expect(errorsOf(r, 6).join('\n')).toMatch(/lettre-maren.md: document inatteignable/);
  });

  it('7 · Markdown : HTML avec numéro de ligne, image inexistante', async () => {
    const r = await checkWith(async (root) => {
      await editText(root, 'documents/intro.md', (s) =>
        s.replace('Le notaire', 'Le <b>notaire</b>'),
      );
      await editText(
        root,
        'documents/registre-val-dormant.md',
        (s) => `${s}\n![Plan](illustrations/plan.svg)\n`,
      );
    });
    const e = errorsOf(r, 7);
    expect(e).toContain(`${CASE}/documents/intro.md:5 HTML brut interdit`);
    expect(e.join('\n')).toMatch(/image inexistante : illustrations\/plan.svg/);
  });

  it('8 · SVG : style=, couleur en dur, classe inconnue, viewBox de couche', async () => {
    const r = await checkWith(async (root) => {
      await editText(root, 'portraits/portrait-a.svg', (s) =>
        s.replace('class="paper"', 'class="rouge" style="fill:red" fill="#c00"'),
      );
      await editText(root, 'art/map/base.svg', (s) => s.replace('0 0 1500 1000', '0 0 1000 1000'));
    });
    const e = errorsOf(r, 8).join('\n');
    expect(e).toMatch(/style= interdit/);
    expect(e).toMatch(/couleur en dur/);
    expect(e).toMatch(/hors ART_CLASSES : rouge/);
    expect(e).toMatch(/viewBox/);
  });

  it('9 · budgets : portrait trop lourd', async () => {
    let seed = 1;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) % 1000) / 10;
    const paths = Array.from(
      { length: 4000 },
      () => `<path class="ink" d="M${rnd()} ${rnd()} L${rnd()} ${rnd()} L${rnd()} ${rnd()}"/>`,
    ).join('');
    const r = await checkWith((root) =>
      editText(root, 'portraits/portrait-c.svg', (s) => s.replace('</svg>', `${paths}</svg>`)),
    );
    expect(errorsOf(r, 9).join('\n')).toMatch(/portrait .* gzip > 25\.0 Ko/);
  });

  it('10 · démo : fin de démo inatteignable', async () => {
    const r = await checkWith((root) =>
      editJson(root, 'progression.json', (j) => {
        j.demo.documents = j.demo.documents.filter((d: string) => d !== 'carte-postale');
        j.demo.end = 'photo-bac';
      }),
    );
    const e = errorsOf(r, 10).join('\n');
    expect(e).toMatch(/document de fin « photo-bac » inatteignable/);
    expect(e).toMatch(/case « s-tomas » jamais établie/);
  });

  it('11 · fuite : portrait dont le texte alternatif nomme la personne', async () => {
    const r = await checkWith((root) =>
      editJson(root, 'family.json', (j) => (j.portraits[0].alt = 'Ancel Morvan en col cassé')),
    );
    expect(errorsOf(r, 11).join('\n')).toMatch(/révèle le nom de « ancel-morvan »/);
  });
});

describe('rapport final et sections (règles)', () => {
  it('1 · ids de question et d’option uniques', async () => {
    const r = await checkWith((root) =>
      editJson(root, 'progression.json', (j) => {
        j.report.push({ ...j.report[0] });
        j.report[1].options[1].id = 'bruler';
      }),
    );
    const e = errorsOf(r, 1).join('\n');
    expect(e).toMatch(/question du rapport « heritier » en double/);
    expect(e).toMatch(/option de la question lettres « bruler » en double/);
  });

  it('1 · au moins deux options', async () => {
    const r = await checkWith((root) =>
      editJson(root, 'progression.json', (j) => j.report[0].options.pop()),
    );
    expect(errorsOf(r, 1).join('\n')).toMatch(/report\.0\.options/);
  });

  it('2 · answered vers une question ou une option inconnue', async () => {
    const r = await checkWith((root) =>
      editJson(root, 'progression.json', (j) => {
        j.endings[0].when.all[1].any[1].answered.option = 'enterrer';
        j.endings[1].when.all[2].answered.question = 'inconnue';
      }),
    );
    const e = errorsOf(r, 2).join('\n');
    expect(e).toMatch(/option inconnue « enterrer » pour la question « lettres »/);
    expect(e).toMatch(/question du rapport \(condition answered\) inconnu\(e\) : « inconnue »/);
  });

  it('2 · sections : étiquette absente de progression, clé sans titre', async () => {
    const r = await checkWith(async (root) => {
      await editText(root, 'endings/fin-edda.md', (s) => s.replace('[oskar]', '[autre]'));
    });
    const e = errorsOf(r, 2).join('\n');
    expect(e).toMatch(/section \[autre\] absente de progression\.json/);
    expect(e).toMatch(/section \[oskar\] absente de endings\/fin-edda\.md/);
  });

  it('4 · answered interdit dans les déblocages, autorisé dans askedWhen et les sections', async () => {
    const r = await checkWith((root) =>
      editJson(root, 'progression.json', (j) => {
        j.unlocks['photo-bac'] = { answered: { question: 'heritier', option: 'maren' } };
      }),
    );
    expect(errorsOf(r, 4).join('\n')).toMatch(/`answered` interdit/);
    // La fixture elle-même utilise `answered` et `not` dans les fins, sections et askedWhen.
    expect(base.issues.errors).toEqual([]);
  });

  it('4 · askedWhen qui dépend de sa propre réponse', async () => {
    const r = await checkWith((root) =>
      editJson(root, 'progression.json', (j) => {
        j.report[0].askedWhen = { not: { answered: { question: 'heritier', option: 'maren' } } };
      }),
    );
    expect(errorsOf(r, 4).join('\n')).toMatch(
      /question du rapport « heritier » dépend de lui-même/,
    );
  });

  it('6 · fin inatteignable quelle que soit la combinaison de réponses', async () => {
    const r = await checkWith((root) =>
      editJson(root, 'progression.json', (j) => {
        j.report[1].options[1].availableWhen = { lockedCount: { gte: 99 } };
      }),
    );
    expect(errorsOf(r, 6).join('\n')).toMatch(/fin « fin-edda » inatteignable/);
  });
});

// ---------------------------------------------------------------- cases revendiquées (affaire 2)

const CLAIM_FIXTURE = resolve(import.meta.dirname, '../fixtures/claim');
const CLAIM_CASE = 'content/cases/claim';

/** Copie la fixture `claim`, applique une modification, contrôle. */
async function checkClaimWith(
  mutate: (
    edit: (file: string, fn: (j: Json) => void) => Promise<void>,
    root: string,
  ) => Promise<void>,
): Promise<CheckResult> {
  const root = await mkdtemp(join(tmpdir(), 'arbre-ct-claim-'));
  temps.push(root);
  await cp(CLAIM_FIXTURE, root, { recursive: true });
  const edit = async (file: string, fn: (j: Json) => void) => {
    const path = join(root, CLAIM_CASE, file);
    const data = JSON.parse(await readFile(path, 'utf8'));
    fn(data);
    await writeFile(path, JSON.stringify(data));
  };
  await mutate(edit, root);
  return checkContentRoot(root);
}

async function editClaimText(root: string, file: string, fn: (s: string) => string) {
  const path = join(root, CLAIM_CASE, file);
  await writeFile(path, fn(await readFile(path, 'utf8')));
}

function warningsOf(r: CheckResult, rule: RuleId): string[] {
  return r.issues.warnings.filter((i) => i.rule === rule).map((i) => `${i.file} ${i.message}`);
}

const slotClaim = (j: Json, id: string) => j.slots.find((s: Json) => s.id === id);

describe('case revendiquée (fixture claim)', () => {
  let claimBase: CheckResult;
  beforeAll(async () => {
    claimBase = await checkContentRoot(CLAIM_FIXTURE);
  });

  it('passe les 11 règles sans erreur ni avertissement', () => {
    expect(claimBase.issues.items).toEqual([]);
  });

  it('compile claimedGuess, distinct de prefilledGuess, et les visages en liste', () => {
    const full = claimBase.cases[0]!.full!.compiled;
    const tomas = full.slots['s-tomas']!;
    expect(tomas.claimedGuess).toEqual({
      given: 'Tomas',
      family: 'Morvan',
      portrait: 'portrait-f',
      occupation: 'meunier',
    });
    expect(tomas.prefilled).toBeUndefined();
    expect(tomas.prefilledGuess).toBeUndefined();
    expect('claim' in tomas).toBe(false);
    expect(tomas.answer.portrait).toEqual([
      hashAnswer(full.salt, 's-tomas', 'portrait', 'portrait-c'),
      hashAnswer(full.salt, 's-tomas', 'portrait', 'portrait-h'),
    ]);
    expect(full.slots['s-ida']!.claimedGuess).toBeUndefined();
    expect(full.candidates.given).toContain('Tomas');
    expect(full.candidates.family).toContain('Morvan');
  });

  it('champs absents de la déclaration : vides ou nuls', () => {
    expect(claimedGuess({ family: 'Morvan' })).toEqual({
      given: '',
      family: 'Morvan',
      portrait: null,
      occupation: null,
    });
    expect(personPortraits({ portrait: 'a', altPortraits: ['b', 'a'] })).toEqual(['a', 'b']);
  });

  it('démo : visage et métier déclarés embarqués, même hors pièces de la démo', () => {
    const demo = claimBase.cases[0]!.demo!.compiled;
    expect(demo.slots['s-tomas']!.claimedGuess?.portrait).toBe('portrait-f');
    expect(Object.keys(demo.portraits)).toContain('portrait-f');
    expect(Object.keys(demo.occupations)).toContain('meunier');
    expect(Object.keys(demo.portraits)).not.toContain('portrait-e');
  });

  it('solveur : la case revendiquée part vide et s’établit par les pièces', () => {
    const s = claimBase.cases[0]!.solve!;
    expect(s.locked.size).toBe(6);
    const ev = s.evidence.get('s-tomas')!;
    expect(ev.step).toBeGreaterThan(0);
    expect(ev.portraitDocs).toEqual(['photo-bac']);
    // Le métier déclaré (meunier) est disponible d'emblée pour la case qui le porte vraiment.
    expect(s.evidence.get('s-oskar')!.occupationFrom).toContain(CLAIM_SOURCE);
    expect(solveReport(claimBase)).toContain('disponibles d’emblée (`(revendication)`)');
  });

  it('solveur : une déclaration ne prouve pas les noms (case bloquée sans pièces)', () => {
    const model: SolverModel = {
      documents: new Map([
        [
          'a',
          {
            id: 'a',
            optional: false,
            keywords: [],
            norm: ' tomas morvan ',
            portraits: [],
            occupations: [],
          },
        ],
      ]),
      start: ['a'],
      unlocks: {},
      keywords: new Map(),
      places: new Map(),
      slots: new Map([
        [
          's',
          {
            id: 's',
            prefilled: false,
            claimed: true,
            given: ['tomas'],
            family: ['morvan'],
            portraits: ['p', 'p-vieux'],
            occupation: 'o',
          },
        ],
      ]),
      claimedPortraits: new Set(['p-vieux']),
      claimedOccupations: new Set(['o']),
      groups: new Map([['g', { slots: ['s'], threshold: 3 }]]),
      occupationsUnlock: {},
      secrets: new Map(),
      endings: new Map(),
      report: [],
    };
    const blocked = solve(model);
    expect(blocked.locked.size).toBe(0);
    expect(blocked.blockedSlots.get('s')).toEqual([
      'prénom lu dans 1 document(s) (< 2)',
      'nom lu dans 1 document(s) (< 2)',
    ]);
    const docs = new Map(model.documents);
    docs.set('b', { ...docs.get('a')!, id: 'b' });
    const ok = solve({ ...model, documents: docs, start: ['a', 'b'] });
    expect(ok.locked.has('s')).toBe(true);
    // Visage d'un autre âge, disponible par la déclaration seulement.
    expect(ok.evidence.get('s')!.portraitDocs).toEqual([CLAIM_SOURCE]);
  });
});

describe('règles des cases revendiquées', () => {
  it('3 · déclaration juste sur ses 4 champs', async () => {
    const r = await checkClaimWith((edit) =>
      edit('tree.json', (j) => {
        // Graphie variante et autre âge : toujours juste.
        slotClaim(j, 's-tomas').claim = {
          given: 'THOMAS',
          family: 'Morvan',
          portrait: 'portrait-h',
          occupation: 'passeur',
        };
      }),
    );
    expect(errorsOf(r, 3).join('\n')).toMatch(/juste sur ses 4 champs/);
  });

  it('3 · déclaration incomplète mais juste sur ses champs : acceptée', async () => {
    const r = await checkClaimWith((edit) =>
      edit('tree.json', (j) => {
        slotClaim(j, 's-tomas').claim = {
          given: 'Tomas',
          family: 'Morvan',
          portrait: 'portrait-c',
        };
      }),
    );
    expect(r.issues.errors).toEqual([]);
  });

  it('3 · revendication sur une case cachée ou pré-remplie', async () => {
    const r = await checkClaimWith((edit) =>
      edit('tree.json', (j) => {
        slotClaim(j, 's-maren').claim = { given: 'Ida' };
        slotClaim(j, 's-ancel').prefilled = true;
        slotClaim(j, 's-ancel').claim = { given: 'Ida' };
      }),
    );
    const e = r.issues.errors.map((i) => i.message).join('\n');
    expect(e).toMatch(/visible d'emblée/);
    expect(e).toMatch(/exclusifs/);
  });

  it('3 · une case revendiquée doit être dans un groupe ; pré-remplie toujours exclue', async () => {
    const r = await checkClaimWith((edit) =>
      edit('tree.json', (j) => {
        j.groups[0].slots = j.groups[0].slots.filter((s: string) => s !== 's-tomas');
      }),
    );
    expect(errorsOf(r, 3).join('\n')).toMatch(/« s-tomas » dans 0 groupe/);
  });

  it('2 · visage ou métier déclaré inconnu, nom variante d’aucune personne', async () => {
    const r = await checkClaimWith((edit) =>
      edit('tree.json', (j) => {
        slotClaim(j, 's-tomas').claim = {
          given: 'Gaspard',
          family: 'Inconnu',
          portrait: 'portrait-z',
          occupation: 'cordier',
        };
      }),
    );
    const e = errorsOf(r, 2).join('\n');
    expect(e).toMatch(/visage déclaré de la case s-tomas inconnu\(e\) : « portrait-z »/);
    expect(e).toMatch(/métier déclaré de la case s-tomas inconnu\(e\) : « cordier »/);
    expect(e).toMatch(/prénom déclaré « Gaspard » : variante d'aucune personne/);
    expect(e).toMatch(/nom déclaré « Inconnu » : variante d'aucune personne/);
  });

  it('6 · avertissement : visage juste accessible seulement par une déclaration', async () => {
    const r = await checkClaimWith(async (edit, root) => {
      await edit('tree.json', (j) => (slotClaim(j, 's-tomas').claim.portrait = 'portrait-c'));
      await editClaimText(root, 'documents/photo-bac.md', (s) =>
        s.replace('[portrait-c, portrait-d]', '[portrait-d]'),
      );
      await editClaimText(root, 'documents/photo-fratrie.md', (s) =>
        s.replace(', portrait-h]', ']'),
      );
    });
    expect(r.issues.errors).toEqual([]);
    expect(warningsOf(r, 6).join('\n')).toMatch(
      /case « s-tomas » : son visage juste n'est accessible que par une déclaration/,
    );
    expect(r.cases[0]!.solve!.evidence.get('s-tomas')!.portraitDocs).toEqual([CLAIM_SOURCE]);
  });

  it('6 · avertissement : valeur déclarée lue dans aucune pièce de départ', async () => {
    const r = await checkClaimWith((edit) =>
      edit('tree.json', (j) => (slotClaim(j, 's-tomas').claim.family = 'Brask')),
    );
    expect(warningsOf(r, 6).join('\n')).toMatch(/« Brask » lue dans aucune pièce de départ/);
  });

  it('2 · altPortraits : référence inconnue ; 11 · un autre âge ne nomme pas la personne', async () => {
    const unknown = await checkClaimWith((edit) =>
      edit('family.json', (j) => j.persons[2].altPortraits.push('portrait-z')),
    );
    expect(errorsOf(unknown, 2).join('\n')).toMatch(/autre visage de tomas-morvan.*« portrait-z »/);
    const named = await checkClaimWith((edit) =>
      edit('family.json', (j) => (j.portraits[7].alt = 'Tomas Morvan, vers 1930')),
    );
    expect(errorsOf(named, 11).join('\n')).toMatch(
      /portrait « portrait-h » : .*révèle le nom de « tomas-morvan »/,
    );
  });
});

describe('contrôles entre affaires et ordre', () => {
  /** Racine avec les deux fixtures (`mini` et `claim`). */
  async function bothWith(
    mutate: (root: string) => Promise<void> = async () => {},
  ): Promise<CheckResult> {
    const root = await mkdtemp(join(tmpdir(), 'arbre-ct-multi-'));
    temps.push(root);
    await cp(FIXTURE, root, { recursive: true });
    await cp(join(CLAIM_FIXTURE, CLAIM_CASE), join(root, CLAIM_CASE), { recursive: true });
    await mutate(root);
    return checkContentRoot(root);
  }
  const editIn = async (root: string, caseDir: string, file: string, fn: (j: Json) => void) => {
    const path = join(root, caseDir, file);
    const data = JSON.parse(await readFile(path, 'utf8'));
    fn(data);
    await writeFile(path, JSON.stringify(data));
  };

  it('1 · portraits (id et fichier), succès et order dupliqués entre affaires', async () => {
    const r = await bothWith(async (root) => {
      await editIn(root, CLAIM_CASE, 'achievements.json', (j) => (j[0].id = 'tout-trouve'));
      await editIn(root, CASE, 'case.json', (j) => (j.order = 2));
    });
    const e = errorsOf(r, 1).join('\n');
    expect(e).toMatch(
      /content\/cases\/claim\/family.json:? portrait « portrait-a » déjà utilisé par content\/cases\/mini/,
    );
    expect(e).toMatch(/fichier de portrait « portraits\/portrait-a\.svg » déjà utilisé/);
    expect(e).toMatch(/succès « tout-trouve » déjà utilisé par content\/cases\/mini/);
    expect(e).toMatch(/succès « tout-trouve » déjà utilisé par content\/cases\/claim/);
    expect(e).toMatch(/rang \(order\) « 2 » déjà utilisé/);
    expect(e).not.toMatch(/discretion/);
  });

  it('build : affaires triées par (order ?? ∞, id)', async () => {
    // claim (order 2) avant mini (sans order), bien que « claim » < « mini » de toute façon :
    // on donne à mini un order 1 pour vérifier que order prime sur l'id.
    const withOrder = await bothWith((root) =>
      editIn(root, CASE, 'case.json', (j) => (j.order = 1)),
    );
    expect(bundleFor(withOrder, 'full').cases.map((c) => c.id)).toEqual(['mini', 'claim']);
    expect(bundleFor(withOrder, 'demo').cases.map((c) => c.id)).toEqual(['mini', 'claim']);
    const sorted = [
      { id: 'b' },
      { id: 'z', meta: { order: 2 } },
      { id: 'a' },
      { id: 'y', meta: { order: 1 } },
    ].sort(compareCases);
    expect(sorted.map((c) => c.id)).toEqual(['y', 'z', 'a', 'b']);
  });
});
