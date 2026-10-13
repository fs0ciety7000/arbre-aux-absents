<script lang="ts">
  import { Button, Dialog } from '@arbre/ui';
  import { getApp } from '../../lib/game/context';
  import type { GameStoreImpl } from '../../lib/game/store.svelte';
  import { messages } from '../../messages.fr';
  import PauseMenu from './PauseMenu.svelte';

  /** Modaux du Bureau : P14 Pause, P13 carte de révélation, P12 secret (un à la fois). */
  interface Props {
    game: GameStoreImpl;
  }
  let { game }: Props = $props();
  const app = getApp();

  const current = $derived(game.modal);
  // Une modale native recouvre tout : on la masque quand un écran (Options…) passe devant.
  const visible = $derived(current !== null && app.overlay === null);

  function closed(uid: number) {
    if (app.overlay !== null) return; // masquée pour laisser passer l'écran, pas fermée
    game.closeModal(uid);
  }
</script>

{#if current}
  {#key current.uid}
    {#if current.kind === 'pause'}
      <PauseMenu {game} open={visible} onclose={() => closed(current.uid)} />
    {:else if current.kind === 'reveal'}
      <Dialog
        open={visible}
        title={current.title}
        kicker={messages.reveal.kicker}
        surface="paper"
        size="s"
        onclose={() => closed(current.uid)}
      >
        {#each current.lines as line, i (i)}
          <p class="reading">{line}</p>
        {/each}
        <p class="note">{messages.reveal.archived}</p>
        {#snippet actions()}
          <Button variant="primary" onclick={() => game.closeModal(current.uid)}
            >{messages.reveal.continue}</Button
          >
        {/snippet}
      </Dialog>
    {:else if current.kind === 'secret'}
      <Dialog
        open={visible}
        title={current.title}
        kicker={messages.secret.kicker}
        surface="paper"
        size="s"
        onclose={() => closed(current.uid)}
      >
        <p class="reading">{messages.secret.text}</p>
        <p class="note">{messages.secret.archived}</p>
        {#snippet actions()}
          <Button variant="primary" onclick={() => game.closeModal(current.uid)}
            >{messages.secret.continue}</Button
          >
        {/snippet}
      </Dialog>
    {/if}
  {/key}
{/if}

<style>
  .note {
    margin-block-start: var(--space-3);
    color: var(--text-muted);
    font-size: var(--step--1);
  }
</style>
