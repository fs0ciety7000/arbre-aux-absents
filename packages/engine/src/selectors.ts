import type {
  Block,
  CompiledCase,
  DocumentId,
  EndingId,
  GroupId,
  Hint,
  HintId,
  KeywordId,
  OccupationId,
  PlaceId,
  PortraitId,
  PortraitKind,
  ReportQuestion,
  SaveState,
  SlotGuess,
  SlotId,
} from '@arbre/contract';
import { holds, own } from './conditions';
import { normalize } from './normalize';
import { documentMentions } from './text';
import { isSlotVisible } from './validation';

const byTimeThenId = (rec: Readonly<Record<string, number>>) => (a: string, b: string) =>
  (rec[a] ?? 0) - (rec[b] ?? 0) || (a < b ? -1 : a > b ? 1 : 0);

/** Documents lus, dans l'ordre de lecture (puis par id), limités à ceux du contenu. */
export function readDocuments(s: SaveState, c: CompiledCase): DocumentId[] {
  return Object.keys(s.read)
    .filter((id) => own(c.documents, id) !== undefined)
    .sort(byTimeThenId(s.read));
}

/** Aide « pastilles non lu » : débloqués non lus, du plus ancien au plus récent. */
export function unreadDocuments(s: SaveState, c: CompiledCase): DocumentId[] {
  return Object.keys(s.unlocked)
    .filter((id) => own(c.documents, id) !== undefined && own(s.read, id) === undefined)
    .sort(byTimeThenId(s.unlocked));
}

/** Cases visibles : sans condition de révélation, ou révélées. Ordre du contenu. */
export function visibleSlots(s: SaveState, c: CompiledCase): SlotId[] {
  return Object.keys(c.slots).filter((id) => isSlotVisible(id, s, c));
}

/**
 * Carnet : mots-clés lus dans les documents (ordre de découverte), puis mots-clés
 * recherchés. Un terme caché (`hiddenTerm`) n'est connu qu'une fois recherché.
 */
export function knownKeywords(s: SaveState, c: CompiledCase): KeywordId[] {
  const out = new Set<KeywordId>();
  for (const docId of readDocuments(s, c)) {
    for (const kw of c.documents[docId]?.keywords ?? []) {
      const def = own(c.keywords, kw);
      if (def && !def.hiddenTerm) out.add(kw);
    }
  }
  for (const kw of s.searched) if (own(c.keywords, kw)) out.add(kw);
  return [...out];
}

/** Nombre de documents lus qui citent chaque mot-clé connu. */
export function keywordMentions(s: SaveState, c: CompiledCase): Record<KeywordId, number> {
  const counts: Record<KeywordId, number> = {};
  for (const docId of readDocuments(s, c)) {
    for (const kw of new Set(c.documents[docId]?.keywords ?? []))
      counts[kw] = (counts[kw] ?? 0) + 1;
  }
  return counts;
}

/** Documents qu'une recherche du mot-clé renverrait maintenant (conditions remplies). */
export function keywordDocuments(kw: KeywordId, s: SaveState, c: CompiledCase): DocumentId[] {
  const def = own(c.keywords, kw);
  if (!def) return [];
  const out = new Set<DocumentId>();
  for (const r of def.results) {
    if (!holds(r.requires, s, c)) continue;
    for (const d of r.documents) if (own(c.documents, d)) out.add(d);
  }
  return [...out];
}

/** Aide « termes épuisés » : mots-clés connus dont toutes les fiches accessibles sont ouvertes. */
export function exhaustedKeywords(s: SaveState, c: CompiledCase): KeywordId[] {
  return knownKeywords(s, c).filter((kw) =>
    keywordDocuments(kw, s, c).every((d) => own(s.unlocked, d) !== undefined),
  );
}

/**
 * Valeurs posées par le contenu : cases pré-remplies et cases revendiquées. Elles sont
 * disponibles d'emblée et le restent même retirées de leur case (on peut reposer une valeur
 * déclarée ailleurs).
 */
function seededGuesses(c: CompiledCase): SlotGuess[] {
  return Object.values(c.slots).flatMap((x) => [
    ...(x.prefilledGuess ? [x.prefilledGuess] : []),
    ...(x.claimedGuess ? [x.claimedGuess] : []),
  ]);
}

export type SlotStatus = 'locked' | 'claimed' | 'filled' | 'empty';

const GUESS_FIELDS = ['given', 'family', 'portrait', 'occupation'] as const;

/**
 * Champs d'une case revendiquée encore égaux à la déclaration (AFFAIRE-2 §1.2 : l'état
 * « déclaré » se déduit, il n'est pas mémorisé). Vide si la case n'est pas revendiquée,
 * est verrouillée, ou si la déclaration ne porte pas sur ce champ (valeur vide).
 */
export function claimedFields(slot: SlotId, s: SaveState, c: CompiledCase): (keyof SlotGuess)[] {
  const claim = own(c.slots, slot)?.claimedGuess;
  if (!claim || own(s.locked, slot) !== undefined) return [];
  const g = own(s.tree, slot);
  if (!g) return [];
  return GUESS_FIELDS.filter((f) => {
    const v = claim[f];
    return v !== null && v !== '' && g[f] === v;
  });
}

/**
 * État d'affichage d'une case : `locked` (établie), `claimed` (revendiquée, non verrouillée et
 * identique champ à champ à la déclaration), `filled` (au moins un champ rempli), `empty`.
 */
export function slotStatus(slot: SlotId, s: SaveState, c: CompiledCase): SlotStatus {
  if (own(s.locked, slot) !== undefined) return 'locked';
  const g = own(s.tree, slot);
  const claim = own(c.slots, slot)?.claimedGuess;
  if (g && claim && GUESS_FIELDS.every((f) => g[f] === claim[f])) return 'claimed';
  if (g && (g.given !== '' || g.family !== '' || g.portrait !== null || g.occupation !== null))
    return 'filled';
  return 'empty';
}

/** Type d'un portrait (`Portrait.kind`, absent = `face`) ; portrait inconnu : `face`. */
export function portraitKindOf(portrait: PortraitId, c: CompiledCase): PortraitKind {
  return own(c.portraits, portrait)?.kind ?? 'face';
}

/** Type du champ « portrait » d'une case (`portraitKind`, absent = `face`) ; case inconnue : `face`. */
export function slotPortraitKind(slot: SlotId, c: CompiledCase): PortraitKind {
  return own(c.slots, slot)?.portraitKind ?? 'face';
}

/**
 * Galerie : portraits révélés par les documents lus (ordre de découverte), posés d'emblée
 * compris. Avec `kind`, seulement ceux de ce type (sélecteur d'une case : `slotPortraitKind`).
 */
export function availablePortraits(
  s: SaveState,
  c: CompiledCase,
  kind?: PortraitKind,
): PortraitId[] {
  const out = new Set<PortraitId>();
  for (const g of seededGuesses(c))
    if (g.portrait && own(c.portraits, g.portrait)) out.add(g.portrait);
  for (const docId of readDocuments(s, c)) {
    for (const p of c.documents[docId]?.reveals?.portraits ?? [])
      if (own(c.portraits, p)) out.add(p);
  }
  const all = [...out];
  return kind === undefined ? all : all.filter((p) => portraitKindOf(p, c) === kind);
}

/** Métiers découverts : révélés par les documents lus, ou débloqués par condition. */
export function availableOccupations(s: SaveState, c: CompiledCase): OccupationId[] {
  const out = new Set<OccupationId>();
  for (const g of seededGuesses(c)) {
    if (g.occupation && own(c.occupations, g.occupation)) out.add(g.occupation);
  }
  for (const docId of readDocuments(s, c)) {
    for (const o of c.documents[docId]?.reveals?.occupations ?? []) {
      if (own(c.occupations, o)) out.add(o);
    }
  }
  for (const [o, cond] of Object.entries(c.progression.occupationsUnlock ?? {})) {
    if (own(c.occupations, o) && holds(cond, s, c)) out.add(o);
  }
  return [...out];
}

export interface NameCandidate {
  /** Graphie proposée (celle de `CompiledCase.candidates`). */
  value: string;
  /** Documents lus qui la contiennent, dans l'ordre de lecture (« vu dans : … »). */
  documents: DocumentId[];
}

export interface AvailableNames {
  given: NameCandidate[];
  family: NameCandidate[];
}

function collectNames(
  list: readonly string[],
  docs: readonly DocumentId[],
  prefilled: readonly string[],
  c: CompiledCase,
): NameCandidate[] {
  const found: { cand: NameCandidate; order: number }[] = [];
  const seen = new Set<string>();
  list.forEach((value) => {
    const norm = normalize(value);
    if (norm === '' || seen.has(norm)) return;
    const documents = docs.filter((d) => {
      const doc = own(c.documents, d);
      return doc !== undefined && documentMentions(doc, norm);
    });
    const isPrefilled = prefilled.some((p) => normalize(p) === norm);
    if (documents.length === 0 && !isPrefilled) return;
    seen.add(norm);
    const first = documents[0];
    found.push({
      cand: { value, documents },
      order: first === undefined ? -1 : docs.indexOf(first),
    });
  });
  return found.sort((a, b) => a.order - b.order).map((x) => x.cand);
}

/**
 * Candidats prénom et nom : ceux de `candidates` lus (mots entiers, accents et casse
 * ignorés) dans au moins un document lu, plus ceux des cases pré-remplies et revendiquées. Triés par
 * ordre de découverte.
 */
export function availableNames(s: SaveState, c: CompiledCase): AvailableNames {
  const docs = readDocuments(s, c);
  const pre = seededGuesses(c);
  return {
    given: collectNames(
      c.candidates.given,
      docs,
      pre.map((g) => g.given),
      c,
    ),
    family: collectNames(
      c.candidates.family,
      docs,
      pre.map((g) => g.family),
      c,
    ),
  };
}

/** Retrouve la graphie canonique d'un nom découvert, ou `null` s'il n'est pas disponible. */
export function matchName(value: string, names: readonly NameCandidate[]): string | null {
  const norm = normalize(value);
  if (norm === '') return null;
  return names.find((n) => normalize(n.value) === norm)?.value ?? null;
}

export type PlaceState = 'mentioned' | 'open' | 'exhausted';

export interface VisiblePlace {
  id: PlaceId;
  /** Mentionné (jamais ouvert), ouvert, épuisé (tous ses documents débloqués). */
  state: PlaceState;
}

export function isPlaceVisible(id: PlaceId, s: SaveState, c: CompiledCase): boolean {
  const p = own(c.places, id);
  return p !== undefined && holds(p.revealedBy, s, c);
}

/** Documents d'un lieu accessibles maintenant (conditions remplies). */
export function placeDocuments(id: PlaceId, s: SaveState, c: CompiledCase): DocumentId[] {
  const p = own(c.places, id);
  if (!p) return [];
  return p.documents
    .filter((d) => own(c.documents, d.id) !== undefined && holds(d.requires, s, c))
    .map((d) => d.id);
}

/** Lieux visibles sur la carte, dans l'ordre du contenu. */
export function visiblePlaces(s: SaveState, c: CompiledCase): VisiblePlace[] {
  return Object.keys(c.places)
    .filter((id) => isPlaceVisible(id, s, c))
    .map((id) => {
      if (!s.visited.includes(id)) return { id, state: 'mentioned' as const };
      const all = (c.places[id]?.documents ?? []).every((d) => own(s.unlocked, d.id) !== undefined);
      return { id, state: all ? ('exhausted' as const) : ('open' as const) };
    });
}

export interface PlaceCounter {
  id: PlaceId;
  /** Documents du lieu déjà débloqués. */
  found: number;
  /** « Fiches à trouver » : accessibles maintenant et pas encore débloquées. */
  remaining: number;
  /**
   * Le fonds garde des pièces ni débloquées ni accessibles (condition pas encore remplie) : elles
   * s'ouvriront plus tard avec l'enquête. Booléen, sans nombre, pour ne rien divulguer.
   */
  pending: boolean;
}

/**
 * Compteurs par lieu visible (aide « compteur par lieu », niveau 1, et signal de réouverture :
 * un lieu déjà ouvert avec `remaining > 0` a des pièces devenues accessibles depuis la visite).
 */
export function placeCounters(s: SaveState, c: CompiledCase): PlaceCounter[] {
  return visiblePlaces(s, c).map(({ id }) => {
    const docs = (c.places[id]?.documents ?? []).filter(
      (d) => own(c.documents, d.id) !== undefined,
    );
    const locked = docs.filter((d) => own(s.unlocked, d.id) === undefined);
    const found = docs.length - locked.length;
    const remaining = locked.filter((d) => holds(d.requires, s, c)).length;
    return { id, found, remaining, pending: locked.length > remaining };
  });
}

export type WhereToLook =
  | { kind: 'document'; id: DocumentId }
  | { kind: 'keyword'; id: KeywordId }
  | { kind: 'place'; id: PlaceId };

/**
 * Aide « Où chercher ? » (GAME_DESIGN §10) : document non lu le plus ancien, sinon terme
 * connu dont la recherche ouvrirait une fiche (non recherché d'abord, puis le plus cité),
 * sinon lieu non ouvert ou à rouvrir. Ne parle jamais de l'arbre ; `null` si rien.
 */
export function whereToLook(s: SaveState, c: CompiledCase): WhereToLook | null {
  const unread = unreadDocuments(s, c)[0];
  if (unread !== undefined) return { kind: 'document', id: unread };

  const mentions = keywordMentions(s, c);
  const productive = knownKeywords(s, c)
    .map((id, order) => ({ id, order }))
    .filter(({ id }) => keywordDocuments(id, s, c).some((d) => own(s.unlocked, d) === undefined))
    .sort(
      (a, b) =>
        Number(s.searched.includes(a.id)) - Number(s.searched.includes(b.id)) ||
        (mentions[b.id] ?? 0) - (mentions[a.id] ?? 0) ||
        a.order - b.order,
    );
  const kw = productive[0];
  if (kw) return { kind: 'keyword', id: kw.id };

  const places = placeCounters(s, c);
  const fresh = places.find((p) => !s.visited.includes(p.id));
  if (fresh) return { kind: 'place', id: fresh.id };
  const reopen = places.find((p) => p.remaining > 0);
  if (reopen) return { kind: 'place', id: reopen.id };
  return null;
}

export interface Progress {
  /** Cases établies (pré-remplies comprises). */
  locked: number;
  total: number;
  /** Cases visibles (les cachées apparaissent au fil de l'enquête) : dénominateur affiché. */
  visible: number;
  /** [0, 1] */
  ratio: number;
  secrets: number;
}

/** Compteur de l'arbre et des secrets (en-tête, résumé de sauvegarde). */
export function progress(s: SaveState, c: CompiledCase): Progress {
  const total = Object.keys(c.slots).length;
  const locked = Object.keys(s.locked).filter((id) => own(c.slots, id) !== undefined).length;
  const secrets = c.progression.secrets.filter((x) => own(s.secrets, x.id) !== undefined).length;
  const visible = visibleSlots(s, c).length;
  return { locked, total, visible, ratio: total === 0 ? 0 : locked / total, secrets };
}

/** Fin vraie de plus haute priorité (à égalité : id le plus petit), ou `null`. */
export function endingFor(s: SaveState, c: CompiledCase): EndingId | null {
  let best: { id: EndingId; priority: number } | null = null;
  for (const id of Object.keys(c.endings).sort()) {
    const e = c.endings[id];
    if (!e || !holds(e.when, s, c)) continue;
    if (best === null || e.priority > best.priority) best = { id, priority: e.priority };
  }
  return best?.id ?? null;
}

export interface HintStatus {
  id: HintId;
  level: Hint['level'];
  used: boolean;
  /** Utilisable maintenant (condition remplie, paliers inférieurs utilisés, case ouverte). */
  available: boolean;
  /** Texte, seulement une fois l'indice utilisé (aucune fuite). */
  text?: string;
}

export type HintTarget = { slot: SlotId } | { group: GroupId };

function sameTarget(a: Hint['target'], b: HintTarget): boolean {
  if ('slot' in a) return 'slot' in b && a.slot === b.slot;
  return 'group' in b && a.group === b.group;
}

function targetClosed(t: Hint['target'], s: SaveState, c: CompiledCase): boolean {
  if ('slot' in t) return own(s.locked, t.slot) !== undefined || !isSlotVisible(t.slot, s, c);
  const g = c.groups.find((x) => x.id === t.group);
  return !g || g.slots.every((id) => own(s.locked, id) !== undefined);
}

/** Raison pour laquelle un indice n'est pas utilisable, ou `null` s'il l'est. */
export function hintBlocker(hint: Hint, s: SaveState, c: CompiledCase): 'notAvailable' | null {
  if (s.mode === 'timed') return 'notAvailable';
  if (targetClosed(hint.target, s, c)) return 'notAvailable';
  if (!holds(hint.availableWhen, s, c)) return 'notAvailable';
  const lowerUnused = c.hints.some(
    (h) =>
      h.level < hint.level &&
      sameTarget(h.target, hint.target) &&
      own(s.hintsUsed, h.id) === undefined,
  );
  return lowerUnused ? 'notAvailable' : null;
}

/** Indices progressifs d'une case ou d'un groupe, par palier croissant. */
export function hintsFor(target: HintTarget, s: SaveState, c: CompiledCase): HintStatus[] {
  return c.hints
    .filter((h) => sameTarget(h.target, target))
    .sort((a, b) => a.level - b.level || (a.id < b.id ? -1 : 1))
    .map((h) => {
      const used = own(s.hintsUsed, h.id) !== undefined;
      return {
        id: h.id,
        level: h.level,
        used,
        available: !used && hintBlocker(h, s, c) === null,
        ...(used ? { text: h.text } : {}),
      };
    });
}

export interface EndingSection {
  label: string | null;
  title: string | null;
  body: Block[];
}

/** Sections d'une fin à afficher : `when` absente ou vraie, dans l'ordre du fichier. */
export function endingSections(endingId: EndingId, s: SaveState, c: CompiledCase): EndingSection[] {
  const ending = own(c.endings, endingId);
  if (!ending) return [];
  return ending.sections
    .filter((x) => holds(x.when, s, c))
    .map((x) => ({ label: x.label, title: x.title, body: x.body }));
}

export interface ReportQuestionView {
  id: string;
  prompt: string;
  kind: ReportQuestion['kind'];
  /**
   * Options disponibles maintenant (`availableWhen` absente ou vraie), plus les indisponibles
   * qui portent une `unavailableReason` (à montrer grisées, jamais choisissables), dans
   * l'ordre du contenu.
   */
  options: { id: string; label: string; unavailableReason?: string }[];
  /** Réponse actuelle, ou `null`. */
  answer: string | null;
}

/** Une question est posée si elle existe et que `askedWhen` est absente ou vraie. */
export function isQuestionAsked(q: ReportQuestion, s: SaveState, c: CompiledCase): boolean {
  return holds(q.askedWhen, s, c);
}

export function isOptionAvailable(
  q: ReportQuestion,
  optionId: string,
  s: SaveState,
  c: CompiledCase,
): boolean {
  const o = q.options.find((x) => x.id === optionId);
  return o !== undefined && holds(o.availableWhen, s, c);
}

/** Rapport final : questions posées, options disponibles, réponse actuelle (ordre du contenu). */
export function reportQuestions(s: SaveState, c: CompiledCase): ReportQuestionView[] {
  return (c.report ?? [])
    .filter((q) => isQuestionAsked(q, s, c))
    .map((q) => ({
      id: q.id,
      prompt: q.prompt,
      kind: q.kind,
      options: q.options.flatMap((o) => {
        if (holds(o.availableWhen, s, c)) return [{ id: o.id, label: o.label }];
        return o.unavailableReason
          ? [{ id: o.id, label: o.label, unavailableReason: o.unavailableReason }]
          : [];
      }),
      answer: (s.report && own(s.report, q.id)) ?? null,
    }));
}

/**
 * Rend le rapport cohérent : retire (jusqu'au point fixe) les réponses à des questions
 * inconnues ou plus posées, ou dont l'option est inconnue ou indisponible. Renvoie le
 * rapport nettoyé et les questions retirées ; `report` d'entrée n'est jamais modifié.
 */
export function pruneReport(
  report: Readonly<Record<string, string>>,
  s: SaveState,
  c: CompiledCase,
): { report: Record<string, string>; removed: string[] } {
  const out: Record<string, string> = { ...report };
  const removed: string[] = [];
  const questions = c.report ?? [];
  for (let changed = true; changed;) {
    changed = false;
    const view: SaveState = { ...s, report: out };
    for (const [qid, option] of Object.entries(out)) {
      const q = questions.find((x) => x.id === qid);
      if (q && isQuestionAsked(q, view, c) && isOptionAvailable(q, option, view, c)) continue;
      delete out[qid];
      removed.push(qid);
      changed = true;
      break;
    }
  }
  return { report: out, removed };
}
