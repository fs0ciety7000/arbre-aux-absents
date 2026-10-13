<script lang="ts">
  import { progress } from '@arbre/engine';
  import { Button, IconButton } from '@arbre/ui';
  import { formatClock } from '../lib/game/format';
  import type { GameStoreImpl } from '../lib/game/store.svelte';
  import { viewport } from '../lib/game/viewport.svelte';
  import { messages } from '../messages.fr';

  interface Props {
    game: GameStoreImpl;
    onmenu: () => void;
  }
  let { game, onmenu }: Props = $props();

  const m = messages.desk;
  const p = $derived(progress(game.state, game.content));
  const phone = $derived(viewport.single);
  const showTimer = $derived(game.state.mode === 'timed' || game.settings.showTimer);
</script>

<header class="header" class:phone aria-label={m.headerLabel}>
  <IconButton icon="back" label={m.back} onclick={() => game.back()} />
  {#if !phone}
    <p class="name">{messages.title}</p>
  {/if}
  <div class="counters">
    <span class="counter num" title={m.identifiedLabel(p.locked, p.total)}>
      <span aria-hidden="true"
        >{phone ? m.identifiedShort(p.locked, p.total) : m.identified(p.locked, p.total)}</span
      >
      <span class="visually-hidden">{m.identifiedLabel(p.locked, p.total)}</span>
    </span>
    {#if !phone}
      <span class="counter num">
        <span aria-hidden="true">{m.secrets(p.secrets)}</span>
        <span class="visually-hidden">{m.secretsLabel(p.secrets)}</span>
      </span>
    {/if}
    {#if showTimer}
      <span class="counter num timer" role="timer" aria-label={m.timer}
        >{formatClock(game.state.elapsedMs)}</span
      >
    {/if}
  </div>
  <div class="actions">
    {#if game.reportAvailable}
      {#if phone}
        <IconButton
          icon="stamp"
          variant="primary"
          label={m.reopenReport}
          onclick={() => game.reopenReport()}
        />
      {:else}
        <Button variant="primary" iconName="stamp" onclick={() => game.reopenReport()}
          >{m.reopenReport}</Button
        >
      {/if}
    {/if}
    {#if game.settings.validation === 'manual'}
      <IconButton
        icon="check"
        label={m.validateBranch}
        onclick={() => game.dispatch({ type: 'validate' })}
      />
    {/if}
    <IconButton icon="help" label={m.help} onclick={() => game.showPanel('help')} />
    {#if phone}
      <IconButton icon="menu" label={m.menu} onclick={onmenu} />
    {:else}
      <IconButton icon="pause" label={m.pause} onclick={() => game.openPause()} />
    {/if}
  </div>
</header>

<style>
  .header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: var(--header-h);
    padding-inline: var(--space-2);
    padding-block-start: env(safe-area-inset-top);
    padding-inline-start: max(var(--space-2), env(safe-area-inset-left));
    padding-inline-end: max(var(--space-2), env(safe-area-inset-right));
    background: var(--surface-1);
    border-block-end: var(--border) solid var(--line);
    box-shadow: var(--shadow-1);
    position: relative;
    z-index: var(--z-header);
  }
  .header.phone {
    min-height: var(--header-h-phone);
  }
  .name {
    font-family: var(--font-display);
    font-weight: var(--weight-semibold);
    font-size: var(--step-0);
    white-space: nowrap;
  }
  .counters {
    flex: 1;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-4);
    min-width: 0;
    color: var(--text-muted);
    font-size: var(--step-0);
  }
  .counter {
    white-space: nowrap;
  }
  .timer {
    color: var(--text);
  }
  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }
</style>
