/**
 * `content:check` (ARCHITECTURE §3.7) : les 11 règles, solveur compris. Ne fait aucune écriture.
 */
import { gzipSync } from 'node:zlib';
import type { CompiledCase, MapLayer, Place, WorldMap } from '@arbre/contract';
import { collectRefs } from './autolink';
import { compileCase, documentAssets, solverModelFor, type CompileOutput } from './compile';
import { conditionRefs, type AnyCondition, type AtomRef } from './conditions';
import { IssueList } from './issues';
import { isComplete, loadContent, type ContentSource, type SourceWorld } from './load';
import { blockTexts } from './markdown';
import { COMMON_SECTION, splitSections } from './sections';
import { prepareCase, type CompleteCase, type PreparedCase } from './prepare';
import { normalize } from './shared';
import { solve, type SolverResult } from './solver';
import { checkSvg, countElements, optimizeSvg } from './svg';

/** Budgets gzip (octets) et DOM (règle 9). */
export const BUDGETS = {
  portrait: 25 * 1024,
  illustration: 60 * 1024,
  baseLayer: 60 * 1024,
  layersTotal: 300 * 1024,
  caseText: 600 * 1024,
  mapNodes: 6000,
} as const;

export interface CompiledWorld {
  map: WorldMap | null;
  places: Record<string, Place>;
  layers: Partial<Record<MapLayer, string>>;
}

export interface CaseCheck {
  id: string;
  prep?: PreparedCase;
  full?: CompileOutput;
  demo?: CompileOutput;
  solve?: SolverResult;
  demoSolve?: SolverResult;
}

export interface CheckResult {
  source: ContentSource;
  issues: IssueList;
  cases: CaseCheck[];
  world: CompiledWorld;
}

const gz = (s: string) => gzipSync(Buffer.from(s, 'utf8'), { level: 9 }).length;
const kb = (n: number) => `${(n / 1024).toFixed(1)} Ko`;

function duplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const id of ids) (seen.has(id) ? dup : seen).add(id);
  return [...dup];
}

export async function checkContentRoot(root: string): Promise<CheckResult> {
  const issues = new IssueList();
  const source = await loadContent(root, issues);
  const world = checkWorld(source.world, issues);
  const cases: CaseCheck[] = [];
  for (const c of source.cases) {
    const cc: CaseCheck = { id: c.id };
    cases.push(cc);
    if (c.missing.length > 0) {
      issues.warn(
        1,
        c.dir,
        `brouillon : ${c.missing.join(', ')} manquant(s) ; fichiers présents contrôlés, affaire ni compilée ni résolue`,
      );
      continue;
    }
    if (!isComplete(c)) {
      issues.error(1, c.dir, 'affaire invalide : compilation et solveur ignorés');
      continue;
    }
    checkCase(c, source.world, issues, cc);
  }
  return { source, issues, cases, world };
}

// ---------------------------------------------------------------- monde

function checkWorld(w: SourceWorld, issues: IssueList): CompiledWorld {
  const out: CompiledWorld = {
    map: w.map ?? null,
    places: Object.fromEntries(w.places),
    layers: {},
  };
  if (!w.map) {
    if (w.layers.size > 0)
      issues.error(2, 'content/world/map.json', 'couches présentes sans map.json');
    return out;
  }
  const viewBox = `0 0 ${1000 * w.map.aspect} 1000`;
  let total = 0;
  let nodes = 0;
  for (const layer of w.map.layers) {
    const file = `art/map/${layer}.svg`;
    const src = w.layers.get(layer);
    if (src === undefined) {
      issues.error(2, file, `couche « ${layer} » déclarée dans map.json mais absente`);
      continue;
    }
    for (const p of checkSvg(src, { idPrefix: layer, viewBox }))
      issues.error(8, file, p.message, p.line);
    const opt = optimizeSvg(src, '');
    for (const p of opt.problems) issues.error(8, file, p.message);
    out.layers[layer] = opt.svg;
    const size = gz(opt.svg);
    total += size;
    nodes += countElements(opt.svg);
    if (layer === 'base' && size > BUDGETS.baseLayer) {
      issues.error(9, file, `couche base ${kb(size)} gzip > ${kb(BUDGETS.baseLayer)}`);
    }
  }
  for (const layer of w.layers.keys()) {
    if (!w.map.layers.includes(layer)) {
      issues.warn(2, `art/map/${layer}.svg`, 'couche absente de map.json (ignorée)');
    }
  }
  if (total > BUDGETS.layersTotal) {
    issues.error(9, 'art/map', `couches ${kb(total)} gzip > ${kb(BUDGETS.layersTotal)}`);
  }
  if (nodes > BUDGETS.mapNodes) {
    issues.error(9, 'art/map', `DOM de la carte : ${nodes} nœuds > ${BUDGETS.mapNodes}`);
  }
  return out;
}

// ---------------------------------------------------------------- affaire

function checkCase(c: CompleteCase, world: SourceWorld, issues: IssueList, out: CaseCheck): void {
  const f = (name: string) => `${c.dir}/${name}`;
  const prog = c.progression;
  const errorsBefore = issues.errors.length;

  // ---- Règle 1 : unicité, id = nom de fichier
  const uniq = (file: string, what: string, ids: string[]) => {
    for (const d of duplicates(ids)) issues.error(1, f(file), `${what} « ${d} » en double`);
  };
  uniq(
    'family.json',
    'personne',
    c.family.persons.map((p) => p.id),
  );
  uniq(
    'family.json',
    'métier',
    c.family.occupations.map((o) => o.id),
  );
  uniq(
    'family.json',
    'portrait',
    c.family.portraits.map((p) => p.id),
  );
  uniq(
    'tree.json',
    'case',
    c.tree.slots.map((s) => s.id),
  );
  uniq(
    'tree.json',
    'groupe',
    c.tree.groups.map((g) => g.id),
  );
  uniq(
    'progression.json',
    'mot-clé',
    prog.keywords.map((k) => k.id),
  );
  uniq(
    'progression.json',
    'secret',
    prog.secrets.map((s) => s.id),
  );
  uniq(
    'progression.json',
    'fin',
    prog.endings.map((e) => e.id),
  );
  uniq(
    'progression.json',
    'lieu',
    prog.places.map((p) => p.place),
  );
  const report = prog.report ?? [];
  uniq(
    'progression.json',
    'question du rapport',
    report.map((q) => q.id),
  );
  for (const q of report) {
    uniq(
      'progression.json',
      `option de la question ${q.id}`,
      q.options.map((o) => o.id),
    );
    if (q.options.length < 2) {
      issues.error(1, f('progression.json'), `question « ${q.id} » : au moins 2 options`);
    }
  }
  uniq(
    'hints.json',
    'aide',
    c.hints.map((h) => h.id),
  );
  uniq(
    'achievements.json',
    'succès',
    c.achievements.map((a) => a.id),
  );
  for (const p of c.family.portraits) {
    if (p.file !== `portraits/${p.id}.svg`) {
      issues.error(
        1,
        f('family.json'),
        `portrait « ${p.id} » : fichier attendu portraits/${p.id}.svg`,
      );
    }
  }
  for (const e of prog.endings) {
    if (e.file !== `endings/${e.id}.md`) {
      issues.error(
        1,
        f('progression.json'),
        `fin « ${e.id} » : fichier attendu endings/${e.id}.md`,
      );
    }
  }

  // ---- Règle 2 : références
  const docs = new Set(c.documents.keys());
  const persons = new Map(c.family.persons.map((p) => [p.id, p]));
  const occupations = new Set(c.family.occupations.map((o) => o.id));
  const portraits = new Set(c.family.portraits.map((p) => p.id));
  const slots = new Map(c.tree.slots.map((s) => [s.id, s]));
  const groups = new Map(c.tree.groups.map((g) => [g.id, g]));
  const keywords = new Map(prog.keywords.map((k) => [k.id, k]));
  const secrets = new Set(prog.secrets.map((s) => s.id));
  const endings = new Set(prog.endings.map((e) => e.id));
  const casePlaces = new Set(prog.places.map((p) => p.place));
  const questions = new Map((prog.report ?? []).map((q) => [q.id, q]));
  const ref = (file: string, kind: string, id: string, set: { has(id: string): boolean }) => {
    if (!set.has(id)) issues.error(2, f(file), `${kind} inconnu(e) : « ${id} »`);
  };
  const condRefs = (file: string, cond: AnyCondition | undefined) => {
    if (!cond) return;
    for (const r of conditionRefs(cond)) {
      const sets: Record<AtomRef['kind'], [string, { has(id: string): boolean }]> = {
        read: ['document', docs],
        unlocked: ['document', docs],
        searched: ['mot-clé', keywords],
        visited: ['lieu', casePlaces],
        locked: ['case', slots],
        groupLocked: ['groupe', groups],
        secret: ['secret', secrets],
        endingReached: ['fin', endings],
        answered: ['question du rapport', questions],
      };
      const [kind, set] = sets[r.kind];
      ref(file, `${kind} (condition ${r.kind})`, r.id, set);
      const q = questions.get(r.id);
      if (r.kind === 'answered' && q && !q.options.some((o) => o.id === r.option)) {
        issues.error(2, f(file), `option inconnue « ${r.option} » pour la question « ${r.id} »`);
      }
    }
  };
  ref('case.json', 'document intro', c.meta.intro, docs);
  if (c.meta.epilogue) ref('case.json', 'document épilogue', c.meta.epilogue, docs);
  for (const p of c.family.persons) {
    ref('family.json', `métier de ${p.id}`, p.occupation, occupations);
    ref('family.json', `portrait de ${p.id}`, p.portrait, portraits);
    for (const x of p.parents ?? [])
      if (x !== null) ref('family.json', `parent de ${p.id}`, x, persons);
    for (const x of p.unions ?? []) ref('family.json', `union de ${p.id}`, x, persons);
  }
  for (const p of c.family.portraits) {
    if (!c.portraits.has(p.file))
      issues.error(2, f(p.file), `fichier du portrait « ${p.id} » absent`);
  }
  const declaredPortraitFiles = new Set(c.family.portraits.map((p) => p.file));
  for (const file of c.portraits.keys()) {
    if (!declaredPortraitFiles.has(file))
      issues.warn(2, f(file), 'portrait non déclaré dans family.json');
  }
  for (const s of c.tree.slots) {
    ref('tree.json', `personne de la case ${s.id}`, s.person, persons);
    condRefs('tree.json', s.revealedBy);
  }
  for (const g of c.tree.groups)
    for (const s of g.slots) ref('tree.json', `case du groupe ${g.id}`, s, slots);
  for (const d of prog.start) ref('progression.json', 'document de départ', d, docs);
  for (const [d, cond] of Object.entries(prog.unlocks)) {
    ref('progression.json', 'document (unlocks)', d, docs);
    condRefs('progression.json', cond);
  }
  for (const k of prog.keywords) {
    for (const r of k.results) {
      for (const d of r.documents) ref('progression.json', `document du mot-clé ${k.id}`, d, docs);
      condRefs('progression.json', r.requires);
    }
  }
  for (const p of prog.places) {
    ref('progression.json', 'lieu du monde', p.place, world.places);
    condRefs('progression.json', p.revealedBy);
    for (const d of p.documents) {
      ref('progression.json', `document du lieu ${p.place}`, d.id, docs);
      condRefs('progression.json', d.requires);
    }
  }
  for (const [o, cond] of Object.entries(prog.occupationsUnlock ?? {})) {
    ref('progression.json', 'métier (occupationsUnlock)', o, occupations);
    condRefs('progression.json', cond);
  }
  for (const s of prog.secrets) condRefs('progression.json', s.discoveredBy);
  for (const e of prog.endings) {
    condRefs('progression.json', e.when);
    if (!c.endings.has(e.id)) issues.error(2, f(e.file), `fichier de la fin « ${e.id} » absent`);
  }
  for (const q of prog.report ?? []) {
    condRefs('progression.json', q.askedWhen);
    for (const o of q.options) condRefs('progression.json', o.availableWhen);
  }
  // Sections des fins : étiquettes du fichier ↔ clés de `sections`.
  for (const e of prog.endings) {
    const file = c.endings.get(e.id);
    if (!file) continue;
    const { sections, errors } = splitSections(file.body);
    for (const m of errors) issues.error(2, file.file, m);
    const labels = new Set(sections.map((sec) => sec.label).filter((l): l is string => l !== null));
    for (const l of labels) {
      if (l !== COMMON_SECTION && !(e.sections && l in e.sections)) {
        issues.error(
          2,
          file.file,
          `section [${l}] absente de progression.json (endings.${e.id}.sections)`,
        );
      }
    }
    for (const [l, cond] of Object.entries(e.sections ?? {})) {
      condRefs('progression.json', cond);
      if (l === COMMON_SECTION) {
        issues.error(
          2,
          f('progression.json'),
          `fin « ${e.id} » : [${COMMON_SECTION}] ne prend pas de condition`,
        );
      } else if (!labels.has(l)) {
        issues.error(
          2,
          f('progression.json'),
          `fin « ${e.id} » : section [${l}] absente de ${e.file}`,
        );
      }
    }
  }
  for (const id of c.endings.keys()) {
    if (!endings.has(id))
      issues.warn(2, f(`endings/${id}.md`), 'fin non déclarée dans progression.json');
  }
  if (prog.demo) {
    for (const d of prog.demo.documents) ref('progression.json', 'document de la démo', d, docs);
    for (const s of prog.demo.slots) ref('progression.json', 'case de la démo', s, slots);
    ref('progression.json', 'document de fin de démo', prog.demo.end, docs);
  }
  for (const h of c.hints) {
    if ('slot' in h.target) ref('hints.json', `case de l'aide ${h.id}`, h.target.slot, slots);
    else ref('hints.json', `groupe de l'aide ${h.id}`, h.target.group, groups);
    condRefs('hints.json', h.availableWhen);
  }
  for (const a of c.achievements) condRefs('achievements.json', a.when);
  for (const d of c.documents.values()) {
    const fm = d.frontmatter;
    if (fm.place) ref(relDoc(c, d.file), 'lieu', fm.place, world.places);
    for (const p of fm.reveals?.portraits ?? [])
      ref(relDoc(c, d.file), 'portrait révélé', p, portraits);
    for (const o of fm.reveals?.occupations ?? [])
      ref(relDoc(c, d.file), 'métier révélé', o, occupations);
    for (const k of collectRefs(d.body))
      ref(relDoc(c, d.file), 'mot-clé du lien [[…]]', k, keywords);
    for (const a of documentAssets(d)) {
      if (!c.illustrations.has(a)) issues.error(7, d.file, `image inexistante : ${a}`);
    }
  }
  for (const e of c.endings.values()) {
    for (const k of collectRefs(e.body))
      ref(relDoc(c, e.file), 'mot-clé du lien [[…]]', k, keywords);
    for (const a of documentAssets({ frontmatter: {}, body: e.body })) {
      if (!c.illustrations.has(a)) issues.error(7, e.file, `image inexistante : ${a}`);
    }
  }

  // ---- Règle 3 : arbre
  const slotPersons = c.tree.slots.map((s) => s.person);
  for (const d of duplicates(slotPersons))
    issues.error(3, f('tree.json'), `personne « ${d} » dans plusieurs cases`);
  const inGroup = new Map<string, string[]>();
  for (const g of c.tree.groups) {
    for (const s of g.slots) inGroup.set(s, [...(inGroup.get(s) ?? []), g.id]);
    if (g.threshold < 3) issues.error(3, f('tree.json'), `groupe « ${g.id} » : seuil < 3`);
    if (g.slots.length < g.threshold) {
      issues.warn(
        3,
        f('tree.json'),
        `groupe « ${g.id} » : ${g.slots.length} case(s) pour un seuil de ${g.threshold}`,
      );
    }
  }
  for (const s of c.tree.slots) {
    const gs = inGroup.get(s.id) ?? [];
    if (s.prefilled && gs.length > 0) {
      issues.error(
        3,
        f('tree.json'),
        `case pré-remplie « ${s.id} » dans un groupe (${gs.join(', ')})`,
      );
    } else if (!s.prefilled && gs.length !== 1) {
      issues.error(
        3,
        f('tree.json'),
        `case « ${s.id} » dans ${gs.length} groupe(s) : les groupes doivent partitionner les cases non pré-remplies`,
      );
    }
  }
  for (const p of c.family.persons) {
    const ps = (p.parents ?? []).flatMap((x) => (x === null ? [] : [x]));
    if (ps.includes(p.id)) issues.error(3, f('family.json'), `${p.id} est son propre parent`);
    if (ps.length === 2 && ps[0] === ps[1])
      issues.error(3, f('family.json'), `${p.id} : deux fois le même parent`);
    for (const x of ps) {
      const parent = persons.get(x);
      if (parent?.born && p.born && parent.born.slice(0, 4) >= p.born.slice(0, 4)) {
        issues.error(
          3,
          f('family.json'),
          `${x} (né ${parent.born}) n'est pas né avant son enfant ${p.id} (${p.born})`,
        );
      }
    }
    for (const u of p.unions ?? []) {
      if (!(persons.get(u)?.unions ?? []).includes(p.id)) {
        issues.warn(3, f('family.json'), `union ${p.id} → ${u} non réciproque`);
      }
    }
  }
  {
    const state = new Map<string, 0 | 1 | 2>();
    const visit = (id: string, path: string[]): void => {
      const st = state.get(id);
      if (st === 2) return;
      if (st === 1) {
        issues.error(3, f('family.json'), `cycle de filiation : ${[...path, id].join(' → ')}`);
        return;
      }
      state.set(id, 1);
      for (const x of persons.get(id)?.parents ?? [])
        if (x && persons.has(x)) visit(x, [...path, id]);
      state.set(id, 2);
    };
    for (const id of persons.keys()) visit(id, []);
  }

  // ---- Règle 4 : auto-dépendances
  const selfRef = (
    file: string,
    what: string,
    cond: AnyCondition | undefined,
    kinds: AtomRef['kind'][],
    id: string,
  ) => {
    if (cond && conditionRefs(cond).some((r) => kinds.includes(r.kind) && r.id === id)) {
      issues.error(4, f(file), `${what} « ${id} » dépend de lui-même`);
    }
  };
  for (const [d, cond] of Object.entries(prog.unlocks))
    selfRef('progression.json', 'déblocage du document', cond, ['read', 'unlocked'], d);
  for (const q of prog.report ?? []) {
    selfRef('progression.json', 'question du rapport', q.askedWhen, ['answered'], q.id);
  }
  for (const s of prog.secrets)
    selfRef('progression.json', 'secret', s.discoveredBy, ['secret'], s.id);
  for (const p of prog.places)
    selfRef('progression.json', 'lieu', p.revealedBy, ['visited'], p.place);
  for (const s of c.tree.slots) {
    selfRef('tree.json', 'case', s.revealedBy, ['locked'], s.id);
    const g = inGroup.get(s.id)?.[0];
    if (g) selfRef('tree.json', `case ${s.id} : groupe`, s.revealedBy, ['groupLocked'], g);
  }
  for (const k of prog.keywords) {
    for (const r of k.results) {
      for (const d of r.documents) {
        if (
          r.requires &&
          conditionRefs(r.requires).some(
            (x) => (x.kind === 'read' || x.kind === 'unlocked') && x.id === d,
          )
        ) {
          issues.error(
            4,
            f('progression.json'),
            `résultat du mot-clé « ${k.id} » : « ${d} » dépend de lui-même`,
          );
        }
      }
    }
  }

  // ---- Règle 5 : mots-clés (partie statique)
  const termOwner = new Map<string, string>();
  for (const k of prog.keywords) {
    const local = new Set<string>();
    for (const t of k.terms) {
      const n = normalize(t);
      if (!n) {
        issues.error(
          5,
          f('progression.json'),
          `mot-clé « ${k.id} » : terme « ${t} » vide après normalisation`,
        );
        continue;
      }
      if (local.has(n))
        issues.warn(5, f('progression.json'), `mot-clé « ${k.id} » : terme « ${t} » en double`);
      local.add(n);
      const owner = termOwner.get(n);
      if (owner && owner !== k.id) {
        issues.error(
          5,
          f('progression.json'),
          `terme « ${n} » partagé par « ${owner} » et « ${k.id} »`,
        );
      } else termOwner.set(n, k.id);
    }
  }

  // SVG (règle 8) avant compilation : une affaire aux SVG invalides n'est pas optimisée.
  for (const [file, src] of c.portraits) {
    const stem = file.slice('portraits/'.length, -4);
    for (const p of checkSvg(src, { idPrefix: stem })) issues.error(8, f(file), p.message, p.line);
  }
  for (const [file, src] of c.illustrations) {
    const stem = file.slice('illustrations/'.length, -4);
    for (const p of checkSvg(src, { idPrefix: stem })) issues.error(8, f(file), p.message, p.line);
  }

  if (issues.errors.length > errorsBefore) {
    issues.error(6, c.dir, 'erreurs de structure : compilation et solveur ignorés');
    return;
  }

  // ---- Compilation, solveur
  const prep = prepareCase(c);
  out.prep = prep;
  for (const { file, overlap } of prep.overlaps) {
    issues.error(
      5,
      file,
      `chevauchement de liens « ${overlap.text} » : « ${overlap.kept} » / « ${overlap.dropped} »`,
    );
  }
  const cache = new Map<string, ReturnType<typeof optimizeSvg>>();
  const full = compileCase(prep, world, 'full', cache);
  out.full = full;
  for (const s of full.svgProblems) for (const p of s.problems) issues.error(8, s.file, p.message);
  const result = solve(solverModelFor(full.compiled, prep));
  out.solve = result;

  // ---- Règle 5 : présence dans un texte accessible
  const reachableRefs = new Set<string>();
  for (const d of result.read)
    for (const k of prep.documents.get(d)?.keywords ?? []) reachableRefs.add(k);
  for (const k of prog.keywords) {
    if (k.hiddenTerm) {
      const inText = [...prep.documents.values()].find((d) =>
        k.terms.some((t) => {
          const n = normalize(t);
          return n && d.norm.includes(` ${n} `);
        }),
      );
      if (inText) issues.warn(5, inText.file, `terme caché de « ${k.id} » écrit tel quel`);
      continue;
    }
    if (!reachableRefs.has(k.id)) {
      issues.error(5, f('progression.json'), `mot-clé « ${k.id} » absent de tout texte accessible`);
    }
  }

  // ---- Règle 6 : solvabilité
  for (const d of prep.documents.values()) {
    if (d.frontmatter.optional || d.id === c.meta.epilogue) continue;
    if (!result.unlocked.has(d.id)) issues.error(6, d.file, 'document inatteignable');
  }
  for (const [id, why] of result.blockedSlots) {
    issues.error(6, f('tree.json'), `case « ${id} » jamais établie : ${why.join(' ; ')}`);
  }
  for (const s of prog.secrets) {
    if (!result.secrets.has(s.id))
      issues.error(6, f('progression.json'), `secret « ${s.id} » inatteignable`);
  }
  for (const e of prog.endings) {
    if (!result.endings.has(e.id))
      issues.error(6, f('progression.json'), `fin « ${e.id} » inatteignable`);
  }
  if (result.endingsAtEnd.length === 0) {
    issues.error(6, f('progression.json'), 'aucune fin vraie à 100 %');
  }

  // ---- Règle 9 : budgets
  for (const p of Object.values(full.compiled.portraits)) {
    const size = gz(p.svg);
    if (size > BUDGETS.portrait)
      issues.error(9, f(p.file), `portrait ${kb(size)} gzip > ${kb(BUDGETS.portrait)}`);
  }
  for (const [file, svg] of Object.entries(full.illustrations)) {
    const size = gz(svg);
    if (size > BUDGETS.illustration)
      issues.error(9, f(file), `illustration ${kb(size)} gzip > ${kb(BUDGETS.illustration)}`);
  }
  const textSize = gz(JSON.stringify(withoutSvg(full.compiled)));
  if (textSize > BUDGETS.caseText) {
    issues.error(
      9,
      c.dir,
      `affaire compilée (texte) ${kb(textSize)} gzip > ${kb(BUDGETS.caseText)}`,
    );
  }

  // ---- Règle 11 : fuites
  for (const m of findLeaks(full.compiled, c)) issues.error(11, c.dir, `[complet] ${m}`);

  // ---- Règle 10 : démo
  if (!prog.demo) {
    issues.warn(10, f('progression.json'), 'aucune section demo : pas de démo pour cette affaire');
    return;
  }
  const demoSpec = prog.demo;
  if (!demoSpec.documents.includes(demoSpec.end)) {
    issues.error(
      10,
      f('progression.json'),
      `demo.end « ${demoSpec.end} » absent de demo.documents`,
    );
  }
  if (!demoSpec.documents.includes(c.meta.intro)) {
    issues.error(
      10,
      f('progression.json'),
      `l'intro « ${c.meta.intro} » doit faire partie de la démo`,
    );
  }
  const demo = compileCase(prep, world, 'demo', cache);
  out.demo = demo;
  if (demo.compiled.progression.start.length === 0) {
    issues.error(10, f('progression.json'), 'aucun document de départ dans la démo');
  }
  const ds = solve(solverModelFor(demo.compiled, prep));
  out.demoSolve = ds;
  if (!ds.unlocked.has(demoSpec.end)) {
    issues.error(
      10,
      f('progression.json'),
      `démo : document de fin « ${demoSpec.end} » inatteignable`,
    );
  }
  for (const s of demoSpec.slots) {
    if (!ds.locked.has(s)) {
      const why = ds.blockedSlots.get(s) ?? ['case retirée de la démo'];
      issues.error(10, f('tree.json'), `démo : case « ${s} » jamais établie : ${why.join(' ; ')}`);
    }
  }
  for (const d of demoSpec.documents) {
    if (!ds.unlocked.has(d) && !prep.documents.get(d)?.frontmatter.optional) {
      issues.error(
        10,
        f('progression.json'),
        `démo : document « ${d} » inatteignable dans la démo`,
      );
    }
  }
  for (const m of demoCanaries(demo, prep)) issues.error(10, c.dir, `[démo] ${m}`);
  for (const m of findLeaks(demo.compiled, c)) issues.error(11, c.dir, `[démo] ${m}`);
}

function relDoc(_c: CompleteCase, file: string): string {
  // Les fichiers de documents sont déjà relatifs à la racine ; `ref` préfixe par le dossier.
  return file.split('/').slice(-2).join('/');
}

function withoutSvg(c: CompiledCase): CompiledCase {
  return {
    ...c,
    portraits: Object.fromEntries(
      Object.entries(c.portraits).map(([k, p]) => [k, { ...p, svg: '' }]),
    ),
  };
}

/** Règle 11 : aucune note de bible ni réponse en clair (hors cases pré-remplies). */
export function findLeaks(compiled: CompiledCase, c: CompleteCase): string[] {
  const out: string[] = [];
  const json = JSON.stringify(compiled);
  if (json.includes('"bibleNotes"')) out.push('clé bibleNotes présente');
  if (/"person"\s*:/.test(json)) out.push('clé person présente (lien case → personne en clair)');
  for (const p of c.family.persons) {
    const note = p.bibleNotes?.trim();
    if (note && note.length >= 8 && json.includes(JSON.stringify(note).slice(1, -1))) {
      out.push(`notes de bible de « ${p.id} » présentes`);
    }
  }
  const otherIds = new Set<string>([
    ...Object.keys(compiled.documents),
    ...Object.keys(compiled.keywords),
    ...Object.keys(compiled.slots),
    ...Object.keys(compiled.portraits),
    ...Object.keys(compiled.occupations),
    ...Object.keys(compiled.places),
    ...compiled.groups.map((g) => g.id),
    ...compiled.progression.secrets.map((s) => s.id),
    ...Object.keys(compiled.endings),
    compiled.id,
  ]);
  for (const p of c.family.persons) {
    if (!otherIds.has(p.id) && json.includes(`"${p.id}"`))
      out.push(`id de personne « ${p.id} » présent`);
  }
  // Un portrait ne doit pas nommer la personne qu'il représente (id, texte alternatif, légende).
  for (const person of c.family.persons) {
    const p = compiled.portraits[person.portrait];
    if (!p) continue;
    const fields = ` ${normalize(`${p.id} ${p.alt} ${p.caption ?? ''}`)} `;
    const named = [...person.given, ...person.family].some((n) => {
      const t = normalize(n);
      return t.length > 0 && fields.includes(` ${t} `);
    });
    if (named)
      out.push(`portrait « ${p.id} » : id, alt ou légende révèle le nom de « ${person.id} »`);
  }
  const HEX = /^[0-9a-f]{14}$/;
  for (const s of Object.values(compiled.slots)) {
    const a = s.answer;
    const all = [...a.given, ...a.family, a.portrait, a.occupation];
    if (!all.every((h) => HEX.test(h))) out.push(`case « ${s.id} » : réponse non hachée`);
  }
  return out;
}

/** Règle 10 : canaris — aucun texte hors démo dans le bundle démo. */
export function demoCanaries(demo: CompileOutput, prep: PreparedCase): string[] {
  const out: string[] = [];
  const bundle = JSON.stringify(demo.compiled) + JSON.stringify(demo.illustrations);
  const demoDocs = new Set(Object.keys(demo.compiled.documents));
  const demoText = [...demoDocs]
    .map((d) => prep.documents.get(d)!)
    .flatMap((d) => [d.frontmatter.title, ...blockTexts(d.body)])
    .join('\n');
  const canary = (label: string, text: string) => {
    const t = text.trim();
    if (t.length < 12 || demoText.includes(t)) return;
    if (bundle.includes(JSON.stringify(t).slice(1, -1)))
      out.push(`${label} : « ${t.slice(0, 60)} »`);
  };
  for (const d of prep.documents.values()) {
    if (demoDocs.has(d.id)) continue;
    if (bundle.includes(`"${d.id}"`)) out.push(`id de document hors démo « ${d.id} »`);
    canary(`titre hors démo (${d.id})`, d.frontmatter.title);
    for (const t of blockTexts(d.body)) canary(`texte hors démo (${d.id})`, t.slice(0, 32));
  }
  for (const e of prep.endings.values()) {
    canary(`fin (${e.id})`, e.title);
    for (const t of blockTexts(e.body)) canary(`fin (${e.id})`, t.slice(0, 32));
  }
  for (const s of prep.src.progression.secrets) {
    if (!demo.compiled.progression.secrets.some((x) => x.id === s.id))
      canary(`secret (${s.id})`, s.title);
  }
  for (const file of prep.src.illustrations.keys()) {
    if (!(file in demo.illustrations) && bundle.includes(file))
      out.push(`illustration hors démo ${file}`);
  }
  return out;
}
