import type {
  CompiledCase,
  ParseSaveResult,
  Pin,
  SaveSlotSummary,
  SaveState,
} from '@arbre/contract';
import { SAVE_LIMITS, SaveStateSchema } from '@arbre/contract';
import { own } from './conditions';
import { progress, pruneReport } from './selectors';
import { settle } from './settle';

export const CURRENT_SAVE_VERSION = 1;

/** Taille maximale acceptée d'une sauvegarde sérialisée (cible GAME_DESIGN §11 : < 500 Ko). */
export const MAX_SAVE_CHARS = 2_000_000;

/** Migration de la version `n` vers `n + 1`, sur un objet JSON brut (pur, sans mutation). */
export type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;

/** Migrations par version de départ. Aucune pour l'instant (schéma 1). */
export const SAVE_MIGRATIONS: Readonly<Record<number, Migration>> = Object.freeze({});

type MigrateResult = { ok: true; raw: Record<string, unknown> } | { ok: false; error: string };

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** Applique la chaîne de migrations jusqu'à `target`. Refuse les versions futures. */
export function migrateSave(
  raw: Record<string, unknown>,
  migrations: Readonly<Record<number, Migration>> = SAVE_MIGRATIONS,
  target: number = CURRENT_SAVE_VERSION,
): MigrateResult {
  let current = raw;
  const initial = current['schemaVersion'];
  if (typeof initial !== 'number' || !Number.isInteger(initial) || initial < 0) {
    return { ok: false, error: 'Version de sauvegarde absente ou invalide.' };
  }
  let version: number = initial;
  if (version > target) {
    return { ok: false, error: 'Sauvegarde créée par une version plus récente du jeu.' };
  }
  while (version < target) {
    const step = migrations[version];
    if (!step) return { ok: false, error: `Aucune migration depuis la version ${version}.` };
    try {
      current = step(current);
    } catch {
      return { ok: false, error: `Migration depuis la version ${version} impossible.` };
    }
    if (current['schemaVersion'] !== version + 1) {
      return { ok: false, error: `Migration depuis la version ${version} incohérente.` };
    }
    version += 1;
  }
  return { ok: true, raw: current };
}

/** Coupe les listes trop longues avant validation (sauvegardes d'avant les limites). */
function clampLists(raw: Record<string, unknown>): Record<string, unknown> {
  const out = { ...raw };
  // Champ ajouté au schéma 1 avec le rapport final : absent des sauvegardes antérieures.
  if (out['report'] === undefined) out['report'] = {};
  if (Array.isArray(out['searchLog']))
    out['searchLog'] = out['searchLog'].slice(-SAVE_LIMITS.searchLog);
  const nb = out['notebook'];
  if (isRecord(nb) && Array.isArray(nb['pins'])) {
    out['notebook'] = { ...nb, pins: nb['pins'].slice(0, SAVE_LIMITS.pins) };
  }
  return out;
}

function filterRecord<T>(
  rec: Record<string, T>,
  keep: (id: string) => boolean,
  label: string,
  dropped: string[],
): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [id, v] of Object.entries(rec)) {
    if (keep(id)) out[id] = v;
    else dropped.push(`${label}:${id}`);
  }
  return out;
}

function filterList(
  list: string[],
  keep: (id: string) => boolean,
  label: string,
  dropped: string[],
): string[] {
  const out: string[] = [];
  for (const id of list) {
    if (out.includes(id)) continue;
    if (keep(id)) out.push(id);
    else dropped.push(`${label}:${id}`);
  }
  return out;
}

function pinKnown(p: Pin, c: CompiledCase): boolean {
  if (p.kind === 'document') return own(c.documents, p.id) !== undefined;
  if (p.kind === 'keyword') return own(c.keywords, p.id) !== undefined;
  return own(c.slots, p.id) !== undefined;
}

/** Retire tout id que le contenu ne connaît plus ; liste ce qui a été retiré. */
function dropUnknown(s: SaveState, c: CompiledCase, dropped: string[]): SaveState {
  const doc = (id: string) => own(c.documents, id) !== undefined;
  const slot = (id: string) => own(c.slots, id) !== undefined;

  const unlocked = filterRecord(s.unlocked, doc, 'document', dropped);
  const read = filterRecord(s.read, doc, 'document', dropped);
  for (const [id, t] of Object.entries(read)) unlocked[id] ??= t; // lu ⇒ débloqué

  const tree: SaveState['tree'] = {};
  for (const [id, g] of Object.entries(filterRecord(s.tree, slot, 'slot', dropped))) {
    const guess = { ...g };
    if (guess.portrait !== null && own(c.portraits, guess.portrait) === undefined) {
      dropped.push(`portrait:${guess.portrait}`);
      guess.portrait = null;
    }
    if (guess.occupation !== null && own(c.occupations, guess.occupation) === undefined) {
      dropped.push(`occupation:${guess.occupation}`);
      guess.occupation = null;
    }
    tree[id] = guess;
  }
  const locked = filterRecord(s.locked, slot, 'slot', dropped);
  for (const id of Object.keys(locked)) {
    if (own(tree, id) === undefined) {
      delete locked[id];
      dropped.push(`locked:${id}`);
    }
  }
  // Cases pré-remplies ajoutées par une mise à jour du contenu. Une case revendiquée
  // (`claimedGuess`) n'est jamais reposée : le joueur a pu effacer la déclaration.
  for (const [id, def] of Object.entries(c.slots)) {
    if (def.prefilled && def.prefilledGuess && own(locked, id) === undefined) {
      tree[id] = { ...def.prefilledGuess };
      locked[id] = s.updatedAt;
    }
  }
  for (const id of [...c.progression.start, c.meta.intro]) {
    if (doc(id)) unlocked[id] ??= s.createdAt;
  }

  const searchLog = s.searchLog.map((e) => {
    if (e.keyword === null || own(c.keywords, e.keyword) !== undefined) return e;
    dropped.push(`keyword:${e.keyword}`);
    return { ...e, keyword: null };
  });

  const pins = s.notebook.pins.filter((p) => {
    const ok = pinKnown(p, c);
    if (!ok) dropped.push(`pin:${p.kind}:${p.id}`);
    return ok;
  });
  const highlights = s.notebook.highlights.filter((h) => {
    const ok = doc(h.doc);
    if (!ok) dropped.push(`highlight:${h.doc}`);
    return ok;
  });
  const notes = s.notebook.notes.map((n) => {
    if (!n.target || pinKnown(n.target, c)) return n;
    dropped.push(`note-target:${n.target.kind}:${n.target.id}`);
    return { id: n.id, text: n.text, at: n.at };
  });

  const questions = c.report ?? [];
  const report: Record<string, string> = {};
  for (const [qid, option] of Object.entries(s.report)) {
    const q = questions.find((x) => x.id === qid);
    if (!q) dropped.push(`report-question:${qid}`);
    else if (!q.options.some((o) => o.id === option))
      dropped.push(`report-option:${qid}:${option}`);
    else report[qid] = option;
  }

  let ending = s.ending;
  if (ending !== null && own(c.endings, ending) === undefined) {
    dropped.push(`ending:${ending}`);
    ending = null;
  }

  return {
    ...s,
    contentHash: c.contentHash,
    edition: c.edition,
    unlocked,
    read,
    searched: filterList(s.searched, (id) => own(c.keywords, id) !== undefined, 'keyword', dropped),
    searchLog,
    visited: filterList(s.visited, (id) => own(c.places, id) !== undefined, 'place', dropped),
    revealedSlots: filterList(s.revealedSlots, slot, 'slot', dropped),
    tree,
    locked,
    secrets: filterRecord(
      s.secrets,
      (id) => c.progression.secrets.some((x) => x.id === id),
      'secret',
      dropped,
    ),
    hintsUsed: filterRecord(s.hintsUsed, (id) => c.hints.some((h) => h.id === id), 'hint', dropped),
    notebook: { pins, highlights, notes },
    report,
    ending,
  };
}

/**
 * Lecture d'une sauvegarde importée ou chargée (JSON texte ou objet) : migrations,
 * validation zod stricte, contrôle de l'affaire, retrait des ids inconnus du contenu
 * (`dropped`), puis point fixe des déblocages. Jamais d'exception.
 */
export function parseSave(raw: unknown, c: CompiledCase): ParseSaveResult {
  let value = raw;
  if (typeof value === 'string') {
    if (value.length > MAX_SAVE_CHARS) return { ok: false, error: 'Sauvegarde trop volumineuse.' };
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return { ok: false, error: 'Sauvegarde illisible (JSON invalide).' };
    }
  }
  if (!isRecord(value)) return { ok: false, error: 'Sauvegarde illisible (objet attendu).' };

  const migrated = migrateSave(value);
  if (!migrated.ok) return migrated;

  const parsed = SaveStateSchema.safeParse(clampLists(migrated.raw));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue && issue.path.length > 0 ? ` (${issue.path.join('.')})` : '';
    return { ok: false, error: `Sauvegarde corrompue${where}.` };
  }
  const state = parsed.data as SaveState;
  if (state.caseId !== c.id) {
    return { ok: false, error: 'Cette sauvegarde appartient à une autre affaire.' };
  }

  const dropped: string[] = [];
  const cleaned = settle(dropUnknown(state, c, dropped), c).state;
  // Réponses à des questions plus posées (ou options indisponibles) : retirées, rapport cohérent.
  const pruned = pruneReport(cleaned.report, cleaned, c);
  for (const qid of pruned.removed) dropped.push(`report-unasked:${qid}`);
  const final = pruned.removed.length > 0 ? { ...cleaned, report: pruned.report } : cleaned;
  return { ok: true, state: final, dropped };
}

/** Résumé d'un emplacement pour l'écran de chargement. */
export function summarize(s: SaveState, c: CompiledCase): SaveSlotSummary {
  return {
    slot: s.slot,
    caseTitle: c.meta.title,
    updatedAt: s.updatedAt,
    elapsedMs: s.elapsedMs,
    mode: s.mode,
    progress: progress(s, c).ratio,
  };
}
