<script lang="ts">
  import { Button, Dialog } from '@arbre/ui';
  import { getApp } from '../../lib/game/context';
  import type { GameStoreImpl } from '../../lib/game/store.svelte';
  import { messages } from '../../messages.fr';

  /** P14 Pause : Reprendre, Options, Succès, Statistiques, Sauvegarder et quitter. */
  interface Props {
    game: GameStoreImpl;
    open: boolean;
    onclose: () => void;
  }
  let { game, open, onclose }: Props = $props();
  const app = getApp();
  const m = messages.pause;
  let confirming = $state(false);
  let quitting = $state(false);

  async function quit() {
    quitting = true;
    await app.saveAndQuit();
  }
</script>

<Dialog
  {open}
  title={confirming ? m.quitConfirm : m.title}
  kicker={m.kicker}
  description={confirming ? m.quitText : undefined}
  size="s"
  {onclose}
>
  {#if confirming}
    <div class="list">
      <Button variant="primary" block loading={quitting} onclick={quit}>{m.saveQuit}</Button>
      <Button block onclick={() => (confirming = false)}>{messages.cancel}</Button>
    </div>
  {:else}
    <div class="list">
      <Button variant="primary" block iconName="forward" onclick={() => game.closeModal()}
        >{m.resume}</Button
      >
      <Button block iconName="settings" onclick={() => app.goto('options')}>{m.options}</Button>
      <Button block iconName="star" onclick={() => app.goto('achievements')}
        >{m.achievements}</Button
      >
      <Button block iconName="list" onclick={() => app.goto('stats')}>{m.stats}</Button>
      <Button block iconName="save" onclick={() => (confirming = true)}>{m.saveQuit}</Button>
    </div>
  {/if}
</Dialog>

<style>
  .list {
    display: grid;
    gap: var(--space-2);
  }
</style>
