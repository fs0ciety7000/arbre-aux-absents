<!--
	Sélecteur de candidat (DESIGN.md §9.9, écran P10) : champ de filtre + liste de candidats
	découverts. Motif ARIA 1.2 « combobox » (aria-activedescendant), lignes de 56 px.
	Filtre : préfixe d'abord, puis sous-chaîne, insensible à la casse et aux accents.
	`mode="inline"` (déf.) : la liste est toujours visible (popover, feuille basse) ;
	`mode="popup"` : la liste s'ouvre sous le champ.
-->
<script lang="ts" module>
  export interface Candidate {
    id: string;
    label: string;
    /** Origine : « vu dans : Lettre du 3 mai ». */
    detail?: string;
    /** Mention : « déjà utilisé dans 1 case ». */
    note?: string;
    disabled?: boolean;
  }

  export function fold(s: string): string {
    return s
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';

  interface Props {
    label: string;
    options: Candidate[];
    value?: string | null;
    query?: string;
    placeholder?: string;
    mode?: 'inline' | 'popup';
    hideLabel?: boolean;
    /** Texte de l'état vide (ou snippet `empty`). */
    emptyText?: string;
    /** Libellé de la liste (déf. « Candidats »). */
    listLabel?: string;
    onselect?: (id: string) => void;
    empty?: Snippet;
    id?: string;
    class?: string;
  }

  let {
    label,
    options,
    value = $bindable(null),
    query = $bindable(''),
    placeholder = 'Filtrer…',
    mode = 'inline',
    hideLabel = false,
    emptyText = 'Aucun candidat ne correspond.',
    listLabel = 'Candidats',
    onselect,
    empty,
    id = `combo-${Math.random().toString(36).slice(2, 8)}`,
    class: className = '',
  }: Props = $props();

  let expanded = $state(false);
  let activeIndex = $state(-1);
  let listEl: HTMLUListElement | undefined = $state();

  const filtered = $derived.by(() => {
    const q = fold(query);
    if (!q) return options;
    const starts: Candidate[] = [];
    const contains: Candidate[] = [];
    for (const o of options) {
      const f = fold(o.label);
      if (f.startsWith(q) || f.split(' ').some((w) => w.startsWith(q))) starts.push(o);
      else if (f.includes(q)) contains.push(o);
    }
    return [...starts, ...contains];
  });

  const open = $derived(mode === 'inline' || expanded);
  const activeOption = $derived(activeIndex >= 0 ? filtered[activeIndex] : undefined);
  const activeId = $derived(activeOption ? `${id}-opt-${activeOption.id}` : undefined);

  /** Découpe le libellé pour souligner la partie filtrée (sans HTML injecté). */
  function parts(labelText: string): [string, string, string] {
    const q = fold(query);
    if (!q) return [labelText, '', ''];
    const folded = fold(labelText);
    // fold() conserve la longueur sur les lettres latines usuelles ; sinon on n'emphatise pas
    if (folded.length !== labelText.length) return [labelText, '', ''];
    const at = folded.indexOf(q);
    if (at < 0) return [labelText, '', ''];
    return [
      labelText.slice(0, at),
      labelText.slice(at, at + q.length),
      labelText.slice(at + q.length),
    ];
  }

  function choose(o: Candidate) {
    if (o.disabled) return;
    value = o.id;
    onselect?.(o.id);
    if (mode === 'popup') expanded = false;
  }

  function move(delta: number) {
    const n = filtered.length;
    if (!n) return;
    let i = activeIndex;
    for (let step = 0; step < n; step++) {
      i = (i + delta + n) % n;
      if (!filtered[i]?.disabled) break;
    }
    activeIndex = i;
    const target = filtered[i];
    if (!target) return;
    queueMicrotask(() =>
      listEl
        ?.querySelector(`#${CSS.escape(`${id}-opt-${target.id}`)}`)
        ?.scrollIntoView({ block: 'nearest' }),
    );
  }

  function onkeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        expanded = true;
        move(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        expanded = true;
        move(-1);
        break;
      case 'Home':
        if (open && filtered.length) {
          e.preventDefault();
          activeIndex = -1;
          move(1);
        }
        break;
      case 'End':
        if (open && filtered.length) {
          e.preventDefault();
          activeIndex = 0;
          move(-1);
        }
        break;
      case 'Enter':
        if (activeOption) {
          e.preventDefault();
          choose(activeOption);
        }
        break;
      case 'Escape':
        if (mode === 'popup' && expanded) {
          e.preventDefault();
          e.stopPropagation();
          expanded = false;
        } else if (query) {
          e.preventDefault();
          e.stopPropagation();
          query = '';
        }
        break;
    }
  }

  function oninput() {
    expanded = true;
    activeIndex = filtered.length ? 0 : -1;
  }
</script>

<div class="combo {mode} {className}">
  <label for="{id}-input" class="label" class:visually-hidden={hideLabel}>{label}</label>
  <div class="control">
    <span class="icon"><Icon name="search" /></span>
    <input
      id="{id}-input"
      type="text"
      role="combobox"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      aria-autocomplete="list"
      aria-expanded={open}
      aria-controls="{id}-list"
      aria-activedescendant={activeId}
      {placeholder}
      bind:value={query}
      {oninput}
      {onkeydown}
      onfocus={() => mode === 'popup' && (expanded = true)}
      onblur={() => mode === 'popup' && setTimeout(() => (expanded = false), 120)}
    />
  </div>
  <p class="status visually-hidden" aria-live="polite">
    {filtered.length}
    {filtered.length > 1 ? 'candidats' : 'candidat'}
  </p>
  <ul
    bind:this={listEl}
    id="{id}-list"
    role="listbox"
    aria-label={listLabel}
    class="list"
    hidden={!open}
  >
    {#each filtered as o, i (o.id)}
      {@const [a, b, c] = parts(o.label)}
      <!-- Le clavier est géré par le champ (aria-activedescendant), motif ARIA combobox. -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <li
        id="{id}-opt-{o.id}"
        role="option"
        aria-selected={o.id === value}
        aria-disabled={o.disabled || undefined}
        class="option"
        class:active={i === activeIndex}
        onpointerdown={(e) => e.preventDefault()}
        onclick={() => choose(o)}
        onpointermove={() => (activeIndex = i)}
      >
        <span class="check" aria-hidden="true">
          {#if o.id === value}<Icon name="check" size="1.25rem" />{/if}
        </span>
        <span class="texts">
          <span class="name"
            >{a}{#if b}<mark>{b}</mark>{/if}{c}</span
          >
          {#if o.detail || o.note}
            <span class="detail">
              {o.detail ?? ''}{#if o.detail && o.note}<span aria-hidden="true">
                  ·
                </span>{/if}{#if o.note}<em>{o.note}</em>{/if}
            </span>
          {/if}
        </span>
      </li>
    {:else}
      <li class="empty" role="presentation">
        {#if empty}{@render empty()}{:else}{emptyText}{/if}
      </li>
    {/each}
  </ul>
</div>

<style>
  .combo {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    min-width: 0;
  }
  .label {
    font-weight: var(--weight-semibold);
  }
  .control {
    display: flex;
    align-items: center;
    min-height: var(--hit);
    background: var(--surface-2);
    border: var(--border) solid var(--line-strong);
    border-radius: var(--radius-s);
    box-shadow: var(--shadow-inset);
  }
  .control:has(:focus-visible) {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
  .icon {
    display: inline-flex;
    padding-inline-start: var(--space-3);
    color: var(--text-muted);
  }
  input {
    flex: 1;
    min-width: 0;
    min-height: var(--hit);
    padding: var(--space-2) var(--space-3);
    border: 0;
    background: transparent;
    color: var(--text);
    font-size: var(--step-0);
    outline: none;
  }
  input::placeholder {
    color: var(--text-muted);
    opacity: 1;
  }
  .list {
    list-style: none;
    padding: var(--space-1);
    margin: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    max-height: var(--popover-max-h);
    border-radius: var(--radius-m);
    background: var(--surface-1);
    border: var(--border) solid var(--line);
  }
  .popup .list {
    position: absolute;
    inset-inline: 0;
    inset-block-start: calc(100% + var(--space-1));
    z-index: var(--z-popover);
    box-shadow: var(--shadow-2);
  }
  .option {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: var(--hit-row);
    padding: var(--space-1) var(--space-3) var(--space-1) var(--space-1);
    border-radius: var(--radius-s);
    cursor: pointer;
  }
  .option.active {
    background: var(--accent-tint);
    box-shadow: inset 3px 0 0 var(--accent);
  }
  .option[aria-selected='true'] .name {
    font-weight: var(--weight-semibold);
  }
  .option[aria-disabled='true'] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .check {
    flex: none;
    display: inline-grid;
    place-items: center;
    width: 1.5rem;
    color: var(--accent);
  }
  .texts {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .name {
    font-size: var(--step-0);
    color: var(--text);
  }
  mark {
    background: none;
    color: inherit;
    text-decoration: underline 2px var(--accent);
    text-underline-offset: 0.2em;
  }
  .detail {
    font-size: var(--step--1);
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .empty {
    padding: var(--space-4);
    color: var(--text-muted);
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
    .option.active {
      outline: 2px solid Highlight;
    }
  }
</style>
