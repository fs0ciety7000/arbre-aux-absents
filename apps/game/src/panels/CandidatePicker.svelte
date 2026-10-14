<!--
  P10 — Sélecteur de candidat, monté par le Bureau quand `ui.picking` n'est pas nul.
  Prénom / nom : candidats lus (`availableNames`), « vu dans : … » ; portrait : galerie des
  visages collectés ; métier : métiers découverts. Popover (desktop), feuille (tablette),
  plein écran (téléphone) : `Dialog mobile="fullscreen"` + `Combobox mode="inline"`.
-->
<script lang="ts">
  import type { SlotGuess } from '@arbre/contract';
  import { availableNames, availableOccupations, availablePortraits } from '@arbre/engine';
  import { Button, Combobox, Dialog, Icon, type Candidate } from '@arbre/ui';
  import { svgContent } from '@arbre/map/svelte';
  import { portraitSvg } from './lib/assets.svelte';
  import { getGame } from '../lib/game/context';
  import { initialFocus } from '../lib/game/initial-focus';
  import {
    claimView,
    fieldValueLabel,
    guessOf,
    occupationOrigins,
    portraitOrigins,
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

  // Galerie : grille, flèches pour se déplacer (roving tabindex).
  let activePortrait = $state(0);
  function onGalleryKey(e: KeyboardEvent) {
    const cols = Math.max(1, Math.floor((e.currentTarget as HTMLElement).clientWidth / 112));
    const step: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: cols,
      ArrowUp: -cols,
    };
    let next = activePortrait;
    if (e.key in step) next += step[e.key]!;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = portraits.length - 1;
    else return;
    e.preventDefault();
    activePortrait = Math.max(0, Math.min(portraits.length - 1, next));
    (e.currentTarget as HTMLElement)
      .querySelector<HTMLElement>(`[data-index="${activePortrait}"]`)
      ?.focus();
  }
</script>

{#if picking}
  <Dialog
    bind:open
    title={pm.picker.title(FIELD_LABELS[field])}
    size="s"
    mobile="fullscreen"
    onclose={close}
  >
    {#if declaredLabel}
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
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <ul
        class="gallery"
        aria-label={pm.picker.gallery}
        onkeydown={onGalleryKey}
        use:initialFocus={'[tabindex="0"]'}
      >
        {#each portraits as p, i (p)}
          {@const pr = game.content.portraits[p]}
          {@const used = usageCount(game.state, game.content, 'portrait', p, slot)}
          <li>
            <button
              type="button"
              class="face"
              data-index={i}
              data-verb="take"
              tabindex={i === activePortrait ? 0 : -1}
              aria-pressed={currentValue === p}
              onclick={() => choose(p)}
            >
              <span class="art-face" use:svgContent={portraitSvg(game.content, p)}></span>
              <span class="alt">{pr?.alt ?? p}</span>
              <span class="detail"
                >{seenIn(game.content, portraitOrigins(game.state, game.content, p), 1)}</span
              >
              {#if used > 0}<span class="detail">{pm.common.usedIn(used)}</span>{/if}
              {#if currentValue === p}<span class="current"
                  ><Icon name="check" size="1rem" /> {pm.picker.current}</span
                >{/if}
            </button>
          </li>
        {/each}
      </ul>
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
  .gallery {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
    gap: var(--space-3);
  }
  .face {
    display: grid;
    gap: var(--space-1);
    inline-size: 100%;
    min-block-size: var(--hit);
    padding: var(--space-2);
    border: var(--border) solid var(--line-strong);
    border-radius: var(--radius-m);
    background: var(--surface-2);
    color: var(--text);
    font: inherit;
    text-align: start;
  }
  .face[aria-pressed='true'] {
    border-color: var(--accent);
    border-width: var(--border-strong);
  }
  .art-face {
    display: block;
    aspect-ratio: 4 / 5;
    background: var(--art-paper);
    border-radius: var(--radius-xs);
    overflow: hidden;
  }
  .art-face :global(svg) {
    inline-size: 100%;
    block-size: 100%;
  }
  .alt {
    line-height: var(--leading-snug);
  }
  .detail {
    color: var(--text-muted);
    font-size: var(--step--1);
  }
  .current {
    display: inline-flex;
    gap: var(--space-1);
    align-items: center;
    color: var(--accent);
  }
</style>
