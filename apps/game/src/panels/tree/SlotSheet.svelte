<!--
  Fiche d'une case (P01) : les quatre champs en lignes de 56 px, chacun ouvre le sélecteur de
  candidat (P10) ; bouton « vider » par champ (confirmation si l'option est active). Case
  établie : lecture seule, tampon. Case revendiquée (AFFAIRE-2 §1.4) : valeurs déclarées entre
  « », mention « à vérifier », actions Retirer / Rétablir la déclaration et Voir la requête.
-->
<script lang="ts">
  import type { SlotGuess, SlotId } from '@arbre/contract';
  import {
    Button,
    ClaimTag,
    Dialog,
    Icon,
    IconButton,
    MarkFrame,
    pushToast,
    Stamp,
  } from '@arbre/ui';
  import { svgContent } from '@arbre/map/svelte';
  import { portraitSvg } from '../lib/assets.svelte';
  import { getGame } from '../../lib/game/context';
  import type { SlotField } from '../../lib/game/types';
  import { carry } from '../lib/carry.svelte';
  import {
    claimDocument,
    claimFields,
    claimView,
    fieldValueLabel,
    guessOf,
    slotName,
  } from '../lib/view';
  import { tick } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import { isMarkSlot, refusalText, refusedKind, slotFieldLabel } from '../lib/marks';
  import { pm, withoutFinalPeriod } from '../messages';

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
  /** Case à champ Marque (AFFAIRE-3 §1) : libellé, cadre, description en entier. */
  const markSlot = $derived(slot !== null && isMarkSlot(game.content, slot));
  const label = (field: SlotField) => slotFieldLabel(game.content, slot, field);

  // ── Case revendiquée (AFFAIRE-2 §1.4) ──
  const claim = $derived(
    slot
      ? claimView(game.state, game.content, slot)
      : { claimed: false, declared: new Set<SlotField>(), open: false },
  );
  const claimed = $derived(slot ? claimFields(game.content, slot) : []);
  const declaration = $derived(slot ? game.content.slots[slot]?.claimedGuess : undefined);
  /** Champs posés par le joueur que « Rétablir » écraserait. */
  const overwritten = $derived(
    declaration && guess
      ? claimed.filter((f) => !claim.declared.has(f) && guess[f] !== null && guess[f] !== '')
      : [],
  );
  const restorable = $derived(claim.open && claim.declared.size < claimed.length);
  const requestDoc = $derived(slot && claim.open ? claimDocument(game.content, slot) : null);
  let confirmingRestore = $state(false);

  // ── Confirmations (role="alertdialog") : le focus y entre, et revient au déclencheur ──
  /** Élément qui a ouvert la confirmation en cours (bouton « Rétablir », × ou ligne du champ). */
  let confirmTrigger: HTMLElement | null = null;
  let fieldsList = $state<HTMLUListElement | null>(null);

  function rememberTrigger() {
    const active = document.activeElement;
    confirmTrigger = active instanceof HTMLElement && active !== document.body ? active : null;
  }

  /** À l'apparition, le premier bouton prend le focus : le lecteur d'écran annonce la confirmation. */
  const focusFirstButton: Attachment<HTMLElement> = (node) => {
    node.querySelector<HTMLElement>('button')?.focus();
  };

  /**
   * Rend le focus au déclencheur ; s'il a disparu (le × d'un champ vidé, « Rétablir » une fois la
   * déclaration remise), à la ligne du champ concerné, sinon au premier champ de la fiche.
   */
  async function restoreFocus(field: SlotField | null = null) {
    const trigger = confirmTrigger;
    confirmTrigger = null;
    await tick();
    if (trigger?.isConnected) {
      trigger.focus();
      return;
    }
    const rows = fieldsList?.querySelectorAll<HTMLElement>('button.field');
    const index = field ? FIELDS.indexOf(field) : 0;
    rows?.[Math.max(0, index)]?.focus();
  }

  function emptyPatch(fields: readonly SlotField[]): Partial<SlotGuess> {
    const patch: Partial<SlotGuess> = {};
    for (const f of fields) {
      if (f === 'portrait' || f === 'occupation') patch[f] = null;
      else patch[f] = '';
    }
    return patch;
  }

  /** Vide tous les champs encore déclarés ; les champs posés restent. Réversible, sans confirmation. */
  function removeClaim() {
    if (!slot || locked || claim.declared.size === 0) return;
    game.dispatch({ type: 'setSlot', slot, patch: emptyPatch([...claim.declared]) });
  }

  function askRestore() {
    if (overwritten.length > 0) {
      rememberTrigger();
      confirming = null;
      confirmingRestore = true;
    } else restoreClaim();
  }

  function cancelRestore() {
    confirmingRestore = false;
    void restoreFocus();
  }

  /** Remet les valeurs déclarées dans les champs (confirmation si un champ posé est écrasé). */
  function restoreClaim() {
    const wasConfirming = confirmingRestore;
    confirmingRestore = false;
    if (!slot || locked || !declaration) return;
    const patch: Partial<SlotGuess> = {};
    for (const f of claimed) Object.assign(patch, { [f]: declaration[f] });
    game.dispatch({ type: 'setSlot', slot, patch });
    if (wasConfirming) void restoreFocus();
  }

  function showRequest() {
    if (!requestDoc) return;
    game.navigate({ kind: 'document', id: requestDoc });
    onclose();
  }

  function pick(field: SlotField) {
    if (!slot || locked) return;
    if (carry.accepts(field)) {
      // Mauvais type (visage dans un champ Marque, ou l'inverse) : refus neutre, rien ne change.
      const refused = refusedKind(game.content, slot, { [field]: carry.item!.patch[field] });
      if (refused) {
        pushToast({ tone: 'info', title: refusalText(refused), timeout: 4000 });
        return;
      }
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
    if (confirming) {
      confirming = null;
      void restoreFocus(field);
    }
  }

  function askClear(field: SlotField) {
    if (game.settings.confirmClear) {
      rememberTrigger();
      confirmingRestore = false;
      confirming = field;
    } else clear(field);
  }

  function cancelClear() {
    const field = confirming;
    confirming = null;
    void restoreFocus(field);
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
    {:else if claim.open}
      <p class="claim-notice" class:cleared={!claim.claimed}>
        {#if claim.claimed}<ClaimTag decorative label={pm.tree.claimTag} />{/if}
        <span>{claim.claimed ? pm.tree.claimNotice : pm.tree.claimNoticeCleared}</span>
      </p>
    {/if}
    <ul class="fields" bind:this={fieldsList}>
      {#each FIELDS as field (field)}
        {@const value = fieldValueLabel(game.content, field, guess)}
        {@const accepts =
          carry.accepts(field) &&
          slot !== null &&
          refusedKind(game.content, slot, { [field]: carry.item?.patch[field] }) === null}
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
            <span class="label caps">{label(field)}</span>
            <span class="value" class:mark-value={field === 'portrait' && markSlot}>
              {#if field === 'portrait' && markSlot}
                <MarkFrame size="tile" empty={!value}>
                  {#if guess?.portrait && game.content.portraits[guess.portrait]}
                    <span use:svgContent={portraitSvg(game.content, guess.portrait)}></span>
                  {/if}
                </MarkFrame>
              {:else if field === 'portrait' && guess?.portrait && game.content.portraits[guess.portrait]}
                <span class="thumb" use:svgContent={portraitSvg(game.content, guess.portrait)}
                ></span>
              {/if}
              {#if value && field === 'portrait' && markSlot}
                <!-- Marque (AFFAIRE-3 §1.2) : la description verbale en entier, sous le dessin. -->
                <span class="mark-alt"
                  >{claim.declared.has(field)
                    ? `${withoutFinalPeriod(value)}, ${pm.tree.declaredMark}`
                    : value}</span
                >
              {:else if value && field === 'portrait'}
                <!-- Portrait (§6.9) : le texte de remplacement fait ~200 signes. Deux lignes à
                     l'écran, le texte entier au lecteur d'écran ; déclaré, il garde son cadre
                     (pas de .claim-value) : sa marque est le cartouche et le nom accessible. -->
                <span class="alt" aria-hidden="true">{value}</span><span class="visually-hidden"
                  >{claim.declared.has(field)
                    ? `${withoutFinalPeriod(value)}, ${pm.tree.declaredMark}`
                    : value}</span
                >
              {:else if value && claim.declared.has(field)}<span class="claim-value">{value}</span
                ><span class="visually-hidden">, {pm.tree.declaredMark}</span>{:else if value}<span
                  >{value}</span
                >{:else}<span class="empty">{pm.tree.fieldEmpty}</span>{/if}
            </span>
            <span class="verb">
              {#if locked}<Icon name="lock" />{:else if accepts}<Icon name="use" />
                <span>{pm.tree.carryDrop}</span>{:else}<Icon name="write" />{/if}
            </span>
          </button>
          {#if !locked && value}
            <IconButton
              icon="close"
              label={pm.tree.clearField(label(field))}
              onclick={() => askClear(field)}
            />
          {/if}
        </li>
      {/each}
    </ul>
    {#if claim.open}
      <div class="claim-actions" role="group" aria-label={pm.tree.claimActions}>
        {#if claim.claimed}
          <Button iconName="close" onclick={removeClaim}>{pm.tree.claimRemove}</Button>
        {/if}
        {#if restorable}
          <Button iconName="staple" onclick={askRestore}>{pm.tree.claimRestore}</Button>
        {/if}
        {#if requestDoc}
          <Button variant="ghost" iconName="reader" onclick={showRequest}
            >{pm.tree.claimSource}</Button
          >
        {/if}
      </div>
    {/if}
    {#if confirmingRestore}
      <div
        class="confirm"
        role="alertdialog"
        aria-label={pm.tree.claimRestore}
        aria-describedby="slot-confirm-restore"
        {@attach focusFirstButton}
      >
        <p id="slot-confirm-restore">{pm.tree.claimConfirmRestore(overwritten.length)}</p>
        <Button variant="danger" onclick={restoreClaim}>{pm.common.confirm}</Button>
        <Button variant="ghost" onclick={cancelRestore}>{pm.common.cancel}</Button>
      </div>
    {/if}
    {#if confirming}
      <div
        class="confirm"
        role="alertdialog"
        aria-label={pm.tree.confirmClear}
        aria-describedby="slot-confirm-clear"
        {@attach focusFirstButton}
      >
        <p id="slot-confirm-clear">{pm.tree.confirmClear} ({label(confirming)})</p>
        <Button variant="danger" onclick={() => confirming && clear(confirming)}
          >{pm.common.confirm}</Button
        >
        <Button variant="ghost" onclick={cancelClear}>{pm.common.cancel}</Button>
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
  .claim-notice {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
    margin: 0 0 var(--space-3);
  }
  .claim-notice.cleared {
    color: var(--text-muted);
  }
  .claim-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-block-start: var(--space-4);
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
  /* Valeur déclarée : le » final ne part jamais seul à la ligne (pas de coupure « n'importe où »
     dans la valeur ; l'espace fine insécable des guillemets la soude au dernier mot). */
  .value .claim-value {
    overflow-wrap: break-word;
  }
  /* Texte de remplacement du portrait : deux lignes au plus, coupées aux mots. */
  .alt {
    display: -webkit-box;
    flex: 1;
    min-inline-size: 0;
    overflow: hidden;
    overflow-wrap: break-word;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
  /* Case à marque : dessin au-dessus, description entière dessous (pas de coupure). */
  .value.mark-value {
    flex-direction: column;
    align-items: flex-start;
  }
  .mark-alt {
    overflow-wrap: break-word;
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
