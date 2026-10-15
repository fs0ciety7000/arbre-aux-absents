<!--
  P10 — Sélecteur de candidat, monté par le Bureau quand `ui.picking` n'est pas nul.
  Prénom / nom : candidats lus (`availableNames`), « vu dans : … » ; métier : métiers
  découverts → `Dialog size="s" mobile="fullscreen"` + `Combobox mode="inline"`.
  Portrait : grande grille des visages collectés (`PortraitPicker`, `Dialog size="xl"`).
-->
<script lang="ts">
  import type { SlotGuess } from '@arbre/contract';
  import { availableNames, availableOccupations, availablePortraits } from '@arbre/engine';
  import { Button, Combobox, Dialog, type Candidate } from '@arbre/ui';
  import PortraitPicker from './PortraitPicker.svelte';
  import { getGame } from '../lib/game/context';
  import { initialFocus } from '../lib/game/initial-focus';
  import {
    claimView,
    fieldValueLabel,
    guessOf,
    occupationOrigins,
    seenIn,
    usageCount,
  } from './lib/view';
  import { FIELD_ARTICLES, FIELD_LABELS, pm } from './messages';

  const game = getGame();
  const picking = $derived(game.ui.picking);
  let open = $state(true);
  let query = $state('');

  const field = $derived(picking?.field ?? 'given');
  const slot = $derived(picking?.slot ?? '');
  const guess = $derived(slot ? guessOf(game.state, game.content, slot) : null);
  const currentValue = $derived(guess ? (guess[field] ?? null) : null);
  /** Case revendiquée : rappel non sélectionnable de la valeur déclarée (AFFAIRE-2 §1.4). */
  const declaredLabel = $derived.by(() => {
    if (!slot || !claimView(game.state, game.content, slot).open) return null;
    const g = game.content.slots[slot]?.claimedGuess ?? null;
    return fieldValueLabel(game.content, field, g);
  });

  const options: Candidate[] = $derived.by(() => {
    const s = game.state;
    const c = game.content;
    const note = (v: string) => {
      const n = usageCount(s, c, field, v, slot);
      return n > 0 ? pm.common.usedIn(n) : undefined;
    };
    if (field === 'given' || field === 'family') {
      return availableNames(s, c)[field].map((n) => ({
        id: n.value,
        label: n.value,
        detail: seenIn(c, n.documents) || undefined,
        note: note(n.value),
      }));
    }
    if (field === 'occupation') {
      return availableOccupations(s, c).map((o) => ({
        id: o,
        label: c.occupations[o]?.label ?? o,
        detail: seenIn(c, occupationOrigins(s, c, o)) || undefined,
        note: note(o),
      }));
    }
    return [];
  });

  const portraits = $derived(
    field === 'portrait' ? availablePortraits(game.state, game.content) : [],
  );
  const isEmpty = $derived(field === 'portrait' ? portraits.length === 0 : options.length === 0);

  function choose(value: string) {
    if (!slot) return;
    game.dispatch({ type: 'setSlot', slot, patch: { [field]: value } as Partial<SlotGuess> });
    open = false;
  }

  function clearField() {
    if (!slot) return;
    const patch: Partial<SlotGuess> =
      field === 'portrait' || field === 'occupation' ? { [field]: null } : { [field]: '' };
    game.dispatch({ type: 'setSlot', slot, patch });
    open = false;
  }

  function close() {
    game.ui.picking = null;
  }

  function whereToLook() {
    open = false;
    game.navigate({ kind: 'panel', id: 'help' });
  }
</script>

{#if picking}
  <Dialog
    bind:open
    title={pm.picker.title(FIELD_LABELS[field])}
    size={field === 'portrait' && !isEmpty ? 'xl' : 's'}
    mobile="fullscreen"
    onclose={close}
  >
    {#if declaredLabel && field !== 'portrait'}
      <p class="declared">
        {pm.picker.declared} <span class="claim-value">{declaredLabel}</span>
        {pm.picker.declaredSource}
      </p>
    {/if}
    {#if isEmpty}
      <div class="empty" use:initialFocus={'button'}>
        <p>{pm.picker.empty(FIELD_ARTICLES[field])}</p>
        <Button iconName="help" onclick={whereToLook}>{pm.common.whereToLook}</Button>
      </div>
    {:else if field === 'portrait'}
      <PortraitPicker {slot} {currentValue} declared={declaredLabel} onchoose={choose} />
    {:else}
      <div class="filter" use:initialFocus={'input'}>
        <Combobox
          label={pm.picker.filter}
          {options}
          value={currentValue}
          bind:query
          mode="inline"
          listLabel={pm.picker.listLabel}
          emptyText={pm.picker.noMatch}
          onselect={choose}
        />
      </div>
    {/if}
    {#snippet actions()}
      {#if currentValue}
        <Button variant="ghost" iconName="trash" onclick={clearField}>{pm.picker.clear}</Button>
      {/if}
      <Button onclick={() => (open = false)}>{pm.common.close}</Button>
    {/snippet}
  </Dialog>
{/if}

<style>
  .declared {
    margin: 0 0 var(--space-3);
    color: var(--text-muted);
  }
  .empty {
    display: grid;
    gap: var(--space-3);
    justify-items: start;
  }
  .empty p {
    margin: 0;
  }
</style>
