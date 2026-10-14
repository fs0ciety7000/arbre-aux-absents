/**
 * Case revendiquée (AFFAIRE-2 §1) côté jeu : dérivations d'affichage (`guessOf` sans repli sur
 * la déclaration, `claimView`, `usageCount`), rendu de la case dans l'arbre et annonces du store.
 */
import type { CompiledCase, SaveState, SaveStore, SlotGuess } from '@arbre/contract';
import { defaultProfile, defaultSettings } from '@arbre/contract';
import { newGame } from '@arbre/engine';
import { render } from 'svelte/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CLAIM,
  CLAIMED_SLOT,
  claimedCase,
} from '../../../../../packages/engine/test/fixtures/claimed';
import { announcer } from '../../lib/game/announcer.svelte';
import { GameStoreImpl, type StoreHost } from '../../lib/game/store.svelte';
import {
  claimDocument,
  claimFields,
  claimView,
  guessOf,
  hasClaim,
  slotName,
  usageCount,
} from '../lib/view';
import TreeHarness from './TreeHarness.svelte';

const c: CompiledCase = claimedCase;
const EMPTY: Partial<SlotGuess> = { given: '', family: '', portrait: null, occupation: null };

function host(): StoreHost {
  return {
    settings: { ...defaultSettings(), validation: 'manual' },
    profile: defaultProfile(),
    saveStore: {} as SaveStore,
    updateSettings: () => {},
    unlockAchievements: () => {},
    showEnding: () => {},
    showReport: () => {},
    saveStatus: () => {},
    overlayOpen: false,
  };
}

/** Nouvelle partie où tout est lu (noms, visages et métiers proposables). */
function fresh(): SaveState {
  const s = newGame(c, { slot: 'slot-1', mode: 'standard', at: 1 });
  const all = Object.fromEntries(Object.keys(c.documents).map((id) => [id, 1]));
  return { ...s, unlocked: all, read: all, revealedSlots: Object.keys(c.slots) };
}
const store = (s: SaveState = fresh()) => new GameStoreImpl(c, s, host());
const withSlot = (s: SaveState, patch: Partial<SlotGuess>): SaveState => ({
  ...s,
  tree: { ...s.tree, [CLAIMED_SLOT]: { ...s.tree[CLAIMED_SLOT]!, ...patch } },
});

const html = (g: GameStoreImpl) =>
  render(TreeHarness, { props: { game: g } })
    .body.replace(/<!--[^]*?-->/g, '')
    .replace(/ svelte-[a-z0-9]+/g, '');

/** Le bouton de la case revendiquée dans la vue graphe (balise ouvrante → `</button>`). */
function claimedCard(out: string): string {
  const at = out.indexOf(`data-slot="${CLAIMED_SLOT}"`);
  const start = out.lastIndexOf('<button', at);
  return out.slice(start, out.indexOf('</button>', at));
}

describe('dérivations (view.ts)', () => {
  it('guessOf ne retombe jamais sur la déclaration : une déclaration effacée ne revient pas', () => {
    const s = fresh();
    expect(guessOf(s, c, CLAIMED_SLOT)).toEqual(CLAIM);
    const cleared = withSlot(s, EMPTY);
    expect(guessOf(cleared, c, CLAIMED_SLOT)).toEqual(EMPTY);
    expect(slotName(cleared, c, CLAIMED_SLOT)).toBeNull();
    // Case absente de la sauvegarde (parseSave ne repose jamais une déclaration) : vide.
    const { [CLAIMED_SLOT]: _gone, ...tree } = s.tree;
    expect(guessOf({ ...s, tree }, c, CLAIMED_SLOT)).toBeNull();
  });

  it('usageCount ne compte pas une valeur déclarée retirée', () => {
    const s = fresh();
    expect(usageCount(s, c, 'portrait', CLAIM.portrait!)).toBe(1);
    expect(usageCount(withSlot(s, { portrait: null }), c, 'portrait', CLAIM.portrait!)).toBe(0);
  });

  it('claimView : champs déclarés, marque tant qu’il en reste un, rien une fois établie', () => {
    const s = fresh();
    expect(hasClaim(c, CLAIMED_SLOT)).toBe(true);
    expect(hasClaim(c, 'g1-lisbe')).toBe(false);
    expect(claimFields(c, CLAIMED_SLOT)).toEqual(['given', 'family', 'portrait', 'occupation']);

    const v0 = claimView(s, c, CLAIMED_SLOT);
    expect(v0.claimed).toBe(true);
    expect([...v0.declared].sort()).toEqual(['family', 'given', 'occupation', 'portrait']);

    // Remplacé par le joueur : ce champ n'est plus déclaré, la marque reste.
    const v1 = claimView(withSlot(s, { portrait: 'p-tam' }), c, CLAIMED_SLOT);
    expect(v1.claimed).toBe(true);
    expect(v1.declared.has('portrait')).toBe(false);
    expect(v1.declared.size).toBe(3);

    // Tout retiré : case ordinaire, « Rétablir » reste possible (open).
    const v2 = claimView(withSlot(s, EMPTY), c, CLAIMED_SLOT);
    expect(v2).toMatchObject({ claimed: false, open: true });
    expect(v2.declared.size).toBe(0);

    // Re-choisir la valeur déclarée la rend « déclarée » (état déduit, jamais mémorisé).
    const v3 = claimView(withSlot(withSlot(s, EMPTY), { given: 'Tam' }), c, CLAIMED_SLOT);
    expect([...v3.declared]).toEqual(['given']);

    // Établie : ni marque ni actions.
    const locked = { ...s, locked: { ...s.locked, [CLAIMED_SLOT]: 5 } };
    expect(claimView(locked, c, CLAIMED_SLOT)).toMatchObject({ claimed: false, open: false });
    // Case ordinaire.
    expect(claimView(s, c, 'g1-lisbe')).toMatchObject({ claimed: false, open: false });
  });

  it('claimDocument : une pièce existante pour « Voir la requête », rien sans déclaration', () => {
    const doc = claimDocument(c, CLAIMED_SLOT);
    expect(doc).not.toBeNull();
    expect(c.documents[doc!]).toBeDefined();
    expect(claimDocument(c, 'g1-lisbe')).toBeNull();
  });
});

describe('case revendiquée dans l’arbre (TreePanel)', () => {
  it('tirets, cartouche « Déclaré », valeurs entre « » et nom accessible détaillé', () => {
    const card = claimedCard(html(store()));
    expect(card).toMatch(/class="[^"]*\bclaim-frame\b/);
    expect(card).toContain('claim-tag');
    expect(card).toContain('Déclaré');
    expect(card.match(/class="[^"]*claim-value/g)?.length).toBe(3); // prénom, nom, métier
    expect(card).toMatch(/aria-label="Génération \d+, case revendiquée, non établie\./);
    expect(card).toContain('Prénom : Tam, déclaré.');
    expect(card).toContain('Nom : Marrel, déclaré.');
    expect(card).not.toMatch(/class="lock|Établi/);
  });

  it('un champ posé par le joueur perd ses guillemets et se lit « posé par vous »', () => {
    const card = claimedCard(html(store(withSlot(fresh(), { given: 'Oren' }))));
    expect(card).toMatch(/\bclaim-frame\b/);
    expect(card).toContain('Prénom : Oren, posé par vous.');
    expect(card.match(/class="[^"]*claim-value/g)?.length).toBe(2);
  });

  it('déclaration entièrement retirée : case ordinaire (ni tirets, ni cartouche)', () => {
    const card = claimedCard(html(store(withSlot(fresh(), EMPTY))));
    expect(card).not.toMatch(/\bclaim-frame\b/);
    expect(card).not.toContain('claim-tag');
    expect(card).not.toContain('revendiquée');
  });
});

describe('annonces (store)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function said(fn: () => void): string {
    vi.useFakeTimers();
    fn();
    vi.advanceTimersByTime(100);
    return announcer.polite;
  }

  it('champ retiré, remplacé, déclaration retirée puis rétablie', () => {
    // Secrets déjà trouvés : leurs annonces ne recouvrent pas celles de la déclaration.
    const secrets = Object.fromEntries(c.progression.secrets.map((x) => [x.id, 1]));
    const g = store({ ...fresh(), secrets });
    expect(
      said(() => g.dispatch({ type: 'setSlot', slot: CLAIMED_SLOT, patch: { portrait: null } })),
    ).toBe('Portrait déclaré retiré. Rétablir la déclaration : menu de la case.');
    expect(
      said(() => g.dispatch({ type: 'setSlot', slot: CLAIMED_SLOT, patch: { given: 'Oren' } })),
    ).toBe('Prénom : Oren, posé. 2 champs déclarés sur 4.');
    expect(
      said(() =>
        g.dispatch({
          type: 'setSlot',
          slot: CLAIMED_SLOT,
          patch: { family: '', occupation: null },
        }),
      ),
    ).toBe('Déclaration retirée : 2 champs vidés.');
    expect(
      said(() => g.dispatch({ type: 'setSlot', slot: CLAIMED_SLOT, patch: { ...CLAIM } })),
    ).toBe('Déclaration rétablie.');
  });
});
