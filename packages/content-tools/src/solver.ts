/**
 * Solveur (ARCHITECTURE §3.7 règle 6) : exploration du graphe de déblocage par point fixe, sur
 * le contenu source, sans dépendre du moteur. Modèle d'un joueur méthodique : il lit tout ce qui
 * est débloqué, visite tout lieu visible, cherche tout mot-clé lu, et établit une case dès
 * qu'elle est déductible (nom lu dans ≥ 2 documents, portrait et métier débloqués) en respectant
 * le seuil des groupes.
 *
 * Hypothèses (documentées dans le rapport) : les mots-clés `hiddenTerm` sont supposés déduits dès
 * le début ; les cases pré-remplies sont établies d'emblée ; `timedUnderMs` est ignoré.
 */
import type { Condition, OutcomeCondition } from '@arbre/contract';
import { evaluate, negatedAtoms, type AtomRef, type EvalState } from './conditions';
import type { ReportQuestion } from '@arbre/contract';

export interface SolverDocument {
  id: string;
  optional: boolean;
  keywords: readonly string[];
  /** Texte normalisé entouré d'espaces. */
  norm: string;
  portraits: readonly string[];
  occupations: readonly string[];
}

export interface SolverSlot {
  id: string;
  prefilled: boolean;
  revealedBy?: Condition;
  /** Noms normalisés (variantes). */
  given: readonly string[];
  family: readonly string[];
  portrait: string;
  occupation: string;
}

export interface SolverModel {
  documents: ReadonlyMap<string, SolverDocument>;
  start: readonly string[];
  unlocks: Readonly<Record<string, Condition>>;
  keywords: ReadonlyMap<
    string,
    { hidden: boolean; results: readonly { documents: readonly string[]; requires?: Condition }[] }
  >;
  places: ReadonlyMap<
    string,
    { revealedBy?: Condition; documents: readonly { id: string; requires?: Condition }[] }
  >;
  slots: ReadonlyMap<string, SolverSlot>;
  groups: ReadonlyMap<string, { slots: readonly string[]; threshold: number }>;
  occupationsUnlock: Readonly<Record<string, Condition>>;
  secrets: ReadonlyMap<string, Condition>;
  endings: ReadonlyMap<string, OutcomeCondition>;
  /** Rapport final (questions posées au dénouement). */
  report: readonly ReportQuestion[];
}

export type SolverAction =
  | { type: 'read'; id: string }
  | { type: 'visit'; id: string }
  | { type: 'search'; id: string }
  | { type: 'lock'; group: string; slots: string[] };

export interface SolverStep {
  step: number;
  action: SolverAction;
  unlocked: string[];
  secrets: string[];
  revealedSlots: string[];
}

export interface SlotEvidence {
  step: number;
  givenDocs: string[];
  familyDocs: string[];
  portraitDocs: string[];
  occupationFrom: string[];
}

export interface SolverResult {
  steps: SolverStep[];
  unlocked: Set<string>;
  read: Set<string>;
  searched: Set<string>;
  visited: Set<string>;
  locked: Set<string>;
  secrets: Set<string>;
  revealedSlots: Set<string>;
  /** Fin → première étape où sa condition est vraie (exploration libre ou contrainte). */
  endings: Map<string, number>;
  /** Fins vraies dans l'état final (100 %), pour au moins une combinaison de réponses. */
  endingsAtEnd: string[];
  /** Fin → combinaison de réponses au rapport qui la rend vraie (si des réponses servent). */
  endingAnswers: Map<string, Record<string, string>>;
  /** Nombre de combinaisons de réponses explorées à 100 %. */
  reportCombinations: number;
  evidence: Map<string, SlotEvidence>;
  /** Pourquoi chaque case non établie bloque. */
  blockedSlots: Map<string, string[]>;
}

class State implements EvalState {
  unlocked = new Set<string>();
  read = new Set<string>();
  searched = new Set<string>();
  visited = new Set<string>();
  locked = new Set<string>();
  secrets = new Set<string>();
  revealedSlots = new Set<string>();
  visiblePlaces = new Set<string>();
  known = new Set<string>();
  portraits = new Map<string, string[]>();
  answers: ReadonlyMap<string, string> = new Map();
  constructor(readonly groups: Map<string, readonly string[]>) {}

  clone(): State {
    const s = new State(this.groups);
    for (const k of [
      'unlocked',
      'read',
      'searched',
      'visited',
      'locked',
      'secrets',
      'revealedSlots',
      'visiblePlaces',
      'known',
    ] as const) {
      s[k] = new Set(this[k]);
    }
    s.portraits = new Map(this.portraits);
    return s;
  }
}

function settle(
  m: SolverModel,
  s: State,
): { unlocked: string[]; secrets: string[]; revealed: string[] } {
  const delta = { unlocked: [] as string[], secrets: [] as string[], revealed: [] as string[] };
  const unlock = (id: string) => {
    if (!m.documents.has(id) || s.unlocked.has(id)) return false;
    s.unlocked.add(id);
    delta.unlocked.push(id);
    return true;
  };
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of m.start) changed = unlock(id) || changed;
    for (const [id, cond] of Object.entries(m.unlocks)) {
      if (!s.unlocked.has(id) && evaluate(cond, s)) changed = unlock(id) || changed;
    }
    for (const kw of s.searched) {
      for (const r of m.keywords.get(kw)?.results ?? []) {
        if (!r.requires || evaluate(r.requires, s)) {
          for (const d of r.documents) changed = unlock(d) || changed;
        }
      }
    }
    for (const p of s.visited) {
      for (const d of m.places.get(p)?.documents ?? []) {
        if (!d.requires || evaluate(d.requires, s)) changed = unlock(d.id) || changed;
      }
    }
    for (const [id, cond] of m.secrets) {
      if (!s.secrets.has(id) && evaluate(cond, s)) {
        s.secrets.add(id);
        delta.secrets.push(id);
        changed = true;
      }
    }
    for (const [id, slot] of m.slots) {
      if (!s.revealedSlots.has(id) && (!slot.revealedBy || evaluate(slot.revealedBy, s))) {
        s.revealedSlots.add(id);
        delta.revealed.push(id);
        changed = true;
      }
    }
    for (const [id, place] of m.places) {
      if (!s.visiblePlaces.has(id) && (!place.revealedBy || evaluate(place.revealedBy, s))) {
        s.visiblePlaces.add(id);
        changed = true;
      }
    }
  }
  return delta;
}

function docsMentioning(m: SolverModel, s: State, names: readonly string[]): string[] {
  const out: string[] = [];
  for (const id of s.read) {
    const d = m.documents.get(id);
    if (d && names.some((n) => n && d.norm.includes(` ${n} `))) out.push(id);
  }
  return out;
}

/** Évidence disponible pour une case, ou liste des manques. */
function slotEvidence(
  m: SolverModel,
  s: State,
  slot: SolverSlot,
): { ok: true; ev: Omit<SlotEvidence, 'step'> } | { ok: false; missing: string[] } {
  const givenDocs = docsMentioning(m, s, slot.given);
  const familyDocs = docsMentioning(m, s, slot.family);
  const portraitDocs = [...s.read].filter((d) =>
    m.documents.get(d)?.portraits.includes(slot.portrait),
  );
  const occupationFrom = [...s.read].filter((d) =>
    m.documents.get(d)?.occupations.includes(slot.occupation),
  );
  const unlockCond = m.occupationsUnlock[slot.occupation];
  if (unlockCond && evaluate(unlockCond, s)) occupationFrom.push('(occupationsUnlock)');
  const missing: string[] = [];
  if (!s.revealedSlots.has(slot.id)) missing.push('case jamais révélée');
  if (givenDocs.length < 2) missing.push(`prénom lu dans ${givenDocs.length} document(s) (< 2)`);
  if (familyDocs.length < 2) missing.push(`nom lu dans ${familyDocs.length} document(s) (< 2)`);
  if (portraitDocs.length === 0) missing.push('portrait jamais débloqué');
  if (occupationFrom.length === 0) missing.push('métier jamais débloqué');
  if (missing.length) return { ok: false, missing };
  return { ok: true, ev: { givenDocs, familyDocs, portraitDocs, occupationFrom } };
}

function candidateActions(m: SolverModel, s: State): SolverAction[] {
  const out: SolverAction[] = [];
  for (const id of s.unlocked) if (!s.read.has(id)) out.push({ type: 'read', id });
  for (const id of s.visiblePlaces) if (!s.visited.has(id)) out.push({ type: 'visit', id });
  for (const id of s.known) if (!s.searched.has(id)) out.push({ type: 'search', id });
  for (const [gid, g] of m.groups) {
    const remaining = g.slots.filter((id) => !s.locked.has(id));
    if (remaining.length === 0) continue;
    const lockable = remaining.filter((id) => {
      const slot = m.slots.get(id);
      return !!slot && slotEvidence(m, s, slot).ok;
    });
    if (lockable.length > 0 && lockable.length >= Math.min(g.threshold, remaining.length)) {
      out.push({ type: 'lock', group: gid, slots: lockable });
    }
  }
  return out;
}

function apply(
  m: SolverModel,
  s: State,
  a: SolverAction,
  evidence: Map<string, SlotEvidence>,
  step: number,
) {
  switch (a.type) {
    case 'read': {
      s.read.add(a.id);
      for (const k of m.documents.get(a.id)?.keywords ?? []) if (m.keywords.has(k)) s.known.add(k);
      break;
    }
    case 'visit':
      s.visited.add(a.id);
      break;
    case 'search':
      s.searched.add(a.id);
      break;
    case 'lock':
      for (const id of a.slots) {
        const slot = m.slots.get(id)!;
        const ev = slotEvidence(m, s, slot);
        if (ev.ok) evidence.set(id, { step, ...ev.ev });
        s.locked.add(id);
      }
      break;
  }
}

function atomTrue(a: AtomRef, s: State): boolean {
  switch (a.kind) {
    case 'read':
      return s.read.has(a.id);
    case 'unlocked':
      return s.unlocked.has(a.id);
    case 'searched':
      return s.searched.has(a.id);
    case 'visited':
      return s.visited.has(a.id);
    case 'locked':
      return s.locked.has(a.id);
    case 'secret':
      return s.secrets.has(a.id);
    case 'groupLocked': {
      const g = s.groups.get(a.id);
      return !!g && g.length > 0 && g.every((id) => s.locked.has(id));
    }
    default:
      return false;
  }
}

/** Vue d'évaluation d'un état (copie superficielle des ensembles). */
function stateView(s: State): EvalState {
  return {
    read: s.read,
    unlocked: s.unlocked,
    searched: s.searched,
    visited: s.visited,
    locked: s.locked,
    secrets: s.secrets,
    groups: s.groups,
  };
}

interface RunResult {
  state: State;
  steps: SolverStep[];
  evidence: Map<string, SlotEvidence>;
  endings: Map<string, number>;
}

function run(m: SolverModel, forbidden: AtomRef[] = [], maxSteps = 100_000): RunResult {
  const groups = new Map<string, readonly string[]>([...m.groups].map(([k, g]) => [k, g.slots]));
  let s = new State(groups);
  for (const [id, slot] of m.slots) if (slot.prefilled) s.locked.add(id);
  for (const [id, k] of m.keywords) if (k.hidden) s.known.add(id);
  const steps: SolverStep[] = [];
  const evidence = new Map<string, SlotEvidence>();
  const endings = new Map<string, number>();
  const checkEndings = (step: number) => {
    for (const [id, cond] of m.endings) {
      if (!endings.has(id) && evaluate(cond, s)) endings.set(id, step);
    }
  };
  const first = settle(m, s);
  steps.push({ step: 0, action: { type: 'read', id: '(départ)' }, ...renameDelta(first) });
  if (forbidden.some((a) => atomTrue(a, s))) return { state: s, steps, evidence, endings };
  checkEndings(0);
  for (let step = 1; step <= maxSteps; step++) {
    const actions = candidateActions(m, s);
    let done = false;
    for (const a of actions) {
      const next = forbidden.length ? s.clone() : s;
      const ev = forbidden.length ? new Map(evidence) : evidence;
      apply(m, next, a, ev, step);
      const delta = settle(m, next);
      if (forbidden.length && forbidden.some((f) => atomTrue(f, next))) continue;
      s = next;
      if (ev !== evidence) for (const [k, v] of ev) evidence.set(k, v);
      steps.push({ step, action: a, ...renameDelta(delta) });
      checkEndings(step);
      done = true;
      break;
    }
    if (!done) break;
  }
  return { state: s, steps, evidence, endings };
}

function renameDelta(d: { unlocked: string[]; secrets: string[]; revealed: string[] }) {
  return { unlocked: d.unlocked, secrets: d.secrets, revealedSlots: d.revealed };
}

/** Plafond des combinaisons de réponses explorées. */
export const MAX_REPORT_COMBINATIONS = 4096;

/**
 * Combinaisons de réponses au rapport final dans un état donné : une question n'est posée que si
 * `askedWhen` est vraie (avec les réponses précédentes), ses options filtrées par `availableWhen`.
 */
export function reportCombinations(
  report: readonly ReportQuestion[],
  s: EvalState,
  limit = MAX_REPORT_COMBINATIONS,
): Map<string, string>[] {
  let combos: Map<string, string>[] = [new Map()];
  for (const q of report) {
    const next: Map<string, string>[] = [];
    for (const combo of combos) {
      const st: EvalState = { ...s, answers: combo };
      const options =
        q.askedWhen && !evaluate(q.askedWhen, st)
          ? []
          : q.options.filter((o) => !o.availableWhen || evaluate(o.availableWhen, st));
      if (options.length === 0) next.push(combo);
      for (const o of options) next.push(new Map(combo).set(q.id, o.id));
    }
    combos = next.slice(0, limit);
  }
  return combos;
}

/** Résout un modèle : exploration libre puis, pour chaque fin non atteinte, exploration évitant ses négations. */
export function solve(m: SolverModel): SolverResult {
  const main = run(m);
  const s = main.state;
  const endings = new Map(main.endings);
  const endingAnswers = new Map<string, Record<string, string>>();
  const mainCombos = reportCombinations(m.report, s);
  const viaAnswers = (
    id: string,
    cond: OutcomeCondition,
    st: State,
    combos: Map<string, string>[],
    step: number,
  ) => {
    for (const combo of combos) {
      if (evaluate(cond, { ...stateView(st), answers: combo })) {
        endings.set(id, step);
        if (combo.size) endingAnswers.set(id, Object.fromEntries(combo));
        return true;
      }
    }
    return false;
  };
  const lastStep = main.steps.length - 1;
  for (const [id, cond] of m.endings) {
    if (endings.has(id)) continue;
    if (viaAnswers(id, cond, s, mainCombos, lastStep)) continue;
    const neg = negatedAtoms(cond).filter((a) => a.kind !== 'answered');
    if (neg.length === 0) continue;
    const alt = run(m, neg);
    const at = alt.endings.get(id);
    if (at !== undefined) endings.set(id, at);
    else {
      viaAnswers(
        id,
        cond,
        alt.state,
        reportCombinations(m.report, alt.state),
        alt.steps.length - 1,
      );
    }
  }
  const endingsAtEnd = [...m.endings]
    .filter(([, c]) => mainCombos.some((combo) => evaluate(c, { ...stateView(s), answers: combo })))
    .map(([id]) => id);
  const blockedSlots = new Map<string, string[]>();
  for (const [id, slot] of m.slots) {
    if (s.locked.has(id)) continue;
    const ev = slotEvidence(m, s, slot);
    blockedSlots.set(id, ev.ok ? ['seuil du groupe jamais atteint'] : ev.missing);
  }
  return {
    steps: main.steps,
    unlocked: s.unlocked,
    read: s.read,
    searched: s.searched,
    visited: s.visited,
    locked: s.locked,
    secrets: s.secrets,
    revealedSlots: s.revealedSlots,
    endings,
    endingsAtEnd,
    endingAnswers,
    reportCombinations: mainCombos.length,
    evidence: main.evidence,
    blockedSlots,
  };
}
