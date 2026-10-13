<script lang="ts">
  import type { Snippet } from 'svelte';
  import { DymoLabel, IconButton, LampLight, Ornament, PaperSheet } from '@arbre/ui';
  import { messages } from '../messages.fr';

  /**
   * Cadre commun des écrans hors partie (v2, DESIGN §6, §7.3) : le bureau sous la lampe ;
   * en-tête (retour, surtitre à l'étiqueteuse, titre d'affiche, filet de fougère) ; contenu
   * défilant posé sur le bureau (`surface="desk"`) ou sur une feuille (`surface="paper"`).
   */
  interface Props {
    title: string;
    kicker?: string;
    onback?: () => void;
    width?: 'narrow' | 'wide';
    surface?: 'desk' | 'paper';
    children: Snippet;
    actions?: Snippet;
  }
  let {
    title,
    kicker,
    onback,
    width = 'narrow',
    surface = 'desk',
    children,
    actions,
  }: Props = $props();
</script>

<div class="screen desk-surface">
  <LampLight x={72} y={-12} dust={8} radius="70vmax" />
  <header class="head">
    {#if onback}
      <IconButton icon="back" label={messages.back} onclick={onback} />
    {/if}
    <div class="titles">
      {#if kicker}<p class="kicker mv-stamp" style:--i="0">
          <DymoLabel text={kicker} tone="red" tilt={-1.5} />
        </p>{/if}
      <h1 class="mv-ink" style:--i="1">{title}</h1>
      <span class="rule" aria-hidden="true"><Ornament name="divider" size="100%" /></span>
    </div>
    {#if actions}<div class="actions">{@render actions()}</div>{/if}
  </header>
  <main id="contenu" class="body {width}" tabindex="-1">
    {#if surface === 'paper'}
      <div class="sheet">
        <PaperSheet tone="new" tilt={-0.4} fastener="clip" enter="sheet" edge="straight">
          {@render children()}
        </PaperSheet>
      </div>
    {:else}
      <div class="content mv-rise" style:--i="2">
        {@render children()}
      </div>
    {/if}
  </main>
</div>

<style>
  .screen {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    height: 100dvh;
    overflow: hidden;
  }
  .head {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-5) var(--gutter) var(--space-2);
    padding-block-start: max(var(--space-5), env(safe-area-inset-top));
    padding-inline: max(var(--gutter), env(safe-area-inset-left))
      max(var(--gutter), env(safe-area-inset-right));
  }
  .titles {
    flex: 1;
    min-width: 0;
    display: grid;
    gap: var(--space-2);
  }
  .kicker {
    margin: 0;
  }
  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-weight: var(--weight-display-black);
    font-size: var(--step-4);
    line-height: var(--leading-display);
    letter-spacing: var(--tracking-display);
    text-wrap: balance;
  }
  .rule {
    display: block;
    width: min(100%, 15rem);
    color: var(--brand);
  }
  .actions {
    display: flex;
    gap: var(--space-2);
    align-self: center;
  }
  .body {
    position: relative;
    overflow-y: auto;
    padding: var(--space-4) var(--gutter);
    padding-block-end: max(var(--space-10), env(safe-area-inset-bottom));
    outline: none;
  }
  .content,
  .sheet {
    max-width: var(--container-narrow);
    margin-inline: auto;
  }
  .wide .content,
  .wide .sheet {
    max-width: var(--container);
  }
  .sheet {
    padding-block: var(--space-4);
  }
</style>
