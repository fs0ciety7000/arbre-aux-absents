/**
 * Sauvegarde jointe à un signalement (case « Joindre ma sauvegarde anonymisée », DESIGN §13.8).
 * Module pur.
 *
 * Ce qui est **retiré** :
 * - le texte des notes du Carnet (`notebook.notes[].text` → chaîne vide) : texte libre ;
 * - les recherches tapées (`searchLog[].query` → chaîne vide) : texte libre ; le mot-clé reconnu
 *   (`keyword`, un id du contenu) et l'heure restent ;
 * - tout champ inconnu du contrat (la copie est reconstruite champ par champ).
 *
 * Ce qui **reste** : la progression (ids de documents, de cases, de lieux), l'arbre (prénoms,
 * noms, portraits et métiers posés : ce sont les champs de réponse, utiles pour comprendre un
 * blocage), les surlignages (positions seulement), les réponses au rapport final. Une partie ne
 * contient aucun nom de joueur ; le profil (réglages, succès) n'est jamais joint.
 *
 * Trop volumineuse (> 48 Ko de JSON) : le journal de recherche est raccourci (les plus anciennes
 * d'abord), puis les surlignages sont retirés ; si cela ne suffit pas, rien n'est joint.
 */
import { REPORT_LIMITS, type SaveState } from '@arbre/contract';

export interface AnonymisedSave {
  save: SaveState;
  /** Notes dont le texte a été retiré. */
  notes: number;
  /** Recherches dont le texte tapé a été retiré. */
  queries: number;
  /** Entrées du journal de recherche retirées pour tenir dans la limite. */
  trimmedSearches: number;
  /** Surlignages retirés pour tenir dans la limite. */
  droppedHighlights: number;
}

const copyRecord = <V>(r: Record<string, V>): Record<string, V> => ({ ...r });

/** Copie anonymisée (sans limite de taille). */
export function stripSave(s: SaveState): SaveState {
  return {
    schemaVersion: s.schemaVersion,
    caseId: s.caseId,
    contentHash: s.contentHash,
    edition: s.edition,
    slot: s.slot,
    mode: s.mode,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    elapsedMs: s.elapsedMs,
    unlocked: copyRecord(s.unlocked),
    read: copyRecord(s.read),
    searched: [...s.searched],
    searchLog: s.searchLog.map((e) => ({ query: '', keyword: e.keyword, at: e.at })),
    visited: [...s.visited],
    revealedSlots: [...s.revealedSlots],
    tree: Object.fromEntries(
      Object.entries(s.tree).map(([id, g]) => [
        id,
        { given: g.given, family: g.family, portrait: g.portrait, occupation: g.occupation },
      ]),
    ),
    locked: copyRecord(s.locked),
    secrets: copyRecord(s.secrets),
    hintsUsed: copyRecord(s.hintsUsed),
    notebook: {
      pins: s.notebook.pins.map((p) => ({ kind: p.kind, id: p.id })),
      highlights: s.notebook.highlights.map((h) => ({
        doc: h.doc,
        path: [...h.path],
        start: h.start,
        end: h.end,
        color: h.color,
        ...(h.lang ? { lang: h.lang } : {}),
      })),
      notes: s.notebook.notes.map((n) => ({
        id: n.id,
        ...(n.target ? { target: { kind: n.target.kind, id: n.target.id } } : {}),
        text: '',
        at: n.at,
      })),
    },
    report: copyRecord(s.report),
    ending: s.ending,
  };
}

const size = (v: unknown) => JSON.stringify(v).length;

/**
 * Sauvegarde anonymisée qui tient dans `maxChars` caractères de JSON, ou `null` si c'est
 * impossible même sans journal de recherche ni surlignages.
 */
export function anonymiseSave(
  s: SaveState,
  maxChars: number = REPORT_LIMITS.saveJson,
): AnonymisedSave | null {
  const save = stripSave(s);
  const out: AnonymisedSave = {
    save,
    notes: s.notebook.notes.filter((n) => n.text.length > 0).length,
    queries: s.searchLog.filter((e) => e.query.length > 0).length,
    trimmedSearches: 0,
    droppedHighlights: 0,
  };
  if (size(save) <= maxChars) return out;
  // Journal de recherche : on garde les plus récentes, par moitiés.
  while (save.searchLog.length > 0 && size(save) > maxChars) {
    const keep = Math.floor(save.searchLog.length / 2);
    out.trimmedSearches += save.searchLog.length - keep;
    save.searchLog = save.searchLog.slice(save.searchLog.length - keep);
  }
  if (size(save) > maxChars && save.notebook.highlights.length > 0) {
    out.droppedHighlights = save.notebook.highlights.length;
    save.notebook.highlights = [];
  }
  return size(save) <= maxChars ? out : null;
}
