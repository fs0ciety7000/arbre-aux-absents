<!--
	Onglets (DESIGN.md §9.3), motif ARIA « tabs » avec tabindex itinérant.
	Variantes : `line` (onglets d'un volet), `bar` (barre basse du téléphone, 64 px),
	`rail` (rail vertical d'icônes du Bureau, 64 px). Le snippet `children` reçoit l'id actif
	et est rendu dans le tabpanel.
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
    variant?: 'line' | 'bar' | 'rail';
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
    activation = 'auto',
    idPrefix = `tabs-${Math.random().toString(36).slice(2, 8)}`,
    onchange,
    children,
    class: className = '',
  }: Props = $props();

  const vertical = $derived(variant === 'rail');
  let focusedId = $state<string | null>(null);

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
    document.getElementById(`${idPrefix}-tab-${target.id}`)?.focus();
    if (activation === 'auto') select(target.id);
  }

  const tabbable = $derived(focusedId ?? value);
</script>

<div class="tabs {variant} {className}">
  <div
    class="list"
    role="tablist"
    aria-label={label}
    aria-orientation={vertical ? 'vertical' : 'horizontal'}
  >
    {#each items as item (item.id)}
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
        onclick={() => select(item.id)}
        onkeydown={(e) => onkeydown(e, item)}
        onfocus={() => (focusedId = item.id)}
        onblur={() => (focusedId = null)}
      >
        {#if item.icon}<Icon name={item.icon} size="1.5rem" />{/if}
        <span class="text" class:visually-hidden={variant === 'rail'}>{item.label}</span>
        {#if item.badge}
          <span class="badge num" aria-hidden="true">{item.badge}</span>
          {#if item.badgeLabel}<span class="visually-hidden">, {item.badgeLabel}</span>{/if}
        {/if}
        {#if variant === 'rail'}<span class="tip" aria-hidden="true">{item.label}</span>{/if}
      </button>
    {/each}
  </div>
  {#if children}
    <div
      class="panel"
      role="tabpanel"
      id="{idPrefix}-panel"
      aria-labelledby="{idPrefix}-tab-{value}"
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
    font-family: var(--font-ui);
    font-size: var(--step-0);
    font-weight: var(--weight-medium);
    white-space: nowrap;
    cursor: pointer;
    border-radius: var(--radius-s);
  }
  .tab:hover {
    color: var(--text);
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
    letter-spacing: -0.01em;
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
  .rail .tab[aria-selected='true'] {
    color: var(--accent);
    background: var(--accent-tint);
  }
  .rail .tab::after {
    inset-inline-start: calc((var(--rail-w) - var(--hit-l)) / -2);
    inset-block: var(--space-2);
    width: 3px;
    transform: scaleY(0.3);
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
    font-size: 0.75rem;
    font-weight: var(--weight-bold);
    line-height: 1;
  }
  .bar .badge,
  .rail .badge {
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
