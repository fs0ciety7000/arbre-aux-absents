<!--
	Boîte de dialogue modale (DESIGN.md §9.6) sur <dialog> + showModal() :
	reste de la page inerte, Échap, retour du focus, nom et description accessibles.
	Sous 600 px elle devient une feuille basse plein largeur (Sélecteur de candidat, fiches).
	`surface="paper"` pour les cartes de révélation et les fiches papier.
-->
<script lang="ts">
  import { getUiStrings } from '../i18n';
  import type { Snippet } from 'svelte';
  import IconButton from './IconButton.svelte';

  interface Props {
    open?: boolean;
    title: string;
    kicker?: string;
    description?: string;
    size?: 's' | 'm' | 'l';
    surface?: 'desk' | 'paper';
    /** Fermeture par clic sur le fond (déf. true). Échap ferme toujours. */
    dismissible?: boolean;
    /** Sur téléphone : feuille basse (déf.) ou plein écran. */
    mobile?: 'sheet' | 'fullscreen';
    closeLabel?: string;
    onclose?: () => void;
    children?: Snippet;
    actions?: Snippet;
    id?: string;
  }

  let {
    open = $bindable(false),
    title,
    kicker,
    description,
    size = 'm',
    surface = 'desk',
    dismissible = true,
    mobile = 'sheet',
    closeLabel: closeLabelProp,
    onclose,
    children,
    actions,
    id = `dialog-${Math.random().toString(36).slice(2, 8)}`,
  }: Props = $props();
  const ui = getUiStrings();
  const closeLabel = $derived(closeLabelProp ?? ui.dialog.close);

  let dialog: HTMLDialogElement | undefined = $state();
  let opener: HTMLElement | null = null;
  let pressStartedOnBackdrop = false;

  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) {
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  });

  function handleClose() {
    open = false;
    onclose?.();
    opener?.focus?.();
    opener = null;
  }

  // Clic sur le fond : seulement si la pression ET le relâchement ont lieu sur le fond
  // (évite qu'une sélection de texte qui déborde ferme la boîte).
  function onpointerdown(e: PointerEvent) {
    pressStartedOnBackdrop = e.target === dialog;
  }
  function onclick(e: MouseEvent) {
    if (dismissible && pressStartedOnBackdrop && e.target === dialog) dialog?.close();
    pressStartedOnBackdrop = false;
  }
</script>

<dialog
  bind:this={dialog}
  {id}
  class="dialog {size} {surface} m-{mobile}"
  class:grain={surface === 'paper'}
  data-surface={surface === 'paper' ? 'paper' : undefined}
  aria-labelledby="{id}-title"
  aria-describedby={description ? `${id}-desc` : undefined}
  onclose={handleClose}
  {onpointerdown}
  {onclick}
>
  <div class="frame">
    <header class="head">
      <div>
        {#if kicker}<p class="kicker">{kicker}</p>{/if}
        <h2 id="{id}-title" class="title">{title}</h2>
        {#if description}<p id="{id}-desc" class="desc">{description}</p>{/if}
      </div>
      <IconButton icon="close" label={closeLabel} onclick={() => dialog?.close()} />
    </header>
    <div class="body">
      {@render children?.()}
    </div>
    {#if actions}
      <footer class="actions">{@render actions()}</footer>
    {/if}
  </div>
</dialog>

<style>
  .dialog {
    --dialog-w: 34rem;
    width: min(var(--dialog-w), calc(100vw - 2 * var(--gutter)));
    max-height: min(85dvh, 52rem);
    margin: auto; /* le reset global met margin: 0 */
    padding: 0;
    border: var(--border) solid var(--line);
    border-radius: var(--radius-l);
    background: var(--surface-1);
    color: var(--text);
    box-shadow: var(--shadow-3);
    overflow: hidden;
    /* entrée : la feuille se pose */
    opacity: 1;
    transform: none;
    transition:
      opacity var(--dur-fade) var(--ease-out),
      transform var(--dur-open) var(--ease-paper),
      overlay var(--dur-fade) allow-discrete,
      display var(--dur-fade) allow-discrete;
  }
  /* v2 : la fiche tombe sur le bureau, de biais, et se cale ; à la fermeture elle s'escamote */
  .dialog:not([open]) {
    opacity: 0;
    transform: translateY(calc(var(--rise) * 2)) rotate(calc(var(--deal-rotate) * 0.2)) scale(0.97);
    transition-timing-function: var(--ease-flick);
    transition-duration: var(--dur-fade-fast), var(--dur-base);
  }
  @starting-style {
    .dialog[open] {
      opacity: 0;
      transform: translateY(calc(var(--rise) * -3)) rotate(calc(var(--deal-rotate) * -0.3))
        scale(1.03);
    }
  }
  /* Sous-main surpiqué (surface bureau) */
  .dialog:not(.paper)::after {
    content: '';
    position: absolute;
    inset: 5px;
    pointer-events: none;
    border: 1.5px dashed var(--stitch);
    border-radius: calc(var(--radius-l) - 4px);
  }
  .s {
    --dialog-w: 26rem;
  }
  .l {
    --dialog-w: 48rem;
  }
  .paper {
    background: var(--canvas);
    border-radius: var(--radius-paper);
    border-color: var(--line);
  }
  .dialog::backdrop {
    background: var(--scrim);
    opacity: 1;
    transition:
      opacity var(--dur-fade) var(--ease-out),
      overlay var(--dur-fade) allow-discrete,
      display var(--dur-fade) allow-discrete;
  }
  .dialog:not([open])::backdrop {
    opacity: 0;
  }
  @starting-style {
    .dialog[open]::backdrop {
      opacity: 0;
    }
  }
  .frame {
    display: flex;
    flex-direction: column;
    max-height: inherit;
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-2) var(--space-3) var(--space-5);
  }
  .kicker {
    font-family: var(--font-label);
    font-size: var(--step--1);
    font-weight: var(--weight-medium);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--text-muted);
    margin-block-end: var(--space-1);
  }
  .title {
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-size: var(--step-3);
    font-weight: var(--weight-display);
    line-height: var(--leading-snug);
    padding-block-start: var(--space-2);
  }
  .desc {
    margin-block-start: var(--space-2);
    color: var(--text-muted);
  }
  .body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 0 var(--space-5) var(--space-5);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-5);
    border-block-start: var(--border) solid var(--line);
    background: var(--surface-2);
  }

  :global(html:has(dialog[open])) {
    overflow: hidden;
  }

  /* Téléphone : feuille basse ou plein écran */
  @media (max-width: 37.4375rem) {
    .dialog.m-sheet {
      width: 100vw;
      max-width: 100vw;
      max-height: 92dvh;
      margin: auto 0 0;
      border-radius: var(--radius-l) var(--radius-l) 0 0;
      border-inline: 0;
      border-block-end: 0;
      padding-block-end: env(safe-area-inset-bottom);
    }
    .dialog.m-sheet:not([open]) {
      transform: translateY(calc(var(--rise) * 4));
    }
    @starting-style {
      .dialog.m-sheet[open] {
        transform: translateY(calc(var(--rise) * 4));
      }
    }
    .dialog.m-fullscreen {
      width: 100vw;
      max-width: 100vw;
      height: 100dvh;
      max-height: 100dvh;
      border-radius: 0;
      border: 0;
    }
    .dialog.m-sheet::after,
    .dialog.m-fullscreen::after {
      border-radius: 0;
    }
    .actions {
      flex-direction: column-reverse;
      align-items: stretch;
    }
  }
</style>
