<!--
	Carte / fiche / document (DESIGN.md §9.5). Trois matières :
	- `fiche`    : fiche d'interface sur le bureau (résultat du Catalogue, entrée du Carnet, emplacement) ;
	- `document` : feuille de papier (aperçu d'archive, document posé) ;
	- `photo`    : tirage à bord blanc, légende manuscrite.
	Interactive si `href` ou `onactivate` : le titre devient le lien/bouton et sa zone
	couvre toute la carte (les boutons du pied restent cliquables au-dessus).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';

  type Verb = 'look' | 'take' | 'write' | 'pin' | 'use';
  interface Props {
    variant?: 'fiche' | 'document' | 'photo';
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
    transform: rotate(var(--card-tilt));
    transition: transform var(--dur-base) var(--ease-paper);
  }
  .fiche {
    background: var(--surface-1);
    border: var(--border) solid var(--line);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-1);
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
    font-size: var(--step--1);
    font-weight: var(--weight-semibold);
    letter-spacing: var(--tracking-caps);
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
    font-size: var(--step-1);
    font-weight: var(--weight-semibold);
    line-height: var(--leading-snug);
  }
  .document .title {
    font-family: var(--font-read);
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
  .interactive:hover {
    transform: rotate(var(--card-tilt)) translateY(var(--lift));
  }
  .interactive:hover.fiche {
    border-color: var(--line-strong);
  }
  .interactive:has(.cover:focus-visible) {
    outline: 3px solid var(--focus);
    outline-offset: 3px;
  }
  .interactive:active {
    transform: rotate(var(--card-tilt)) translateY(0);
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
