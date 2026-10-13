<!--
	Bouton (DESIGN.md §9.1). Rend un <a> si `href` est fourni.
	Un seul `primary` par vue : c'est la lampe qui désigne l'action principale.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import Icon from './Icon.svelte';
  import type { IconName } from './icons';

  type Verb = 'look' | 'take' | 'write' | 'pin' | 'use';
  interface Props extends Omit<HTMLButtonAttributes, 'children'> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'm' | 'l';
    href?: string;
    target?: string;
    rel?: string;
    loading?: boolean;
    block?: boolean;
    /** Icône de tête (nom du jeu d'icônes) ou snippet `icon`. */
    iconName?: IconName;
    /** Verbe point & click : pose le curseur contextuel. */
    verb?: Verb;
    children?: Snippet;
    icon?: Snippet;
    iconEnd?: Snippet;
  }

  let {
    variant = 'secondary',
    size = 'm',
    href,
    target,
    rel,
    loading = false,
    block = false,
    disabled = false,
    type = 'button',
    iconName,
    verb,
    children,
    icon,
    iconEnd,
    onclick,
    class: className = '',
    ...rest
  }: Props = $props();

  const safeRel = $derived(rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined));

  function guard(e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
    if (loading) {
      e.preventDefault();
      return;
    }
    onclick?.(e);
  }
</script>

{#snippet content()}
  {#if loading}
    <span class="spinner" aria-hidden="true"></span>
  {:else if icon}
    {@render icon()}
  {:else if iconName}
    <Icon name={iconName} />
  {/if}
  {#if children}<span class="label">{@render children()}</span>{/if}
  {#if iconEnd}{@render iconEnd()}{/if}
{/snippet}

{#if href && !disabled}
  <a
    class="btn {variant} {size} {className}"
    class:block
    {href}
    {target}
    rel={safeRel}
    data-verb={verb}
    aria-busy={loading || undefined}
  >
    {@render content()}
  </a>
{:else}
  <button
    {...rest}
    class="btn {variant} {size} {className}"
    class:block
    {type}
    disabled={disabled || undefined}
    aria-disabled={loading || undefined}
    aria-busy={loading || undefined}
    data-verb={verb}
    onclick={guard}
  >
    {@render content()}
  </button>
{/if}

<style>
  /* v2 : étiquette en relief. Le primaire a une tranche (--shadow-press) qui s'écrase à
     l'appui ; tous les boutons se soulèvent d'1 px au survol et s'enfoncent à l'appui. */
  .btn {
    --edge: 0 0 0 transparent;
    position: relative;
    isolation: isolate;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    min-height: var(--hit);
    min-width: var(--hit);
    padding: 0 var(--space-4);
    border: var(--border) solid transparent;
    border-radius: var(--radius-s);
    font-family: var(--font-label);
    font-size: var(--step-0);
    font-weight: var(--weight-medium);
    line-height: 1.1;
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
    box-shadow: var(--edge), var(--shadow-1);
    transition: transform var(--dur-fast) var(--ease-snap);
  }
  .btn::before {
    /* couche de survol : seule son opacité est animée */
    content: '';
    position: absolute;
    inset: calc(var(--border) * -1);
    z-index: -1;
    border-radius: inherit;
    opacity: 0;
    transition: opacity var(--dur-fade-fast) var(--ease-out);
  }
  .btn :global(.icon) {
    transition: transform var(--dur-base) var(--ease-snap);
  }
  @media (hover: hover) {
    .btn:hover:not(:disabled, [aria-disabled='true']) {
      transform: translateY(-1px);
    }
    .btn:hover:not(:disabled, [aria-disabled='true']) :global(.icon) {
      transform: rotate(-8deg) scale(1.08);
    }
  }
  .btn:hover::before {
    opacity: 1;
  }
  .btn:active:not(:disabled, [aria-disabled='true']) {
    transform: translateY(var(--press-depth));
    box-shadow: var(--shadow-1);
    transition-duration: var(--dur-instant);
  }
  .l {
    min-height: var(--hit-l);
    padding: 0 var(--space-6);
    font-size: var(--step-1);
  }
  .block {
    display: flex;
    width: 100%;
  }
  .label {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .primary {
    --edge: var(--shadow-press);
    background: var(--accent);
    color: var(--accent-contrast);
    font-weight: var(--weight-semibold);
  }
  .primary::before {
    background: var(--accent-strong);
  }
  .secondary {
    --edge: 0 2px 0 var(--line);
    background: var(--surface-2);
    color: var(--text);
    border-color: var(--line-strong);
  }
  .secondary::before {
    background: var(--surface-3);
  }
  .ghost {
    background: transparent;
    color: var(--text);
    box-shadow: none;
  }
  .ghost::before {
    background: var(--accent-tint);
  }
  .danger {
    background: transparent;
    color: var(--danger);
    border-color: currentColor;
    box-shadow: none;
  }
  .danger::before {
    background: var(--surface-2);
  }

  .btn:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 3px;
  }
  .btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    box-shadow: none;
  }
  .btn:disabled::before {
    opacity: 0;
  }
  .btn[aria-busy='true'] {
    cursor: progress;
  }

  .spinner {
    width: 1em;
    height: 1em;
    border: 2px solid currentColor;
    border-inline-end-color: transparent;
    border-radius: var(--radius-pill);
    animation: spin var(--dur-loop) linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(1turn);
    }
  }
  @media (forced-colors: active) {
    .btn {
      border-color: ButtonText;
    }
  }
</style>
