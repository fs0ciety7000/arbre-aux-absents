import type { CompiledCase, GameEvent, SaveState, Transition } from '@arbre/contract';
import { evaluate, own } from './conditions';

/**
 * Point fixe des déblocages (ARCHITECTURE §3.5) : documents (`progression.unlocks`),
 * cases cachées (`revealedBy`), secrets (`discoveredBy`). Les conditions étant monotones,
 * l'état ne fait que croître et la boucle termine (au plus une passe par élément).
 * Horodatage : `s.updatedAt`. Renvoie `s` tel quel si rien ne change.
 */
export function settle(s: SaveState, c: CompiledCase): Transition {
  const at = s.updatedAt;
  const unlocked: Record<string, number> = { ...s.unlocked };
  const revealedSlots = [...s.revealedSlots];
  const secrets: Record<string, number> = { ...s.secrets };
  // Brouillon local : ses tables sont neuves, `s` n'est jamais modifié.
  const draft: SaveState = { ...s, unlocked, revealedSlots, secrets };

  const newDocs: string[] = [];
  const newSlots: string[] = [];
  const newSecrets: string[] = [];

  for (let changed = true; changed;) {
    changed = false;
    for (const [doc, cond] of Object.entries(c.progression.unlocks)) {
      if (own(unlocked, doc) !== undefined || own(c.documents, doc) === undefined) continue;
      if (evaluate(cond, draft, c)) {
        unlocked[doc] = at;
        newDocs.push(doc);
        changed = true;
      }
    }
    for (const [id, slot] of Object.entries(c.slots)) {
      if (slot.revealedBy === undefined || revealedSlots.includes(id)) continue;
      if (evaluate(slot.revealedBy, draft, c)) {
        revealedSlots.push(id);
        newSlots.push(id);
        changed = true;
      }
    }
    for (const secret of c.progression.secrets) {
      if (own(secrets, secret.id) !== undefined) continue;
      if (evaluate(secret.discoveredBy, draft, c)) {
        secrets[secret.id] = at;
        newSecrets.push(secret.id);
        changed = true;
      }
    }
  }

  if (newDocs.length + newSlots.length + newSecrets.length === 0) return { state: s, events: [] };
  const events: GameEvent[] = [];
  if (newDocs.length > 0) events.push({ type: 'documentsUnlocked', ids: newDocs });
  if (newSlots.length > 0) events.push({ type: 'slotsRevealed', ids: newSlots });
  for (const id of newSecrets) events.push({ type: 'secretFound', id });
  return { state: { ...s, unlocked, revealedSlots, secrets }, events };
}
