<!--
	Tampon de décision du rapport final (DESIGN.md §6.11, AFFAIRE-2 §3.2) : une fiche bristol
	par décision, même motif que `CaseFolder` : **bouton radio natif** (invisible, couvrant toute
	la fiche) dans une étiquette, groupé par `name`. Le libellé est l'**effet administratif**
	(ce que fait l'Office), jamais l'issue narrative ; aucune option n'est « la bonne ».
	Choisie : la fiche se soulève, liseré `--accent`, coche + tampon `Stamp tone="ink"` (forme,
	pas seulement couleur). Indisponible (`reason`) : grisée, `disabled` (exposé comme
	indisponible, sautée par les flèches), raison visible et lue en description, action
	facultative hors de l'étiquette (`action`, ex. « Revenir au dossier »).
	À poser dans `DecisionGroup` (empilées sous 600 px, en ligne au-delà).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';
  import Stamp from './Stamp.svelte';

  interface Props {
    /** Nom du groupe radio (commun aux décisions d'une même question). */
    name: string;
    value: string;
    checked?: boolean;
    onselect?: (value: string) => void;
    /** Effet administratif : « Rejeter la requête et signaler l'usurpation d'identité. » */
    label: string;
    /** Texte du tampon posé sur la fiche choisie (déf. « Visé »). */
    stamp?: string;
    /** Raison d'indisponibilité : la fiche est grisée et non choisissable. */
    reason?: string;
    /** Préfixe de la raison (déf. « Indisponible : »), lu et affiché. */
    reasonLabel?: string;
    /** Action à côté d'une fiche indisponible (bouton hors de l'étiquette). */
    action?: Snippet;
    /** Rang de distribution à l'apparition. */
    deal?: number;
    class?: string;
    id?: string;
  }

  let {
    name,
    value,
    checked = false,
    onselect,
    label,
    stamp = 'Visé',
    reason,
    reasonLabel = 'Indisponible : ',
    action,
    deal,
    class: className = '',
    id = `decision-${Math.random().toString(36).slice(2, 8)}`,
  }: Props = $props();

  const disabled = $derived(reason !== undefined);
</script>

<div
  class="decision {className}"
  class:checked
  class:disabled
  class:mv-deal={deal !== undefined}
  style:--i={deal}
>
  <label class="card mat-card" data-surface="paper">
    <input
      class="radio"
      type="radio"
      {name}
      {value}
      {checked}
      {disabled}
      aria-labelledby="{id}-label"
      aria-describedby={reason ? `${id}-reason` : undefined}
      onchange={() => onselect?.(value)}
    />
    <span class="tick" aria-hidden="true"><Icon name="check" size="1em" weight={2.25} /></span>
    <span class="label" id="{id}-label">{label}</span>
    {#if reason}
      <span class="reason" id="{id}-reason">
        <Icon name="info" size="1.1em" />
        <span><span class="reason-label">{reasonLabel}</span>{reason}</span>
      </span>
    {/if}
    {#if checked}
      <span class="stamp" aria-hidden="true">
        <Stamp text={stamp} tone="ink" size="s" rotate={-7} animate />
      </span>
    {/if}
  </label>
  {#if reason && action}
    <div class="action">{@render action()}</div>
  {/if}
</div>

<style>
  /* La fiche occupe toute la hauteur de la rangée (fiches d'égale hauteur en ligne) ;
     l'action éventuelle reste dessous. */
  .decision {
    display: grid;
    grid-template-rows: 1fr auto;
    gap: var(--space-2);
    min-inline-size: 0;
  }
  .card {
    position: relative;
    display: grid;
    align-content: start;
    gap: var(--space-2);
    min-block-size: 72px;
    /* Bristol vierge : sans réglure ni ligne de tête, le libellé est libre de sa hauteur. */
    background-image: none;
    padding: var(--space-4) var(--space-4) var(--space-4) calc(var(--space-4) + 1.5rem);
    color: var(--ink);
    cursor: pointer;
    transition:
      transform var(--dur-base) var(--ease-paper),
      box-shadow var(--dur-base) var(--ease-out);
  }
  /* Radio natif invisible : la fiche est sa représentation (clavier, lecteur d'écran). */
  .radio {
    position: absolute;
    inset: 0;
    margin: 0;
    opacity: 0;
    cursor: inherit;
  }
  /* Case à cocher dessinée : vide, puis cochée (forme, pas seulement couleur). */
  .tick {
    position: absolute;
    inset-block-start: var(--space-4);
    inset-inline-start: var(--space-3);
    display: grid;
    place-items: center;
    inline-size: 1.25rem;
    block-size: 1.25rem;
    border: var(--border) solid var(--ink-muted);
    border-radius: var(--radius-xs);
    color: transparent;
    pointer-events: none;
  }
  .checked .tick {
    border-color: var(--ink);
    color: var(--ink);
  }
  .label {
    font-family: var(--font-type);
    line-height: var(--leading-snug);
    text-wrap: pretty;
    pointer-events: none;
  }
  .checked .label {
    font-weight: var(--weight-bold);
  }
  .reason {
    display: flex;
    gap: var(--space-1);
    align-items: flex-start;
    font-family: var(--font-ui);
    font-size: var(--step--1);
    line-height: var(--leading-snug);
    color: var(--ink);
    pointer-events: none;
  }
  .reason :global(.icon) {
    flex: none;
    margin-block-start: 0.1em;
  }
  .reason-label {
    font-weight: var(--weight-bold);
  }
  .stamp {
    justify-self: end;
    pointer-events: none;
  }
  .action {
    justify-self: start;
  }

  @media (hover: hover) {
    .decision:not(.disabled) .card:hover {
      transform: translateY(var(--lift));
    }
  }
  .card:has(.radio:focus-visible) {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
  .checked .card {
    transform: translateY(calc(var(--lift) * 2));
    box-shadow:
      inset 0 0 0 var(--border-strong) var(--accent),
      var(--shadow-lifted);
  }
  /* Grisée : la fiche pâlit, le texte reste lisible (raison au contraste AA, pas d'opacité
     sur le texte) ; le bord de la fiche et la case à cocher passent en tirets : forme, pas
     seulement couleur. Le libellé n'est pas barré. */
  .disabled .card {
    cursor: not-allowed;
    background-image: none;
    box-shadow: none;
    border: var(--border) dashed var(--ink-muted);
  }
  .disabled .label {
    color: var(--ink-muted);
  }
  .disabled .tick {
    border-style: dashed;
  }
  @media (forced-colors: active) {
    .card {
      border: 1px solid CanvasText;
    }
    .checked .card {
      outline: 3px solid Highlight;
    }
    .disabled .card {
      border-style: dashed;
      color: GrayText;
    }
    .card:has(.radio:focus-visible) {
      outline-color: Highlight;
    }
  }
</style>
