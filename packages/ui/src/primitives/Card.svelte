<!--
	Carte / fiche / document (DESIGN.md §9.5). Trois matières :
	- `fiche`    : fiche d'interface sur le bureau (résultat du Catalogue, entrée du Carnet, emplacement) ;
	- `document` : feuille de papier (aperçu d'archive, document posé) ;
	- `photo`    : tirage à bord blanc, légende manuscrite ;
	- `index`    : v2, fiche bristol réglée (ligne de tête vermillon, titre dactylographié) :
	               résultats du Catalogue, entrées du Carnet.
	v2 : survol = la fiche se soulève et pivote d'un rien ; appui = elle s'écrase ; `deal`
	(rang) = elle est distribuée à l'apparition (cascade --stagger-deal).
	Interactive si `href` ou `onactivate` : le titre devient le lien/bouton et sa zone
	couvre toute la carte (les boutons du pied restent cliquables au-dessus).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';

  type Verb = 'look' | 'take' | 'write' | 'pin' | 'use';
  interface Props {
    variant?: 'fiche' | 'document' | 'photo' | 'index';
    title: string;
    headingLevel?: 2 | 3 | 4;
    /** Surtitre : type de document, rubrique… */
    kicker?: string;
    /** Métadonnée courte : date, cote. */
    meta?: string;
    href?: string;
    onactivate?: () => void;
    selected?: boolean;
    unread?: boolean;
    pinned?: boolean;
    /** Inclinaison décorative en degrés (bornée à ±1,5°). */
    tilt?: number;
    verb?: Verb;
    /** Rang de distribution (0, 1, 2…) : la fiche arrive en cascade à l'apparition. */
    deal?: number;
    media?: Snippet;
    children?: Snippet;
    footer?: Snippet;
    class?: string;
  }

  let {
    variant = 'fiche',
    title,
    headingLevel = 3,
    kicker,
    meta,
    href,
    onactivate,
    selected = false,
    unread = false,
    pinned = false,
    tilt = 0,
    verb,
    deal,
    media,
    children,
    footer,
    class: className = '',
  }: Props = $props();

  const interactive = $derived(Boolean(href || onactivate));
  const angle = $derived(Math.max(-1.5, Math.min(1.5, tilt)));
  const paper = $derived(variant !== 'fiche');
</script>

<article
  class="card {variant} {className}"
  class:interactive
  class:selected
  class:grain={variant === 'document'}
  class:mv-deal={deal !== undefined}
  style:--i={deal}
  data-surface={paper ? 'paper' : undefined}
  data-verb={interactive ? (verb ?? 'look') : undefined}
  style:--card-tilt="{angle}deg"
>
  {#if media}<div class="media">{@render media()}</div>{/if}
  <div class="content">
    {#if kicker || unread || pinned}
      <p class="kicker">
        {#if unread}<span class="dot" aria-hidden="true"></span><span class="visually-hidden"
            >Non lu.
          </span>{/if}
        {#if kicker}<span>{kicker}</span>{/if}
        {#if pinned}<span class="pin" title="Épinglé"
            ><Icon name="pin" size="1rem" /><span class="visually-hidden">Épinglé</span></span
          >{/if}
      </p>
    {/if}
    <svelte:element this={`h${headingLevel}`} class="title">
      {#if href}
        <a class="cover" {href} aria-current={selected ? 'true' : undefined}>{title}</a>
      {:else if onactivate}
        <button class="cover" type="button" aria-pressed={selected} onclick={onactivate}
          >{title}</button
        >
      {:else}
        {title}
      {/if}
    </svelte:element>
    {#if meta}<p class="meta num">{meta}</p>{/if}
    {#if children}<div class="body">{@render children()}</div>{/if}
  </div>
  {#if footer}<div class="foot">{@render footer()}</div>{/if}
</article>

<style>
  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    color: var(--text);
    --tilt: var(--card-tilt);
    transform: rotate(var(--card-tilt));
    transition:
      transform var(--dur-base) var(--ease-paper),
      box-shadow var(--dur-base) var(--ease-out);
  }
  /* Fiche de bureau : sous-main surpiqué */
  .fiche {
    background: var(--surface-1);
    border: var(--border) solid var(--line);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-1);
  }
  .fiche::before {
    content: '';
    position: absolute;
    inset: 4px;
    pointer-events: none;
    border: 1px dashed var(--stitch);
    border-radius: calc(var(--radius-m) - 3px);
  }
  /* Fiche bristol : réglure bleue, ligne de tête vermillon, titre tapé à la machine */
  .index {
    --rule-gap: 1.6rem;
    background-color: var(--card);
    border-radius: var(--radius-xs);
    box-shadow: var(--shadow-paper);
  }
  .index .title {
    font-family: var(--font-type);
    font-weight: var(--weight-bold);
    font-size: var(--step-0);
    font-variation-settings: normal;
    color: var(--ink-type);
    /* ligne de tête vermillon sous le titre, quelle que soit sa hauteur */
    padding-block-end: var(--space-2);
    border-block-end: 2px solid var(--card-margin);
  }
  /* Réglure : chaque bloc sous la tête écrit sur ses lignes (interligne = pas de réglure) */
  .index .meta,
  .index .body {
    margin: 0;
    line-height: var(--rule-gap);
    background-image: repeating-linear-gradient(
      to bottom,
      transparent 0 calc(var(--rule-gap) - 1px),
      var(--card-rule) calc(var(--rule-gap) - 1px) var(--rule-gap)
    );
  }
  .index .body :global(p) {
    margin: 0;
  }
  .index .content {
    padding-block-start: var(--space-2);
  }
  .document {
    background: var(--canvas);
    border-radius: var(--radius-paper);
    box-shadow: var(--shadow-paper);
  }
  .photo {
    background: var(--surface-1);
    padding: var(--space-2) var(--space-2) 0;
    border-radius: var(--radius-paper);
    box-shadow: var(--shadow-paper);
  }
  .photo .title {
    font-family: var(--font-hand);
    font-size: calc(var(--step-0) * var(--hand-boost));
    font-weight: var(--weight-medium);
    color: var(--ink-hand);
  }
  .media {
    overflow: hidden;
    border-radius: inherit;
  }
  .fiche .media {
    border-end-start-radius: 0;
    border-end-end-radius: 0;
  }
  .content {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-3) var(--space-4);
    min-width: 0;
  }
  .kicker {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-label);
    font-size: var(--step--1);
    font-weight: var(--weight-medium);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: var(--radius-pill);
    background: var(--accent);
    box-shadow: 0 0 0 2px var(--surface-1);
  }
  .pin {
    margin-inline-start: auto;
    color: var(--accent);
    display: inline-flex;
  }
  .title {
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-size: var(--step-1);
    font-weight: var(--weight-display);
    line-height: var(--leading-snug);
  }
  .document .title {
    font-family: var(--font-read);
    font-variation-settings: normal;
  }
  .meta {
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .body {
    font-size: var(--step-0);
    color: var(--text-muted);
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    padding: 0 var(--space-4) var(--space-3);
    position: relative;
    z-index: var(--z-raised);
  }

  /* Interactive : tout le cadre est la cible ; la carte se soulève (transform seul) */
  .cover {
    all: unset;
    cursor: inherit;
  }
  .cover::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
  }
  @media (hover: hover) {
    .interactive:hover {
      transform: rotate(calc(var(--card-tilt) - 0.5deg)) translateY(var(--lift));
      box-shadow: var(--shadow-lifted);
    }
  }
  .fiche.interactive:hover {
    box-shadow: var(--shadow-2);
  }
  .interactive:hover.fiche {
    border-color: var(--line-strong);
  }
  .interactive:has(.cover:focus-visible) {
    outline: 3px solid var(--focus);
    outline-offset: 3px;
  }
  .interactive:active {
    transform: rotate(var(--card-tilt)) translateY(0) scale(0.99);
    transition-duration: var(--dur-instant);
  }
  .selected {
    outline: var(--border-strong) solid var(--accent);
    outline-offset: 2px;
  }
  .selected .title::before {
    content: '▸ ';
    color: var(--accent);
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  @media (forced-colors: active) {
    .card {
      border: 1px solid CanvasText;
    }
  }
</style>
