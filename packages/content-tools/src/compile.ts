/**
 * Compilation d'une affaire en `CompiledCase` (ARCHITECTURE §3.3), éditions complète et démo.
 * La démo est physiquement réduite : documents, cases, mots-clés, lieux, secrets, aides et
 * succès hors démo sont retirés, et les conditions qui les citent simplifiées.
 */
import type {
  Achievement,
  Block,
  CompiledCase,
  CompiledDocument,
  CompiledEnding,
  CompiledKeyword,
  CompiledPlace,
  CompiledPortrait,
  CompiledSlot,
  Condition,
  Edition,
  Hint,
  Inline,
  Occupation,
  Place,
  Person,
  ReportQuestion,
  SlotClaim,
  SlotGuess,
} from '@arbre/contract';
import { COMMON_SECTION } from './sections';
import { conditionRefs, simplify, type AtomRef } from './conditions';
import type { SourceWorld } from './load';
import { mentions, type PreparedCase } from './prepare';
import type { SolverModel, SolverSlot } from './solver';
import { optimizeSvg, type SvgProblem } from './svg';
import { cyrb53Hex, hashAnswer, normalize, shortHash, stableStringify } from './shared';

export interface CompileOutput {
  compiled: CompiledCase;
  /** `illustrations/<nom>.svg` → SVG optimisé (absent du contrat : voir rapport). */
  illustrations: Record<string, string>;
  /** Problèmes de compilation SVG (fichier → problèmes). */
  svgProblems: { file: string; problems: SvgProblem[] }[];
}

/** Sel dérivé du contenu source : stable tant que les sources ne changent pas. */
export function deriveSalt(prep: PreparedCase): string {
  return cyrb53Hex(`salt|${prep.src.id}|${prep.src.sourceDigest}`);
}

function unwrapRefs(nodes: Inline[], keep: (k: string) => boolean): Inline[] {
  const out: Inline[] = [];
  for (const n of nodes) {
    if (n.t === 'ref') {
      if (keep(n.keyword)) out.push({ ...n, c: unwrapRefs(n.c, keep) });
      else out.push(...unwrapRefs(n.c, keep));
    } else if (n.t === 'text' || n.t === 'redacted') out.push(n);
    else out.push({ t: n.t, c: unwrapRefs(n.c, keep) });
  }
  // Fusionne les textes adjacents.
  const merged: Inline[] = [];
  for (const n of out) {
    const last = merged[merged.length - 1];
    if (n.t === 'text' && last?.t === 'text')
      merged[merged.length - 1] = { t: 'text', v: last.v + n.v };
    else merged.push(n);
  }
  return merged;
}

function unwrapBlocks(blocks: Block[], keep: (k: string) => boolean): Block[] {
  const u = (c: Inline[]) => unwrapRefs(c, keep);
  return blocks.map((b): Block => {
    switch (b.t) {
      case 'p':
      case 'signature':
        return { t: b.t, c: u(b.c) };
      case 'h':
        return { t: 'h', level: b.level, c: u(b.c) };
      case 'quote':
        return { t: 'quote', c: unwrapBlocks(b.c, keep) };
      case 'list':
        return { t: 'list', ordered: b.ordered, items: b.items.map(u) };
      case 'table':
        return { t: 'table', head: b.head.map(u), rows: b.rows.map((r) => r.map(u)) };
      case 'figure':
        return b.caption ? { ...b, caption: u(b.caption) } : b;
      default:
        return b;
    }
  });
}

/** Assets (`illustrations/…`) cités par un document. */
export function documentAssets(doc: {
  frontmatter: { illustration?: { file: string } };
  body: Block[];
}): string[] {
  const out = new Set<string>();
  if (doc.frontmatter.illustration) out.add(doc.frontmatter.illustration.file);
  const walk = (bs: Block[]) => {
    for (const b of bs) {
      if (b.t === 'figure') out.add(b.asset);
      else if (b.t === 'quote') walk(b.c);
    }
  };
  walk(doc.body);
  return [...out];
}

/** Visages acceptés pour une personne : canonique puis autres âges. */
export function personPortraits(p: Pick<Person, 'portrait' | 'altPortraits'>): string[] {
  return [p.portrait, ...(p.altPortraits ?? []).filter((x) => x !== p.portrait)];
}

/** Déclaration d'une case revendiquée en `SlotGuess` (champs absents : vides ou nuls). */
export function claimedGuess(claim: SlotClaim): SlotGuess {
  return {
    given: claim.given ?? '',
    family: claim.family ?? '',
    portrait: claim.portrait ?? null,
    occupation: claim.occupation ?? null,
  };
}

function sortFr(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'fr'));
}

export function compileCase(
  prep: PreparedCase,
  world: SourceWorld,
  edition: Edition,
  svgCache: Map<string, ReturnType<typeof optimizeSvg>> = new Map(),
): CompileOutput {
  const src = prep.src;
  const prog = src.progression;
  const demo = edition === 'demo' ? prog.demo : undefined;
  if (edition === 'demo' && !demo) throw new Error(`${src.id} : pas de section demo`);
  const salt = deriveSalt(prep);
  const persons = new Map<string, Person>(src.family.persons.map((p) => [p.id, p]));
  const svgProblems: CompileOutput['svgProblems'] = [];

  const optimized = (file: string, source: string) => {
    const key = `${src.id}/${file}`;
    let r = svgCache.get(key);
    if (!r) {
      r = optimizeSvg(source, `${src.id}-`);
      svgCache.set(key, r);
      if (r.problems.length) svgProblems.push({ file: `${src.dir}/${file}`, problems: r.problems });
    }
    return r.svg;
  };

  // --- Ensembles de l'édition ---
  const docIds = new Set(
    demo ? demo.documents.filter((d) => prep.documents.has(d)) : prep.documents.keys(),
  );
  const slotSpecs = src.tree.slots.filter((s) => !demo || demo.slots.includes(s.id));
  const slotIds = new Set(slotSpecs.map((s) => s.id));
  const groups = src.tree.groups
    .map((g) => ({ ...g, slots: g.slots.filter((s) => slotIds.has(s)) }))
    .filter((g) => g.slots.length > 0);
  const groupIds = new Set(groups.map((g) => g.id));

  // Mots-clés : résultats restreints aux documents de l'édition.
  const keywordSpecs = new Map<string, CompiledKeyword & { terms: string[] }>();
  // Premier passage sans simplification (les conditions de résultats citent souvent d'autres mots-clés).
  for (const k of prog.keywords) {
    const results = k.results
      .map((r) => ({ ...r, documents: r.documents.filter((d) => docIds.has(d)) }))
      .filter((r) => r.documents.length > 0);
    if (results.length === 0) continue;
    keywordSpecs.set(k.id, { ...k, results });
  }
  const placeSpecs = prog.places.filter((p) => world.places.has(p.place));

  // Secrets : point fixe (un secret peut en citer un autre).
  let secretIds = new Set(prog.secrets.map((s) => s.id));
  let reportIds = new Set((prog.report ?? []).map((q) => q.id));
  const exists = (r: AtomRef): boolean => {
    switch (r.kind) {
      case 'read':
      case 'unlocked':
        return docIds.has(r.id);
      case 'searched':
        return keywordSpecs.has(r.id);
      case 'visited':
        return placeSpecs.some((p) => p.place === r.id);
      case 'locked':
        return slotIds.has(r.id);
      case 'groupLocked':
        return groupIds.has(r.id);
      case 'secret':
        return secretIds.has(r.id);
      case 'endingReached':
        return !demo && prog.endings.some((e) => e.id === r.id);
      case 'answered':
        return reportIds.has(r.id);
    }
  };
  const simp = <T extends Condition>(c: T | undefined): T | true | false | undefined =>
    c === undefined ? undefined : demo ? (simplify(c, exists) as T | boolean) : c;

  if (demo) {
    for (;;) {
      const next = new Set(
        prog.secrets.filter((s) => simp(s.discoveredBy) !== false).map((s) => s.id),
      );
      if (next.size === secretIds.size) break;
      secretIds = next;
    }
    // Mots-clés : conditions de résultats simplifiées, jusqu'au point fixe.
    for (;;) {
      let changed = false;
      for (const [id, k] of keywordSpecs) {
        const results = k.results
          .map((r) => {
            const req = simp(r.requires);
            if (req === false) return null;
            const { requires: _r, ...rest } = r;
            return req === undefined || req === true ? rest : { ...rest, requires: req };
          })
          .filter((r): r is NonNullable<typeof r> => r !== null);
        if (results.length === 0) {
          keywordSpecs.delete(id);
          changed = true;
        } else if (stableStringify(results) !== stableStringify(k.results)) {
          keywordSpecs.set(id, { ...k, results });
          changed = true;
        }
      }
      if (!changed) break;
    }
  }

  // --- Documents ---
  const documents: Record<string, CompiledDocument> = {};
  const assets = new Set<string>();
  for (const id of docIds) {
    const d = prep.documents.get(id)!;
    const body = demo ? unwrapBlocks(d.body, (k) => keywordSpecs.has(k)) : d.body;
    documents[id] = {
      ...d.frontmatter,
      id,
      body,
      keywords: d.keywords.filter((k) => keywordSpecs.has(k)),
    };
    for (const a of documentAssets(d)) assets.add(a);
  }
  const illustrations: Record<string, string> = {};
  for (const a of [...assets].sort()) {
    const source = src.illustrations.get(a);
    if (source !== undefined) illustrations[a] = optimized(a, source);
  }

  // --- Mots-clés et index ---
  const keywords: Record<string, CompiledKeyword> = {};
  const searchIndex: Record<string, string> = {};
  for (const [id, k] of keywordSpecs) {
    const { terms, ...rest } = k;
    keywords[id] = rest;
    for (const t of terms) {
      const n = normalize(t);
      if (n && !(n in searchIndex)) searchIndex[n] = id;
    }
  }

  // --- Cases ---
  const slotOfPerson = new Map(slotSpecs.map((s) => [s.person, s.id]));
  const slots: Record<string, CompiledSlot> = {};
  for (const s of slotSpecs) {
    const p = persons.get(s.person);
    if (!p) continue;
    const revealedBy = simp(s.revealedBy);
    if (revealedBy === false) continue;
    const slot: CompiledSlot = {
      id: s.id,
      generation: s.generation,
      column: s.column,
      answer: {
        given: p.given.map((v) => hashAnswer(salt, s.id, 'given', v)),
        family: p.family.map((v) => hashAnswer(salt, s.id, 'family', v)),
        portrait: personPortraits(p).map((v) => hashAnswer(salt, s.id, 'portrait', v)),
        occupation: hashAnswer(salt, s.id, 'occupation', p.occupation),
      },
      parents: (p.parents ?? [])
        .flatMap((x) => (x === null ? [] : [x]))
        .map((x) => slotOfPerson.get(x))
        .filter((x): x is string => x !== undefined),
      unions: (p.unions ?? [])
        .map((x) => slotOfPerson.get(x))
        .filter((x): x is string => x !== undefined),
    };
    if (s.prefilled) {
      slot.prefilled = true;
      slot.prefilledGuess = {
        given: p.given[0]!,
        family: p.family[0]!,
        portrait: p.portrait,
        occupation: p.occupation,
      };
    }
    if (s.claim) slot.claimedGuess = claimedGuess(s.claim);
    if (revealedBy !== undefined && revealedBy !== true) slot.revealedBy = revealedBy;
    slots[s.id] = slot;
  }

  // --- Portraits et métiers ---
  const portraitIds = new Set<string>();
  const occupationIds = new Set<string>();
  const occupationsUnlock: Record<string, Condition> = {};
  for (const [occ, c] of Object.entries(prog.occupationsUnlock ?? {})) {
    const r = simp(c);
    if (r === false || r === undefined) continue;
    if (r !== true) occupationsUnlock[occ] = r;
    occupationIds.add(occ);
  }
  if (demo) {
    for (const id of docIds) {
      const fm = prep.documents.get(id)!.frontmatter;
      fm.reveals?.portraits?.forEach((x) => portraitIds.add(x));
      fm.reveals?.occupations?.forEach((x) => occupationIds.add(x));
    }
    for (const s of Object.values(slots)) {
      for (const g of [s.prefilledGuess, s.claimedGuess]) {
        if (g?.portrait) portraitIds.add(g.portrait);
        if (g?.occupation) occupationIds.add(g.occupation);
      }
    }
  } else {
    src.family.portraits.forEach((p) => portraitIds.add(p.id));
    src.family.occupations.forEach((o) => occupationIds.add(o.id));
  }
  const portraits: Record<string, CompiledPortrait> = {};
  for (const p of src.family.portraits) {
    if (!portraitIds.has(p.id)) continue;
    const source = src.portraits.get(p.file);
    portraits[p.id] = { ...p, svg: source === undefined ? '' : optimized(p.file, source) };
  }
  const occupations: Record<string, Occupation> = {};
  for (const o of src.family.occupations) if (occupationIds.has(o.id)) occupations[o.id] = o;

  // --- Lieux ---
  const places: Record<string, CompiledPlace> = {};
  const docPlaces = new Set([...docIds].map((d) => prep.documents.get(d)!.frontmatter.place));
  for (const cp of placeSpecs) {
    const place = world.places.get(cp.place) as Place;
    const docs = cp.documents
      .filter((d) => docIds.has(d.id))
      .map((d) => {
        const r = simp(d.requires);
        if (r === false) return null;
        return r === undefined || r === true ? { id: d.id } : { id: d.id, requires: r };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);
    if (demo && docs.length === 0 && !docPlaces.has(cp.place)) continue;
    const revealedBy = simp(cp.revealedBy);
    if (revealedBy === false) continue;
    const out: CompiledPlace = { ...place, documents: docs };
    if (revealedBy !== undefined && revealedBy !== true) out.revealedBy = revealedBy;
    places[cp.place] = out;
  }

  // --- Progression ---
  const unlocks: Record<string, Condition> = {};
  for (const [doc, c] of Object.entries(prog.unlocks)) {
    if (!docIds.has(doc)) continue;
    const r = simp(c);
    if (r === false || r === undefined || r === true) continue;
    unlocks[doc] = r;
  }
  const secrets = prog.secrets
    .filter((s) => secretIds.has(s.id))
    .map((s) => ({ ...s, discoveredBy: simp(s.discoveredBy) as Condition }));

  // --- Fins ---
  const endings: Record<string, CompiledEnding> = {};
  if (!demo) {
    for (const e of prog.endings) {
      const body = prep.endings.get(e.id);
      if (!body) continue;
      endings[e.id] = {
        when: e.when,
        priority: e.priority,
        title: body.title,
        sections: body.sections.map((sec) => {
          const when =
            sec.label === null || sec.label === COMMON_SECTION
              ? undefined
              : e.sections?.[sec.label];
          return {
            label: sec.label,
            title: sec.title,
            ...(when ? { when } : {}),
            body: sec.body,
          };
        }),
      };
    }
  }

  // --- Aides et succès ---
  const hints: Hint[] = [];
  for (const h of src.hints) {
    const target = 'slot' in h.target ? slotIds.has(h.target.slot) : groupIds.has(h.target.group);
    if (!target) continue;
    const r = simp(h.availableWhen);
    if (r === false || r === undefined || r === true) continue;
    hints.push({ ...h, availableWhen: r });
  }
  // --- Rapport final : en démo, seulement si tout ce qu'il cite est dans la démo ---
  const reportRefs = (prog.report ?? []).flatMap((q) => [
    ...(q.askedWhen ? conditionRefs(q.askedWhen) : []),
    ...q.options.flatMap((o) => (o.availableWhen ? conditionRefs(o.availableWhen) : [])),
  ]);
  const report: ReportQuestion[] = !demo || reportRefs.every(exists) ? (prog.report ?? []) : [];
  reportIds = new Set(report.map((q) => q.id));

  const achievements: Achievement[] = demo
    ? src.achievements.filter((a) => conditionRefs(a.when).every(exists))
    : src.achievements;

  // --- Candidats (noms lus dans les documents de l'édition) ---
  const norms = [...docIds].map((d) => prep.documents.get(d)!.norm);
  const given: string[] = [];
  const family: string[] = [];
  for (const p of src.family.persons) {
    for (const v of p.given) if (norms.some((n) => mentions(n, [v]))) given.push(v);
    for (const v of p.family) if (norms.some((n) => mentions(n, [v]))) family.push(v);
  }
  // Valeurs déclarées : proposables d'emblée (re-sélection après retrait).
  for (const s of Object.values(slots)) {
    if (s.claimedGuess?.given) given.push(s.claimedGuess.given);
    if (s.claimedGuess?.family) family.push(s.claimedGuess.family);
  }

  const meta = { ...src.meta };
  if (meta.epilogue && !docIds.has(meta.epilogue)) delete meta.epilogue;

  const compiled: CompiledCase = {
    format: 1,
    id: src.id,
    edition,
    contentHash: '00000000',
    salt,
    meta,
    documents,
    searchIndex,
    keywords,
    slots,
    groups,
    portraits,
    occupations,
    places,
    progression: {
      start: prog.start.filter((d) => docIds.has(d)),
      unlocks,
      ...(Object.keys(occupationsUnlock).length ? { occupationsUnlock } : {}),
      secrets,
    },
    endings,
    hints,
    achievements,
    report,
    candidates: { given: sortFr(given), family: sortFr(family) },
  };
  compiled.contentHash = shortHash(stableStringify({ compiled, illustrations }));
  return { compiled, illustrations, svgProblems };
}

/** Modèle du solveur pour un compilé (mêmes données que le jeu verra), avec la vérité de la bible. */
export function solverModelFor(compiled: CompiledCase, prep: PreparedCase): SolverModel {
  const persons = new Map(prep.src.family.persons.map((p) => [p.id, p]));
  const personOfSlot = new Map(prep.src.tree.slots.map((s) => [s.id, s.person]));
  const slots = new Map<string, SolverSlot>();
  for (const s of Object.values(compiled.slots)) {
    const p = persons.get(personOfSlot.get(s.id) ?? '');
    if (!p) continue;
    slots.set(s.id, {
      id: s.id,
      prefilled: !!s.prefilled,
      claimed: !!s.claimedGuess,
      ...(s.revealedBy ? { revealedBy: s.revealedBy } : {}),
      given: p.given.map(normalize),
      family: p.family.map(normalize),
      portraits: personPortraits(p),
      occupation: p.occupation,
    });
  }
  // Valeurs déclarées : disponibles d'emblée dans les sélecteurs, comme dans le moteur.
  const claimedPortraits = new Set<string>();
  const claimedOccupations = new Set<string>();
  for (const s of Object.values(compiled.slots)) {
    if (s.claimedGuess?.portrait) claimedPortraits.add(s.claimedGuess.portrait);
    if (s.claimedGuess?.occupation) claimedOccupations.add(s.claimedGuess.occupation);
  }
  const optionalDocs = new Set(
    [...prep.documents.values()].filter((d) => d.frontmatter.optional).map((d) => d.id),
  );
  const start = [...compiled.progression.start];
  if (compiled.documents[compiled.meta.intro] && !start.includes(compiled.meta.intro)) {
    start.unshift(compiled.meta.intro);
  }
  return {
    documents: new Map(
      Object.values(compiled.documents).map((d) => [
        d.id,
        {
          id: d.id,
          optional: optionalDocs.has(d.id),
          keywords: d.keywords,
          norm: prep.documents.get(d.id)?.norm ?? ' ',
          portraits: d.reveals?.portraits ?? [],
          occupations: d.reveals?.occupations ?? [],
        },
      ]),
    ),
    start,
    unlocks: compiled.progression.unlocks,
    keywords: new Map(
      Object.values(compiled.keywords).map((k) => [
        k.id,
        { hidden: !!k.hiddenTerm, results: k.results },
      ]),
    ),
    places: new Map(
      Object.entries(compiled.places).map(([id, p]) => [
        id,
        { ...(p.revealedBy ? { revealedBy: p.revealedBy } : {}), documents: p.documents },
      ]),
    ),
    slots,
    claimedPortraits,
    claimedOccupations,
    groups: new Map(compiled.groups.map((g) => [g.id, { slots: g.slots, threshold: g.threshold }])),
    occupationsUnlock: compiled.progression.occupationsUnlock ?? {},
    secrets: new Map(compiled.progression.secrets.map((s) => [s.id, s.discoveredBy])),
    endings: new Map(Object.entries(compiled.endings).map(([id, e]) => [id, e.when])),
    report: compiled.report,
  };
}
