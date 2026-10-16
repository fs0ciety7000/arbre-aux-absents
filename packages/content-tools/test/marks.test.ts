import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { BlockSchema, type DocumentFrontmatter } from '@arbre/contract';
import { afterAll, describe, expect, it } from 'vitest';
import { checkContentRoot, type CheckResult } from '../src/check';
import type { RuleId } from '../src/issues';
import { collectMarks, parseMarkdown } from '../src/markdown';
import {
  MARK_ALT_MAX,
  markAltProblems,
  markDescriptionProblems,
  isTemplateDescription,
} from '../src/marks';
import { withMarks } from '../src/prepare';
import { structuralProjection } from '../src/projection';

// Affaire 3, lot B (docs/game/AFFAIRE-3.md §8) : ::mark, types des cases, recording, gabarit.

describe('::mark — parseur', () => {
  it('inline dans un paragraphe, une signature, un tableau ; schéma du contrat', () => {
    const r = parseMarkdown(
      'Gervais ::mark[lg-m-y] a fait sa marque.\n\n::signature[Blaise ::mark[portrait-a1]]\n\n| Nom | Marque |\n| --- | --- |\n| Josse | ::mark[lg-m-y-g] |',
    );
    expect(r.errors).toEqual([]);
    for (const b of r.blocks) expect(BlockSchema.safeParse(b).success).toBe(true);
    expect(r.blocks[0]).toEqual({
      t: 'p',
      c: [
        { t: 'text', v: 'Gervais ' },
        { t: 'mark', portrait: 'lg-m-y' },
        { t: 'text', v: ' a fait sa marque.' },
      ],
    });
    expect(r.blocks[1]).toEqual({
      t: 'signature',
      c: [
        { t: 'text', v: 'Blaise ' },
        { t: 'mark', portrait: 'portrait-a1' },
      ],
    });
    expect(collectMarks(r.blocks)).toEqual(['lg-m-y', 'portrait-a1', 'lg-m-y-g']);
  });

  it('dans l’emphase et une citation ; répétitions gardées dans l’ordre', () => {
    const r = parseMarkdown('> *::mark[b-1]* puis **::mark[a-1]** et ::hand[::mark[b-1]]');
    expect(r.errors).toEqual([]);
    expect(collectMarks(r.blocks)).toEqual(['b-1', 'a-1', 'b-1']);
  });

  it('erreurs : id invalide ou vide, non refermé, dans un lien [[…]]', () => {
    const msg = (s: string) => parseMarkdown(s).errors.map((e) => e.message);
    expect(msg('::mark[Pas Un Id]')[0]).toMatch(/identifiant de portrait/);
    expect(msg('::mark[]')[0]).toMatch(/identifiant de portrait/);
    expect(msg('Texte ::mark[lg-m-y')[0]).toMatch(/non refermé/);
    expect(msg('[[Blaise ::mark[lg-m-y-d]|blaise]]')[0]).toMatch(/interdit dans un lien/);
  });

  it('withMarks : union, frontmatter d’abord, sans doublon ; inchangé sans marque', () => {
    const fm: DocumentFrontmatter = { kind: 'register', title: 'R', reveals: { portraits: ['a'] } };
    expect(withMarks(fm, [])).toBe(fm);
    expect(withMarks(fm, ['b', 'a', 'c']).reveals?.portraits).toEqual(['a', 'b', 'c']);
    const bare: DocumentFrontmatter = { kind: 'object', title: 'O' };
    expect(withMarks(bare, ['x']).reveals).toEqual({ portraits: ['x'] });
  });
});

describe('gabarit de description (§1.6)', () => {
  it('accepte les descriptions de la bible (09-marques §4, §5)', () => {
    for (const alt of [
      'Fourche ; pied lisse',
      'Fourche ; pied lisse ; talon : petit Œil',
      'Fourche ; pied : entaille à gauche ; talon : petite Potence',
      'Potence ; pied lisse ; un grain',
      'Potence ; pied lisse ; deux grains',
      'Œil ; pied : entaille à gauche, puis entaille à gauche',
      'Flèche ; pied barré',
      'Flèche ; pied barré, puis entaille à gauche',
      'Flèche ; pied barré ; talon : petite Potence',
      'Potence ; pied : entaille à gauche ; un grain',
      'Fourche ; pied : lisse',
      'Fourche\u00a0; pied\u202f: entaille à droite',
    ]) {
      expect(markDescriptionProblems(alt), alt).toEqual([]);
    }
  });

  it('refuse vocabulaire hors liste, ordre faux, lisse suivi d’un signe, 3 entailles', () => {
    expect(markDescriptionProblems('Trident ; pied lisse')[0]).toMatch(/tête « Trident »/);
    expect(markDescriptionProblems('Fourche ; pied : encoche à gauche')[0]).toMatch(/encoche/);
    expect(markDescriptionProblems('Fourche ; un grain ; pied lisse')[0]).toMatch(/hors d'ordre/);
    expect(markDescriptionProblems('Fourche ; talon : petite Fourche ; un grain')[0]).toMatch(
      /hors d'ordre/,
    );
    expect(markDescriptionProblems('Fourche ; pied lisse, puis entaille à gauche')[0]).toMatch(
      /suivi d'autres signes/,
    );
    expect(
      markDescriptionProblems(
        'Œil ; pied : entaille à gauche, puis entaille à gauche, puis entaille à droite',
      ),
    ).toContain('3 entailles (2 au plus)');
    expect(markDescriptionProblems('Fourche ; talon : grande Potence')[0]).toMatch(/talon/);
    expect(markDescriptionProblems('Fourche ; trois grains')[0]).toMatch(/inattendu/);
  });

  it('anglais (vocabulaire provisoire) ; noms insulaires français admis', () => {
    expect(markDescriptionProblems('Fork ; foot: notch on the right', 'en')).toEqual([]);
    expect(markDescriptionProblems('Fourche ; foot plain ; heel: small Eye', 'en')).toEqual([]);
    expect(markDescriptionProblems('Fork ; pied lisse', 'en')).not.toEqual([]);
  });

  it('longueur ≤ 110 ; description libre (sans « ; ») = avertissement', () => {
    const long = `Fourche ; pied : entaille à gauche${', puis entaille à gauche'.repeat(4)}`;
    expect(long.length).toBeGreaterThan(MARK_ALT_MAX);
    expect(markAltProblems(long).errors.join()).toMatch(/caractères/);
    expect(isTemplateDescription('Pied barré, sans tête (marque de mer)')).toBe(false);
    const free = markAltProblems('Pied barré, sans tête (marque de mer)');
    expect(free.errors).toEqual([]);
    expect(free.warnings[0]).toMatch(/description libre/);
  });
});

// ------------------------------------------------------------------ intégration (fixture mini)

const FIXTURE = resolve(import.meta.dirname, '../fixtures/mini');
const CASE = 'content/cases/mini';
const temps: string[] = [];
afterAll(async () => {
  await Promise.all(temps.map((t) => rm(t, { recursive: true, force: true })));
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON modifié librement par les tests
type Json = any;

async function editJson(root: string, file: string, fn: (j: Json) => void): Promise<void> {
  const path = join(root, CASE, file);
  const data = JSON.parse(await readFile(path, 'utf8'));
  fn(data);
  await writeFile(path, JSON.stringify(data));
}

async function editText(root: string, file: string, fn: (s: string) => string): Promise<void> {
  const path = join(root, CASE, file);
  await writeFile(path, fn(await readFile(path, 'utf8')));
}

/**
 * Fixture mini à marques : Ancel (s-ancel) a un champ Marque ; sa marque `portrait-a` n'est plus
 * dans le frontmatter de la photo mais dessinée dans la signature de sa lettre (FR et EN) ;
 * `portrait-g` (Edda, leurre hors arbre) devient une seconde marque.
 */
async function withMarkFixture(root: string): Promise<void> {
  await editJson(root, 'family.json', (j) => {
    j.portraits[0] = { ...j.portraits[0], kind: 'mark', alt: 'Fourche ; pied lisse' };
    j.portraits[6] = { ...j.portraits[6], kind: 'mark', alt: 'Fourche ; pied : entaille à gauche' };
  });
  await editJson(root, 'locales/en/family.json', (j) => {
    j.portraits['portrait-a'] = { alt: 'Fork ; foot plain' };
    j.portraits['portrait-g'] = { alt: 'Fork ; foot: notch on the left' };
  });
  await editJson(root, 'tree.json', (j) => {
    j.slots[0].portraitKind = 'mark';
  });
  await editText(root, 'documents/photo-couple.md', (s) =>
    s.replace(
      'portraits: [portrait-a, portrait-b, portrait-g]',
      'portraits: [portrait-b, portrait-g]',
    ),
  );
  await editText(root, 'documents/lettre-ancel.md', (s) =>
    s.replace(
      '::signature[Ancel Morvan, horloger]',
      '::signature[Ancel Morvan ::mark[portrait-a], horloger]',
    ),
  );
  await editText(root, 'locales/en/documents/lettre-ancel.md', (s) =>
    s.replace(
      '::signature[Ancel Morvan, clockmaker]',
      '::signature[Ancel Morvan ::mark[portrait-a], clockmaker]',
    ),
  );
}

async function check(...mutations: ((root: string) => Promise<void>)[]): Promise<CheckResult> {
  const root = await mkdtemp(join(tmpdir(), 'arbre-marks-'));
  temps.push(root);
  await cp(FIXTURE, root, { recursive: true });
  for (const m of mutations) await m(root);
  return checkContentRoot(root);
}

const errorsOf = (r: CheckResult, rule?: RuleId) =>
  r.issues.errors
    .filter((i) => rule === undefined || i.rule === rule)
    .map((i) => `${i.file} ${i.message}`)
    .join('\n');

describe('content:check — marques et enregistrements', () => {
  it('fixture à marques : sans erreur ; ::mark révèle, case Marque compilée, projection', async () => {
    const r = await check(withMarkFixture);
    expect(errorsOf(r)).toBe('');
    const compiled = r.cases[0]!.full!.compiled;
    expect(compiled.documents['lettre-ancel']?.reveals?.portraits).toEqual(['portrait-a']);
    expect(compiled.slots['s-ancel']?.portraitKind).toBe('mark');
    expect(compiled.slots['s-ida']?.portraitKind).toBeUndefined();
    expect(compiled.portraits['portrait-a']?.kind).toBe('mark');
    const proj = structuralProjection(compiled) as Json;
    expect(proj.documents['lettre-ancel'].marks).toEqual(['portrait-a']);
    expect(proj.documents.intro.marks).toBeUndefined();
    // La démo garde la marque inline et sa révélation.
    expect(r.cases[0]!.demo!.compiled.documents['lettre-ancel']?.reveals?.portraits).toEqual([
      'portrait-a',
    ]);
    // Le solveur trouve la marque d'Ancel par la lettre ; ratio par type : 2 marques / 1 case.
    expect(r.cases[0]!.solve!.blockedSlots.size).toBe(0);
    expect(r.issues.warnings.map((w) => w.message).join('\n')).not.toMatch(/marques collectables/);
  });

  it('3 · réponse d’une case du mauvais type ; déclaration du mauvais type', async () => {
    const r = await check(withMarkFixture, (root) =>
      editJson(root, 'tree.json', (j) => {
        j.slots[1].portraitKind = 'mark'; // Ida : visage portrait-b
        j.slots[0].portraitKind = undefined; // Ancel : marque portrait-a dans un champ Portrait
      }),
    );
    const e = errorsOf(r, 3);
    expect(e).toMatch(
      /case « s-ida » \(champ Marque\) : réponse de ida-brask « portrait-b » est un visage/,
    );
    expect(e).toMatch(/case « s-ancel » \(champ Portrait\) : .*« portrait-a » est une marque/);
  });

  it('2 · ::mark vers un visage ou un portrait inconnu', async () => {
    const r = await check(withMarkFixture, (root) =>
      editText(
        root,
        'documents/intro.md',
        (s) => `${s}\n\nVu : ::mark[portrait-b] ::mark[inconnu]\n`,
      ),
    );
    const e = errorsOf(r, 2);
    expect(e).toMatch(/::mark\[portrait-b\] : ce portrait est un visage/);
    expect(e).toMatch(/::mark\[inconnu\] : portrait inconnu/);
  });

  it('2 · pièce recording : ni reveals.portraits ni ::mark', async () => {
    const r = await check(withMarkFixture, async (root) => {
      await editText(root, 'documents/photo-couple.md', (s) =>
        s.replace(/kind: \w+/, 'kind: recording'),
      );
      await editText(root, 'documents/lettre-ancel.md', (s) =>
        s.replace(/kind: \w+/, 'kind: recording'),
      );
    });
    const e = errorsOf(r, 2);
    expect(e).toMatch(/photo-couple\.md pièce recording : reveals\.portraits interdit/);
    expect(e).toMatch(/lettre-ancel\.md pièce recording : ::mark\[…\] interdit/);
  });

  it('1 · description hors gabarit ; deux marques de même description', async () => {
    const r = await check(withMarkFixture, (root) =>
      editJson(root, 'family.json', (j) => {
        j.portraits[0].alt = 'Fourche ; pied : entaille au milieu';
        j.portraits[6].alt = 'Fourche ; pied : entaille au milieu';
      }),
    );
    const e = errorsOf(r, 1);
    expect(e).toMatch(/marque « portrait-a » : gabarit : signe du pied « entaille au milieu »/);
    expect(e).toMatch(/marques « portrait-a » et « portrait-g » : même description/);
  });

  it('12 · calque : marques différentes du FR ; description anglaise hors gabarit', async () => {
    const r = await check(withMarkFixture, async (root) => {
      await editText(root, 'locales/en/documents/lettre-ancel.md', (s) =>
        s.replace(' ::mark[portrait-a]', ''),
      );
      await editJson(root, 'locales/en/family.json', (j) => {
        j.portraits['portrait-g'] = { alt: 'Fork ; foot: cut on the left' };
      });
    });
    const e = errorsOf(r, 12);
    expect(e).toMatch(/lettre-ancel\.md marques différentes du FR .*portrait-a \/ —/);
    expect(e).toMatch(/marque « portrait-g » : gabarit : signe du pied « cut on the left »/);
    // La différence de `reveals` n'est pas signalée une seconde fois par la projection.
    expect(e).not.toMatch(/structure différente du FR .*lettre-ancel/);
  });

  it('5 · terme de moins de 2 caractères (jamais cherchable)', async () => {
    const r = await check((root) =>
      editJson(root, 'progression.json', (j) => j.keywords[0].terms.push('Y·')),
    );
    expect(errorsOf(r, 5)).toMatch(/terme « Y· » \(« y »\) de moins de 2 caractères/);
  });

  it('6 · avertissement : moins de 1,5 marque collectable par case Marque', async () => {
    const r = await check(withMarkFixture, (root) =>
      editJson(root, 'family.json', (j) => {
        j.portraits[6].kind = 'face';
        j.portraits[6].alt = 'Femme au fichu';
      }),
    );
    expect(errorsOf(r)).toBe('');
    expect(r.issues.warnings.map((w) => w.message).join('\n')).toMatch(
      /marques collectables : 1 pour 1 case\(s\) \(1\.00 < 1\.5\)/,
    );
  });
});
