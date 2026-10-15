<script lang="ts">
  import { progress } from '@arbre/engine';
  import { Button, DymoLabel, Icon, IconButton, Wordmark } from '@arbre/ui';
  import { getApp } from '../lib/game/context';
  import { formatClock } from '../lib/game/format';
  import type { GameStoreImpl } from '../lib/game/store.svelte';
  import { viewport } from '../lib/game/viewport.svelte';
  import { messages } from '../messages.fr';

  /**
   * En-tête du Bureau (DESIGN §13.2) : posé sur le sous-main, sans bandeau ; titre du jeu en
   * une ligne, affaire à l'étiqueteuse rouge, compteurs à la machine à écrire (la valeur qui
   * change « saute »), outils en icônes encrées.
   */
  interface Props {
    game: GameStoreImpl;
    onmenu: () => void;
    /** Bouton « replier / déplier le volet » (Bureau à plusieurs zones). */
    sideToggle?: boolean;
  }
  let { game, onmenu, sideToggle = false }: Props = $props();

  const app = getApp();
  const m = messages.desk;
  const p = $derived(progress(game.state, game.content));
  const phone = $derived(viewport.single);
  const wide = $derived(viewport.kind === 'desktop');
  const showTimer = $derived(game.state.mode === 'timed' || game.settings.showTimer);
</script>

<header class="header" class:phone aria-label={m.headerLabel}>
  <IconButton icon="back" variant="ghost" label={m.back} onclick={() => game.back()} />
  {#if !phone}
    <!-- Wordmark `as="p"` pose un aria-label interdit sur <p> : décor masqué + texte. -->
    <span class="wm" aria-hidden="true"><Wordmark size="header" as="span" /></span>
    <span class="visually-hidden">{messages.title}</span>
    {#if wide}
      <span class="case"><DymoLabel text={game.content.meta.title} tone="red" tilt={-1} /></span>
    {/if}
  {/if}
  <div class="counters">
    <span class="counter num" title={m.identifiedLabel(p.locked, p.total)}>
      <Icon name="stamp" size="1.1rem" />
      {#key p.locked}
        <span class="value mv-pop" aria-hidden="true"
          >{phone ? m.identifiedShort(p.locked, p.total) : m.identified(p.locked, p.total)}</span
        >
      {/key}
      <span class="visually-hidden">{m.identifiedLabel(p.locked, p.total)}</span>
    </span>
    {#if !phone}
      <span class="counter num">
        <Icon name="sparkle" size="1.1rem" />
        {#key p.secrets}
          <span class="value mv-pop" aria-hidden="true">{m.secrets(p.secrets)}</span>
        {/key}
        <span class="visually-hidden">{m.secretsLabel(p.secrets)}</span>
      </span>
    {/if}
    {#if showTimer}
      <span class="counter num timer" role="timer" aria-label={m.timer}
        ><Icon name="clock" size="1.1rem" />{formatClock(game.state.elapsedMs)}</span
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
        variant="ghost"
        label={m.validateBranch}
        tooltip
        onclick={() => game.dispatch({ type: 'validate' })}
      />
    {/if}
    {#if sideToggle}
      <IconButton
        icon="reader"
        variant="ghost"
        label={game.sideCollapsed ? m.sideExpand : m.sideCollapse}
        pressed={!game.sideCollapsed}
        tooltip
        onclick={() => (game.sideCollapsed = !game.sideCollapsed)}
      />
    {/if}
    <!-- Signaler un problème (DESIGN §13.8) : libellé court au bureau large, icône seule
         (nom accessible complet + infobulle) en tablette et au téléphone. -->
    {#if wide}
      <Button
        variant="ghost"
        iconName="envelope"
        aria-label={messages.bugReport.entry}
        onclick={() => app.openReport()}>{m.report}</Button
      >
    {:else}
      <IconButton
        icon="envelope"
        variant="ghost"
        label={messages.bugReport.entry}
        tooltip
        onclick={() => app.openReport()}
      />
    {/if}
    <IconButton
      icon="help"
      variant="ghost"
      label={m.help}
      tooltip
      data-tour="help"
      onclick={() => game.showPanel('help')}
    />
    {#if phone}
      <IconButton icon="menu" variant="ghost" label={m.menu} onclick={onmenu} />
    {:else}
      <IconButton
        icon="pause"
        variant="ghost"
        label={m.pause}
        tooltip
        onclick={() => game.openPause()}
      />
    {/if}
  </div>
</header>

<style>
  .header {
    position: relative;
    z-index: var(--z-header);
    display: flex;
    align-items: center;
    gap: var(--space-2) var(--space-4);
    min-height: var(--header-h);
    padding: var(--space-2) var(--space-3) 0;
    padding-block-start: max(var(--space-2), env(safe-area-inset-top));
    padding-inline-start: max(var(--space-3), env(safe-area-inset-left));
    padding-inline-end: max(var(--space-3), env(safe-area-inset-right));
  }
  .header.phone {
    min-height: var(--header-h-phone);
    gap: var(--space-2);
  }
  .case {
    flex: none;
    max-width: 18rem;
    overflow: hidden;
    white-space: nowrap;
  }
  .counters {
    flex: 1;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-5);
    min-width: 0;
    color: var(--text-muted);
    font-family: var(--font-type);
    font-size: var(--step-0);
  }
  .counter {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    white-space: nowrap;
  }
  .counter :global(.icon) {
    color: var(--brand);
  }
  .value {
    display: inline-block;
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
