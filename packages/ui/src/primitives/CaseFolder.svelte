<!--
	Chemise d'affaire à choisir (DESIGN.md §6.10, AFFAIRE-2 §2.1) : écran Nouvelle partie (E04),
	une chemise kraft par affaire. C'est un **bouton radio natif** (groupe par `name`, flèches
	au clavier) dans une étiquette qui fait toute la chemise (cible ≥ 72 px de haut).
	Contenu : cote à l'étiqueteuse sur l'onglet, titre, durée indicative, état, mention
	facultative (« Se joue seule. Conseillé après… », snippet `note`, jamais un verrou) et tampon
	de la dernière décision (`decision`, encre neutre : aucune décision n'est « la bonne »).
	Choisie : la chemise se soulève, liseré safran, coche dans l'onglet (forme, pas seulement
	couleur). Nom accessible = titre ; description = durée, état, mention, décision.
	À poser dans `CaseFolderGroup` (empilées sous 600 px, côte à côte au-delà).
-->
<script lang="ts">
  import { getUiStrings } from '../i18n';
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';
  import Stamp from './Stamp.svelte';

  interface Props {
    /** Nom du groupe radio (commun à toutes les chemises de l'écran). */
    name: string;
    /** Identifiant de l'affaire. */
    value: string;
    checked?: boolean;
    onselect?: (value: string) => void;
    title: string;
    /** Cote du dossier (étiqueteuse rouge) : « ORC 74-118 ». */
    cote?: string;
    /** Durée indicative : « 4 h 30 – 7 h ». */
    duration?: string;
    /** État : « Non ouvert », « En cours, 42 % », « Rapport remis · fins vues 2 / 4 ». */
    status?: string;
    /** Mention (texte riche possible : titre d'affaire en italique). */
    note?: Snippet;
    /** Tampon de la dernière décision (« Requête rejetée »). */
    decision?: string;
    /** Préfixe lu avant la décision (déf. « Dernière décision : »). */
    decisionLabel?: string;
    tone?: 'kraft' | 'manila';
    /** Rang de distribution à l'apparition. */
    deal?: number;
    disabled?: boolean;
    class?: string;
    id?: string;
  }

  let {
    name,
    value,
    checked = false,
    onselect,
    title,
    cote,
    duration,
    status,
    note,
    decision,
    decisionLabel: decisionLabelProp,
    tone = 'kraft',
    deal,
    disabled = false,
    class: className = '',
    id = `case-${Math.random().toString(36).slice(2, 8)}`,
  }: Props = $props();
  const ui = getUiStrings();
  const decisionLabel = $derived(decisionLabelProp ?? ui.caseFolder.lastDecision);

  const describedBy = $derived(
    [
      duration || status ? `${id}-meta` : '',
      note ? `${id}-note` : '',
      decision ? `${id}-decision` : '',
    ]
      .filter(Boolean)
      .join(' ') || undefined,
  );
</script>

<label
  class="case-folder {tone} {className}"
  class:checked
  class:disabled
  class:mv-deal={deal !== undefined}
  style:--i={deal}
  data-surface="kraft"
>
  <input
    class="radio"
    type="radio"
    {name}
    {value}
    {checked}
    {disabled}
    aria-labelledby="{id}-title"
    aria-describedby={describedBy}
    onchange={() => onselect?.(value)}
  />
  <span class="tab">
    <span class="tick" aria-hidden="true"><Icon name="check" size="1em" weight={2.25} /></span>
    {#if cote}<span class="mat-label red cote">{cote}</span>{/if}
  </span>
  <span class="body">
    <span class="dog-ear" aria-hidden="true"></span>
    <span class="title" id="{id}-title">{title}</span>
    {#if duration || status}
      <span class="meta" id="{id}-meta">
        {#if duration}<span class="duration"
            ><Icon name="clock" size="1.1em" /><span>{duration}</span></span
          >{/if}
        {#if duration && status}<span class="sep" aria-hidden="true">·</span>{/if}
        {#if status}<span class="status">{status}</span>{/if}
      </span>
    {/if}
    {#if note}
      <span class="note" id="{id}-note">
        <Icon name="info" size="1.1em" />
        <span>{@render note()}</span>
      </span>
    {/if}
    {#if decision}
      <span class="visually-hidden" id="{id}-decision">{decisionLabel}{decision}</span>
      <span class="decision" aria-hidden="true">
        <Stamp text={decision} tone="ink" size="s" rotate={-7} />
      </span>
    {/if}
  </span>
</label>

<style>
  .case-folder {
    --folder-bg: var(--kraft);
    position: relative;
    display: flex;
    flex-direction: column;
    min-inline-size: 0;
    min-block-size: 72px;
    color: var(--text);
    cursor: pointer;
    transition: transform var(--dur-base) var(--ease-paper);
  }
  .manila {
    --folder-bg: var(--manila);
  }
  /* Le bouton radio reste natif (clavier, lecteur d'écran) mais invisible : la chemise est
     sa représentation. */
  .radio {
    position: absolute;
    inset: 0;
    margin: 0;
    opacity: 0;
    cursor: inherit;
  }
  .tab {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    align-self: flex-start;
    max-inline-size: 80%;
    min-block-size: 28px;
    margin-inline-start: var(--space-3);
    margin-block-end: -1px;
    padding: var(--space-1) var(--space-3) 0;
    background: var(--folder-bg);
    border-radius: var(--radius-tab) var(--radius-tab) 0 0;
    box-shadow: inset 0 1px 0 var(--edge-light);
    pointer-events: none;
  }
  .tick {
    display: none;
    color: var(--text);
  }
  .cote {
    rotate: -1.2deg;
    max-inline-size: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .body {
    position: relative;
    isolation: isolate;
    flex: 1;
    display: grid;
    align-content: start;
    gap: var(--space-1);
    padding: var(--space-3) var(--space-4) var(--space-4);
    padding-inline-end: calc(var(--space-4) + 22px);
    background: var(--folder-bg);
    border-radius: 0 var(--radius-m) var(--radius-m) var(--radius-m);
    box-shadow: var(--shadow-paper);
    pointer-events: none;
    transition: box-shadow var(--dur-base) var(--ease-out);
  }
  .body::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    background-image: var(--kraft-fiber-image);
    mix-blend-mode: multiply;
  }
  .dog-ear {
    position: absolute;
    inset-block-end: 0;
    inset-inline-end: 0;
    inline-size: 22px;
    block-size: 22px;
    background: linear-gradient(to bottom right, var(--manila) 50%, var(--desk) 50%);
    border-start-start-radius: 3px;
  }
  .title {
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-weight: var(--weight-display);
    font-size: var(--step-1);
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-tight);
    text-wrap: balance;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1) var(--space-2);
    font-family: var(--font-type);
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .duration {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
  }
  /* Mention : une bande de manille agrafée dans la chemise (les états ne vont jamais à même
     le carton, §3.5). */
  .note {
    display: flex;
    gap: var(--space-1);
    align-items: flex-start;
    margin-block-start: var(--space-1);
    padding: var(--space-1) var(--space-2);
    background: var(--surface-1);
    border-radius: var(--radius-xs);
    font-family: var(--font-ui);
    font-size: var(--step--1);
    line-height: var(--leading-snug);
    color: var(--text);
    text-wrap: pretty;
  }
  /* titre d'affaire en italique : Literata a un vrai italique (pas Instrument Sans) */
  .note :global(em) {
    font-family: var(--font-read);
    font-style: italic;
  }
  .note :global(.icon) {
    flex: none;
    margin-block-start: 0.1em;
  }
  /* Tampon dans le flux, en bas à droite : ne recouvre jamais le titre, même à 360 px */
  .decision {
    justify-self: end;
    margin-block-start: var(--space-1);
  }

  /* Survol, focus, choix : la chemise se soulève (transform seulement) */
  @media (hover: hover) {
    .case-folder:not(.disabled):hover {
      transform: translateY(var(--lift));
    }
  }
  /* Anneau tracé dans le carton : --focus du contexte kraft est mesuré sur le kraft (≥ 3:1),
     pas sur le bureau sombre. */
  .case-folder:has(.radio:focus-visible) .body {
    outline: 3px solid var(--focus);
    outline-offset: -6px;
  }
  .checked {
    transform: translateY(calc(var(--lift) * 2));
  }
  .checked .body {
    box-shadow:
      inset 0 0 0 var(--border-strong) var(--accent),
      var(--shadow-lifted);
  }
  .checked .tick {
    display: inline-flex;
  }
  .disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
  .visually-hidden {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  @media (forced-colors: active) {
    .tab,
    .body {
      border: 1px solid CanvasText;
    }
    .body::before,
    .dog-ear {
      display: none;
    }
    .checked .body {
      outline: 3px solid Highlight;
    }
    .case-folder:has(.radio:focus-visible) .body {
      outline-color: Highlight;
    }
  }
</style>
