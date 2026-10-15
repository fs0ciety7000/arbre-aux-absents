<!--
  Contenu de la fenêtre détachée (DESIGN §5.3) : la tête de la fiche (« Ramener la fiche ») puis
  les onglets du volet, montés avec le magasin de la partie : même état que le Bureau.
-->
<script lang="ts">
  import { Button } from '@arbre/ui';
  import type { GameStoreImpl } from '../lib/game/store.svelte';
  import { messages } from '../messages.fr';
  import SideTabs from './SideTabs.svelte';

  interface Props {
    game: GameStoreImpl;
    onback: () => void;
  }
  let { game, onback }: Props = $props();
  const m = messages.desk;
</script>

<div class="popout" data-testid="popout-docs">
  <div class="head">
    <h1 class="title">{m.cardLabel}</h1>
    <Button variant="ghost" iconName="back" onclick={onback}>{m.popoutBack}</Button>
  </div>
  <section class="body" aria-label={m.cardLabel}>
    <SideTabs {game} idPrefix="popout-side" />
  </section>
</div>

<style>
  .popout {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    background: var(--surface-1);
    color: var(--text);
    font-family: var(--font-ui);
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    min-block-size: var(--hit-row);
    padding: var(--space-1) var(--space-3);
    border-block-end: 1.5px dashed var(--stitch);
  }
  .title {
    margin: 0;
    color: var(--text-muted);
    font-family: var(--font-label);
    font-size: var(--step--1);
    font-weight: var(--weight-medium);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
  }
  .body {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-block-size: 0;
  }
  @media (forced-colors: active) {
    .head {
      border-block-end-color: CanvasText;
    }
  }
</style>
