<script lang="ts">
  import { IconButton, Icon } from '@arbre/ui';
  import type { GameStoreImpl } from '../lib/game/store.svelte';
  import { messages } from '../messages.fr';

  /** Mini-lecteur (téléphone) : bandeau papier de 72 px, rouvre le document au toucher. */
  interface Props {
    game: GameStoreImpl;
  }
  let { game }: Props = $props();

  const doc = $derived(game.ui.openDocument ? game.content.documents[game.ui.openDocument] : null);
</script>

{#if doc}
  <aside class="mini mat-paper mv-sheet" data-surface="paper" aria-label={messages.desk.miniReader}>
    <button
      type="button"
      class="open"
      onclick={() => game.showPanel('reader')}
      aria-label={messages.desk.miniReaderOpen(doc.title)}
    >
      <Icon name="reader" />
      <span class="title">{doc.title}</span>
      <Icon name="chevron-up" />
    </button>
    <IconButton
      icon="close"
      label={messages.desk.miniReaderHide}
      onclick={() => (game.miniReaderHidden = true)}
    />
  </aside>
{/if}

<style>
  .mini {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    height: var(--mini-reader-h);
    padding-inline: var(--space-2);
    color: var(--text);
    box-shadow: var(--shadow-paper);
    rotate: -0.4deg;
    margin-inline: var(--space-2);
    margin-block-end: var(--space-2);
  }
  .open {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
    min-height: var(--hit);
    padding: var(--space-2);
    background: none;
    border: 0;
    border-radius: var(--radius-s);
    text-align: start;
    cursor: pointer;
  }
  .open:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
  .title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-weight: var(--weight-display);
  }
  .open :global(.icon:first-child) {
    color: var(--brand);
  }
</style>
