<script lang="ts">
  import type { Snippet } from 'svelte';
  import { IconButton } from '@arbre/ui';
  import { messages } from '../messages.fr';

  /** Cadre commun des écrans hors partie : en-tête (retour, titre), contenu défilant. */
  interface Props {
    title: string;
    kicker?: string;
    onback?: () => void;
    width?: 'narrow' | 'wide';
    children: Snippet;
    actions?: Snippet;
  }
  let { title, kicker, onback, width = 'narrow', children, actions }: Props = $props();
</script>

<div class="screen">
  <header class="head">
    {#if onback}
      <IconButton icon="back" label={messages.back} onclick={onback} />
    {/if}
    <div class="titles">
      {#if kicker}<p class="kicker caps">{kicker}</p>{/if}
      <h1>{title}</h1>
    </div>
    {#if actions}<div class="actions">{@render actions()}</div>{/if}
  </header>
  <main id="contenu" class="body {width}" tabindex="-1">
    {@render children()}
  </main>
</div>

<style>
  .screen {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    height: 100dvh;
  }
  .head {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--gutter);
    padding-block-start: max(var(--space-3), env(safe-area-inset-top));
    padding-inline: max(var(--gutter), env(safe-area-inset-left))
      max(var(--gutter), env(safe-area-inset-right));
    border-block-end: var(--border) solid var(--line);
  }
  .titles {
    flex: 1;
    min-width: 0;
  }
  .kicker {
    color: var(--text-muted);
    font-size: var(--step--1);
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
  }
  h1 {
    font-family: var(--font-display);
    font-weight: var(--weight-semibold);
    font-size: var(--step-3);
    line-height: var(--leading-tight);
    text-wrap: balance;
  }
  .body {
    overflow-y: auto;
    padding: var(--space-6) var(--gutter);
    padding-block-end: max(var(--space-8), env(safe-area-inset-bottom));
    outline: none;
  }
  .body > :global(*) {
    max-width: var(--container-narrow);
    margin-inline: auto;
  }
  .body.wide > :global(*) {
    max-width: var(--container);
  }
</style>
