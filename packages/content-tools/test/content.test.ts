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
    expect(ida.portrait).toBe(hashAnswer(full.salt, 's-ida', 'portrait', 'portrait-b'));
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
    expect(s.endingsAtEnd).toEqual(['fin-edda']);
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
