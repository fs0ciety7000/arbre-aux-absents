<!--
  Fiche d'une case (P01) : les quatre champs en lignes de 56 px, chacun ouvre le sélecteur de
  candidat (P10) ; bouton « vider » par champ (confirmation si l'option est active). Case
  établie : lecture seule, tampon.
-->
<script lang="ts">
  import type { SlotGuess, SlotId } from '@arbre/contract';
  import { Button, Dialog, Icon, IconButton, Stamp } from '@arbre/ui';
  import { svgContent } from '@arbre/map/svelte';
  import { portraitSvg } from '../lib/assets.svelte';
  import { getGame } from '../../lib/game/context';
  import type { SlotField } from '../../lib/game/types';
  import { carry } from '../lib/carry.svelte';
  import { fieldValueLabel, guessOf, slotName } from '../lib/view';
  import { FIELD_LABELS, pm } from '../messages';

  interface Props {
    slot: SlotId | null;
    onclose: () => void;
  }
  let { slot, onclose }: Props = $props();

  const game = getGame();
  const FIELDS: SlotField[] = ['given', 'family', 'portrait', 'occupation'];

  let open = $derived(slot !== null);

  const locked = $derived(slot !== null && game.state.locked[slot] !== undefined);
  const guess = $derived(slot ? guessOf(game.state, game.content, slot) : null);
  const group = $derived(
    slot ? game.content.groups.find((g) => g.slots.includes(slot)) : undefined,
  );
  const title = $derived(
    slot ? (slotName(game.state, game.content, slot) ?? pm.tree.unknownPerson) : '',
  );

  let confirming = $state<SlotField | null>(null);

  function pick(field: SlotField) {
    if (!slot || locked) return;
    if (carry.accepts(field)) {
      const value = carry.item!.patch[field];
      game.dispatch({ type: 'setSlot', slot, patch: { [field]: value } as Partial<SlotGuess> });
      carry.drop();
      return;
    }
    game.navigate({ kind: 'slot', id: slot, field });
  }

  function clear(field: SlotField) {
    if (!slot || locked) return;
    const patch: Partial<SlotGuess> =
      field === 'portrait' || field === 'occupation' ? { [field]: null } : { [field]: '' };
    game.dispatch({ type: 'setSlot', slot, patch });
    confirming = null;
  }

  function askClear(field: SlotField) {
    if (game.settings.confirmClear) confirming = field;
    else clear(field);
  }

  function onRowKey(e: KeyboardEvent, field: SlotField) {
    if ((e.key === 'Delete' || e.key === 'Backspace') && !locked && guess?.[field]) {
      e.preventDefault();
      askClear(field);
    }
  }
</script>

<Dialog bind:open {title} kicker={pm.tree.sheetKicker} size="s" mobile="sheet" {onclose}>
  {#if slot}
    {#if group}<p class="group">{pm.tree.group(group.label)}</p>{/if}
    {#if locked}
      <p class="locked"><Icon name="lock" /> {pm.tree.sheetLocked}</p>
      <div class="stamp"><Stamp size="s" /></div>
    {/if}
    <ul class="fields">
      {#each FIELDS as field (field)}
        {@const value = fieldValueLabel(game.content, field, guess)}
        {@const accepts = carry.accepts(field)}
        <li class="row" class:accepts>
          <button
            type="button"
            class="field"
            data-verb={locked ? undefined : accepts ? 'use' : 'write'}
            aria-disabled={locked || undefined}
            aria-haspopup={locked || accepts ? undefined : 'dialog'}
            onclick={() => pick(field)}
            onkeydown={(e) => onRowKey(e, field)}
          >
            <span class="label caps">{FIELD_LABELS[field]}</span>
            <span class="value">
              {#if field === 'portrait' && guess?.portrait && game.content.portraits[guess.portrait]}
                <span class="thumb" use:svgContent={portraitSvg(game.content, guess.portrait)}
                ></span>
              {/if}
              {#if value}<span>{value}</span>{:else}<span class="empty">{pm.tree.fieldEmpty}</span
                >{/if}
            </span>
            <span class="verb">
              {#if locked}<Icon name="lock" />{:else if accepts}<Icon name="use" />
                <span>{pm.tree.carryDrop}</span>{:else}<Icon name="write" />{/if}
            </span>
          </button>
          {#if !locked && value}
            <IconButton
              icon="close"
              label={pm.tree.clearField(FIELD_LABELS[field])}
              onclick={() => askClear(field)}
            />
          {/if}
        </li>
      {/each}
    </ul>
    {#if confirming}
      <div class="confirm" role="alertdialog" aria-label={pm.tree.confirmClear}>
        <p>{pm.tree.confirmClear} ({FIELD_LABELS[confirming]})</p>
        <Button variant="danger" onclick={() => confirming && clear(confirming)}
          >{pm.common.confirm}</Button
        >
        <Button variant="ghost" onclick={() => (confirming = null)}>{pm.common.cancel}</Button>
      </div>
    {/if}
  {/if}
</Dialog>

<style>
  .group {
    margin: 0 0 var(--space-3);
    color: var(--text-muted);
  }
  .locked {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    margin: 0 0 var(--space-3);
    color: var(--established);
  }
  .stamp {
    display: flex;
    justify-content: flex-end;
    margin-block-end: var(--space-2);
  }
  .fields {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--space-2);
  }
  .row {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }
  .row.accepts .field {
    background: var(--accent-tint);
    border-color: var(--accent);
  }
  .field {
    flex: 1;
    display: grid;
    grid-template-columns: minmax(5.5rem, auto) 1fr auto;
    align-items: center;
    gap: var(--space-3);
    min-block-size: var(--hit-row);
    padding: var(--space-2) var(--space-3);
    border: var(--border) solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--surface-2);
    color: var(--text);
    font: inherit;
    text-align: start;
  }
  .field[aria-disabled='true'] {
    border-color: var(--established);
    border-width: var(--border-strong);
  }
  .field:not([aria-disabled='true']):hover {
    background: var(--surface-3);
  }
  .label {
    color: var(--text-muted);
  }
  .value {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    min-inline-size: 0;
    overflow-wrap: anywhere;
  }
  .empty {
    color: var(--text-muted);
    font-style: italic;
  }
  .verb {
    display: inline-flex;
    gap: var(--space-1);
    align-items: center;
    color: var(--accent);
  }
  .thumb {
    inline-size: var(--space-10);
    block-size: var(--space-12);
    flex: none;
    border-radius: var(--radius-xs);
    overflow: hidden;
    background: var(--art-paper);
  }
  .thumb :global(svg) {
    inline-size: 100%;
    block-size: 100%;
  }
  .confirm {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
    margin-block-start: var(--space-4);
    padding: var(--space-3);
    border: var(--border) solid var(--warning);
    border-radius: var(--radius-s);
  }
  .confirm p {
    flex-basis: 100%;
    margin: 0;
  }
</style>
