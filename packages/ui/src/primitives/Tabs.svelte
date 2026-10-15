<!--
	Onglets (DESIGN.md §9.3), motif ARIA « tabs » avec tabindex itinérant.
	Variantes : `line` (onglets d'un volet), `bar` (barre basse du téléphone, 64 px),
	`rail` (rail vertical d'icônes du Bureau, 64 px), `folder` (v2 : onglets de chemise kraft,
	l'actif sort devant et se raccorde au panneau, qui passe en contexte kraft). Le snippet `children` reçoit l'id actif
	et est rendu dans le tabpanel.
	`line` et `folder` compacts : quand les libellés débordent (`compact="auto"`, défaut) ou toujours
	(`compact`), les onglets passent en icônes seules (libellé caché + info-bulle) si tous ont
	une icône ; sinon la liste défile horizontalement avec fondus de bord visibles.
	Tabindex itinérant : si `value` ne désigne aucun onglet (panneau ouvert ailleurs), le
	premier onglet actif reste atteignable au clavier.
-->
<script lang="ts" module>
  import type { IconName } from './icons';

  export interface TabItem {
    id: string;
    label: string;
    icon?: IconName;
    /** Pastille (nombre de non lus…) ; `badgeLabel` la verbalise. */
    badge?: number;
    badgeLabel?: string;
    disabled?: boolean;
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';

  interface Props {
    items: TabItem[];
    value?: string;
    /** Nom accessible de la liste d'onglets. */
    label: string;
    variant?: 'line' | 'bar' | 'rail' | 'folder';
    /** `line` seulement : icônes seules si les libellés débordent (`auto`), toujours (`true`) ou jamais. */
    compact?: boolean | 'auto';
    /** `auto` : la flèche active l'onglet ; `manual` : Entrée/Espace active. */
    activation?: 'auto' | 'manual';
    idPrefix?: string;
    onchange?: (id: string) => void;
    children?: Snippet<[string]>;
    class?: string;
  }

  let {
    items,
    value = $bindable(items[0]?.id ?? ''),
    label,
    variant = 'line',
    compact = 'auto',
    activation = 'auto',
    idPrefix = `tabs-${Math.random().toString(36).slice(2, 8)}`,
    onchange,
    children,
    class: className = '',
  }: Props = $props();

  const vertical = $derived(variant === 'rail');
  let focusedId = $state<string | null>(null);

  // ── Mode compact (line) : mesure des libellés dans une copie invisible ──
  let listEl = $state<HTMLDivElement>();
  let measureEl = $state<HTMLDivElement>();
  let labelsOverflow = $state(false);
  let scrollStart = $state(false);
  let scrollEnd = $state(false);
  const allIcons = $derived(items.length > 0 && items.every((t) => t.icon));
  /** Variantes horizontales mesurées : `line` et `folder` passent en icônes si ça déborde. */
  const measured = $derived(variant === 'line' || variant === 'folder');
  const iconOnly = $derived(
    measured && allIcons && (compact === true || (compact === 'auto' && labelsOverflow)),
  );
  /** Débordement résiduel (pas d'icônes, ou icônes elles-mêmes trop nombreuses) : défilement. */
  const scrolling = $derived(measured && (scrollStart || scrollEnd));

  function measure() {
    if (!listEl) return;
    if (measureEl) labelsOverflow = measureEl.scrollWidth > listEl.clientWidth + 1;
    const max = listEl.scrollWidth - listEl.clientWidth;
    const pos = Math.abs(listEl.scrollLeft); // négatif en rtl
    scrollStart = max > 1 && pos > 1;
    scrollEnd = max > 1 && pos < max - 1;
  }

  $effect(() => {
    if (!measured || !listEl) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(listEl);
    if (measureEl) ro.observe(measureEl);
    measure();
    return () => ro.disconnect();
  });

  // Garde l'onglet actif visible quand la liste défile (sans animer la page)
  $effect(() => {
    if (!measured || !listEl) return;
    void iconOnly;
    void value;
    const el = listEl.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!el) return;
    const start = el.offsetLeft - listEl.offsetLeft;
    const end = start + el.offsetWidth;
    if (start < listEl.scrollLeft) listEl.scrollLeft = start;
    else if (end > listEl.scrollLeft + listEl.clientWidth)
      listEl.scrollLeft = end - listEl.clientWidth;
    measure();
  });

  function select(id: string) {
    if (id === value) return;
    value = id;
    onchange?.(id);
  }

  function onkeydown(e: KeyboardEvent, current: TabItem) {
    const enabled = items.filter((t) => !t.disabled);
    const pos = enabled.findIndex((t) => t.id === current.id);
    const prev = vertical ? 'ArrowUp' : 'ArrowLeft';
    const next = vertical ? 'ArrowDown' : 'ArrowRight';
    let target: TabItem | undefined;
    if (e.key === next) target = enabled[(pos + 1) % enabled.length];
    else if (e.key === prev) target = enabled[(pos - 1 + enabled.length) % enabled.length];
    else if (e.key === 'Home') target = enabled[0];
    else if (e.key === 'End') target = enabled[enabled.length - 1];
    else if (activation === 'manual' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      select(current.id);
      return;
    }
    if (!target) return;
    e.preventDefault();
    focusedId = target.id;
    // Document de la liste (les onglets peuvent vivre dans une fenêtre détachée).
    (listEl?.ownerDocument ?? document).getElementById(`${idPrefix}-tab-${target.id}`)?.focus();
    if (activation === 'auto') select(target.id);
  }

  /** Onglet atteignable par Tab : le focalisé, sinon l'actif, sinon le premier activable. */
  const tabbable = $derived.by(() => {
    if (focusedId) return focusedId;
    if (items.some((t) => t.id === value && !t.disabled)) return value;
    return items.find((t) => !t.disabled)?.id ?? '';
  });
  const hasSelected = $derived(items.some((t) => t.id === value));
</script>

<div
  class="tabs {variant} {className}"
  class:icon-only={iconOnly}
  data-surface={variant === 'folder' ? 'kraft' : undefined}
>
  {#if measured && allIcons && compact === 'auto'}
    <!-- Copie invisible des libellés : sert seulement à savoir s'ils tiennent -->
    <div class="measure-box" aria-hidden="true" inert>
      <div class="list measure" bind:this={measureEl}>
        {#each items as item (item.id)}
          <span class="tab"
            ><Icon name={item.icon ?? 'close'} size="1.5rem" /><span class="text">{item.label}</span
            >{#if item.badge}<span class="badge num">{item.badge}</span>{/if}</span
          >
        {/each}
      </div>
    </div>
  {/if}
  <div
    class="list"
    class:scrolling
    class:fade-start={scrollStart}
    class:fade-end={scrollEnd}
    role="tablist"
    aria-label={label}
    aria-orientation={vertical ? 'vertical' : 'horizontal'}
    bind:this={listEl}
    onscroll={measured ? measure : undefined}
  >
    {#each items as item, i (item.id)}
      {@const selected = item.id === value}
      <button
        type="button"
        role="tab"
        id="{idPrefix}-tab-{item.id}"
        aria-controls="{idPrefix}-panel"
        aria-selected={selected}
        tabindex={item.id === tabbable ? 0 : -1}
        disabled={item.disabled}
        class="tab"
        style:--i={i}
        onclick={() => select(item.id)}
        onkeydown={(e) => onkeydown(e, item)}
        onfocus={() => (focusedId = item.id)}
        onblur={() => (focusedId = null)}
      >
        {#if item.icon}<Icon name={item.icon} size="1.5rem" />{/if}
        <span class="text" class:visually-hidden={variant === 'rail' || iconOnly}>{item.label}</span
        >
        {#if item.badge}
          <span class="badge num" aria-hidden="true">{item.badge}</span>
          {#if item.badgeLabel}<span class="visually-hidden">, {item.badgeLabel}</span>{/if}
        {/if}
        {#if variant === 'rail' || iconOnly}<span class="tip" aria-hidden="true">{item.label}</span
          >{/if}
      </button>
    {/each}
  </div>
  {#if children}
    <div
      class="panel"
      role="tabpanel"
      id="{idPrefix}-panel"
      aria-labelledby={hasSelected ? `${idPrefix}-tab-${value}` : undefined}
      aria-label={hasSelected ? undefined : label}
      tabindex="-1"
    >
      {@render children(value)}
    </div>
  {/if}
</div>

<style>
  .tabs {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .rail {
    flex-direction: row;
  }
  .list {
    display: flex;
    gap: var(--space-1);
    overflow-x: auto;
    scrollbar-width: none;
  }
  .rail .list {
    flex-direction: column;
    width: var(--rail-w);
    padding: var(--space-2) 0;
    align-items: center;
    overflow: visible;
  }
  /* Copie de mesure : hors flux, invisible, à la largeur naturelle des libellés */
  .measure-box {
    position: absolute;
    inset: 0;
    overflow: hidden;
    visibility: hidden;
    pointer-events: none;
  }
  .measure {
    width: max-content;
    overflow: visible;
  }
  .line,
  .folder {
    position: relative;
  }
  /* Défilement résiduel : fondus de bord (masque, non animé) + barre fine visible */
  .line .list.scrolling {
    scrollbar-width: thin;
    scrollbar-color: var(--line-strong) transparent;
    scroll-padding-inline: var(--space-8);
  }
  .line .list.fade-start {
    -webkit-mask-image: linear-gradient(to right, transparent, #000 var(--space-8));
    mask-image: linear-gradient(to right, transparent, #000 var(--space-8));
  }
  .line .list.fade-end {
    -webkit-mask-image: linear-gradient(to left, transparent, #000 var(--space-8));
    mask-image: linear-gradient(to left, transparent, #000 var(--space-8));
  }
  .line .list.fade-start.fade-end {
    -webkit-mask-image: linear-gradient(
      to right,
      transparent,
      #000 var(--space-8),
      #000 calc(100% - var(--space-8)),
      transparent
    );
    mask-image: linear-gradient(
      to right,
      transparent,
      #000 var(--space-8),
      #000 calc(100% - var(--space-8)),
      transparent
    );
  }
  /* Icônes seules : la liste ne déborde plus, les info-bulles peuvent sortir */
  .icon-only [role='tablist'] {
    overflow: visible;
    justify-content: space-between;
  }
  .icon-only [role='tablist'] .tab {
    flex: 1 1 0;
    min-width: var(--hit);
    padding: 0 var(--space-2);
  }
  .icon-only .tip {
    inset-inline-start: 50%;
    inset-block-start: calc(100% + var(--space-2));
    transform: translateX(-50%);
  }
  .bar .list {
    height: var(--tabbar-h);
    gap: 0;
    background: var(--surface-1);
    border-block-start: var(--border) solid var(--line);
    padding-block-end: env(safe-area-inset-bottom);
  }
  .panel {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
  .panel:focus-visible {
    outline-offset: -3px;
  }

  .tab {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    min-height: var(--hit);
    min-width: var(--hit);
    padding: 0 var(--space-3);
    border: 0;
    background: transparent;
    color: var(--text-muted);
    font-family: var(--font-label);
    font-size: var(--step-0);
    font-weight: var(--weight-medium);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    white-space: nowrap;
    cursor: pointer;
    border-radius: var(--radius-s);
  }
  .tab:hover {
    color: var(--text);
  }
  /* Micro-interactions v2 : l'icône pivote d'un rien au survol, l'onglet s'enfonce à l'appui */
  .tab :global(.icon) {
    transition: transform var(--dur-base) var(--ease-snap);
  }
  @media (hover: hover) {
    .tab:hover:not(:disabled) :global(.icon) {
      transform: rotate(-8deg) scale(1.06);
    }
  }
  .tab:active:not(:disabled) {
    transform: translateY(1px);
  }
  .tab[aria-selected='true'] {
    color: var(--text);
    font-weight: var(--weight-semibold);
  }
  .tab:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .tab:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: -3px;
  }
  /* Indicateur : trait de 3 px qui « s'encre » (scale) — forme, pas seulement couleur */
  .tab::after {
    content: '';
    position: absolute;
    background: var(--accent);
    border-radius: var(--radius-pill);
    opacity: 0;
    transition:
      opacity var(--dur-fade-fast) var(--ease-out),
      transform var(--dur-base) var(--ease-out);
  }
  .tab[aria-selected='true']::after {
    opacity: 1;
    transform: none;
  }
  .line .tab::after {
    inset-inline: var(--space-3);
    inset-block-end: 0;
    height: 3px;
    transform: scaleX(0.3);
  }
  .line .list {
    border-block-end: var(--border) solid var(--line);
  }
  .line .tab {
    flex: none;
  }
  .bar .tab {
    flex: 1;
    flex-direction: column;
    gap: var(--space-0-5);
    min-width: 0;
    padding: var(--space-1) 0;
    font-size: var(--step--1);
    letter-spacing: var(--tracking-tight);
    border-radius: 0;
  }
  .bar .tab::after {
    inset-inline: 30%;
    inset-block-start: 0;
    height: 3px;
    transform: scaleX(0.3);
  }
  .bar .text {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .rail .tab {
    width: var(--hit-l);
    height: var(--hit-l);
    padding: 0;
  }
  .rail .tab {
    border-radius: var(--radius-pill);
  }
  /* Rail : l'onglet actif est « sous la lampe » (pastille de lumière + couleur + barre) */
  .rail .tab[aria-selected='true'] {
    color: var(--accent);
    background: radial-gradient(closest-side, var(--accent-tint), transparent);
  }
  .rail .tab::after {
    inset-inline-start: calc((var(--rail-w) - var(--hit-l)) / -2);
    inset-block: var(--space-2);
    width: 3px;
    transform: scaleY(0.3);
  }

  /* ── Onglets de chemise (v2) ─────────────────────────────────────── */
  .folder .list {
    align-items: flex-end;
    gap: var(--space-0-5);
    padding-inline: var(--space-3);
    margin-block-end: -1px;
    position: relative;
    z-index: var(--z-raised);
  }
  .folder .tab {
    flex: none;
    min-height: var(--hit);
    padding: 0 var(--space-4);
    background: var(--kraft-shade);
    color: var(--text);
    border-radius: var(--radius-tab) var(--radius-tab) 0 0;
    box-shadow: inset 0 1px 0 var(--edge-light);
    transform: translateY(6px);
    transition: transform var(--dur-base) var(--ease-snap);
  }
  @media (hover: hover) {
    .folder .tab:hover:not(:disabled, [aria-selected='true']) {
      transform: translateY(2px);
    }
  }
  .folder .tab:active:not(:disabled) {
    transform: translateY(7px);
  }
  .folder .tab[aria-selected='true'] {
    background: var(--kraft);
    font-weight: var(--weight-semibold);
    transform: none;
    z-index: 1;
  }
  .folder .tab::after {
    inset-inline: var(--space-4);
    inset-block-start: var(--space-1);
    height: 3px;
    background: var(--brand);
    transform: scaleX(0.3);
  }
  .folder .panel {
    background: var(--kraft);
    border-radius: 0 var(--radius-m) var(--radius-m) var(--radius-m);
    box-shadow: var(--shadow-paper);
    color: var(--text);
  }

  .badge {
    min-width: 1.25rem;
    height: 1.25rem;
    padding: 0 var(--space-1);
    display: inline-grid;
    place-items: center;
    border-radius: var(--radius-pill);
    background: var(--accent);
    color: var(--accent-contrast);
    font-family: var(--font-ui);
    font-size: 0.75rem;
    font-weight: var(--weight-bold);
    letter-spacing: 0;
    line-height: 1;
    /* la pastille « saute » quand sa valeur change (bloc {#key} côté appelant) ou à l'apparition */
    animation: m-pop var(--dur-base) var(--ease-snap);
  }
  .bar .badge,
  .rail .badge,
  .icon-only [role='tablist'] .badge {
    position: absolute;
    inset-block-start: var(--space-1);
    inset-inline-start: calc(50% + 0.4rem);
    box-shadow: 0 0 0 2px var(--surface-1);
  }

  .tip {
    position: absolute;
    inset-inline-start: calc(100% + var(--space-3));
    inset-block-start: 50%;
    z-index: var(--z-tooltip);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-xs);
    background: var(--text);
    color: var(--canvas);
    font-size: var(--step--1);
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transform: translateY(-50%);
    transition: opacity var(--dur-fade-fast) var(--ease-out);
  }
  .tab:hover .tip,
  .tab:focus-visible .tip {
    opacity: 1;
    transition-delay: var(--tooltip-delay);
  }
  @media (hover: none) {
    .tip {
      display: none;
    }
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
    .tab[aria-selected='true']::after {
      background: Highlight;
    }
  }
</style>
