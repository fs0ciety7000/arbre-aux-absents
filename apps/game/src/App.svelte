<script lang="ts">
  import { ArtDefs, SkipLink, ToastRegion } from '@arbre/ui';
  import { onMount, type Component } from 'svelte';
  import { audio } from './audio/engine';
  import { installGamepad, installKeyboard } from './input/controller';
  import { input } from './input/device.svelte';
  import { announcer } from './lib/game/announcer.svelte';
  import { AppController, CONTENT_SCREENS } from './lib/game/app.svelte';
  import { setApp } from './lib/game/context';
  import { viewport } from './lib/game/viewport.svelte';
  import { messages } from './messages.fr';
  import Achievements from './screens/Achievements.svelte';
  import Bonus from './screens/Bonus.svelte';
  import ContentLoading from './screens/ContentLoading.svelte';
  import Ending from './screens/Ending.svelte';
  import ErrorScreen from './screens/ErrorScreen.svelte';
  import Launch from './screens/Launch.svelte';
  import NewGame from './screens/NewGame.svelte';
  import Options from './screens/Options.svelte';
  import Slots from './screens/Slots.svelte';
  import Stats from './screens/Stats.svelte';
  import Title from './screens/Title.svelte';

  const app = new AppController();
  setApp(app);

  // Écrans qui lisent l'affaire : elle est chargée à leur ouverture (module à part).
  const needsContent = $derived(CONTENT_SCREENS.includes(app.screen));
  $effect(() => {
    if (needsContent && app.contentStatus === 'idle') void app.ensureContent();
  });

  // Crédits (logos inlinés, ~65 Ko) chargés à la demande.
  let Credits = $state<Component | null>(null);
  $effect(() => {
    if (app.screen === 'credits' && !Credits) {
      void import('./screens/Credits.svelte').then((m) => (Credits = m.default));
    }
  });

  onMount(() => {
    input.install();
    void app.init();
    // Accès de recette (e2e, développement uniquement ; éliminé du build).
    if (import.meta.env.DEV) (window as unknown as { __arbre: AppController }).__arbre = app;
    const offKeys = installKeyboard(app);
    const offPad = installGamepad(app);
    // Son discret d'interface sur les boutons (bus « interface »).
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.('button')) audio.play('tap');
    };
    window.addEventListener('click', onClick, { capture: true, passive: true });
    return () => {
      offKeys();
      offPad();
      window.removeEventListener('click', onClick, { capture: true });
      app.dispose();
    };
  });

  // Le focus suit le changement d'écran (lecteurs d'écran, clavier).
  let lastScreen = '';
  $effect(() => {
    const gate = needsContent && app.contentStatus !== 'ready';
    const key = `${app.screen}|${app.overlay ?? ''}|${gate}`;
    if (key === lastScreen) return;
    lastScreen = key;
    if (app.screen === 'launch' || app.screen === 'title') return;
    queueMicrotask(() => {
      const target = app.overlay
        ? document.querySelector<HTMLElement>('.overlay #contenu')
        : document.getElementById('contenu');
      target?.focus({ preventScroll: true });
    });
  });

  const toastOffset = $derived(
    app.screen === 'desk' && viewport.single ? 'calc(var(--tabbar-h) + var(--space-2))' : '0px',
  );
</script>

<SkipLink href="#contenu" label={messages.skipToContent} />
<ArtDefs />

{#if viewport.tooSmall}
  <div class="too-small" role="alert">
    <p class="big">{messages.errors.tooSmall}</p>
    <p>{messages.errors.tooSmallText}</p>
  </div>
{/if}

<div class="app" class:hidden={viewport.tooSmall}>
  {#if app.fatal}
    <ErrorScreen
      error={app.fatal}
      onback={() => {
        app.fatal = null;
        app.closeGame();
        app.goto('title');
      }}
    />
  {:else if needsContent && app.contentStatus !== 'ready'}
    <ContentLoading />
  {:else if app.screen === 'launch'}
    <Launch />
  {:else if app.screen === 'title'}
    <Title />
  {:else if app.screen === 'slots'}
    <Slots />
  {:else if app.screen === 'new-game'}
    <NewGame />
  {:else if app.screen === 'options'}
    <Options />
  {:else if app.screen === 'achievements'}
    <Achievements />
  {:else if app.screen === 'stats'}
    <Stats />
  {:else if app.screen === 'bonus'}
    <Bonus />
  {:else if app.screen === 'credits'}
    {#if Credits}<Credits />{/if}
  {:else if app.screen === 'ending'}
    <Ending />
  {:else if app.screen === 'desk' && app.game && app.desk}
    {#key app.game}
      <app.desk game={app.game} />
    {/key}
    {#if app.overlay}
      <div class="overlay">
        {#if app.overlay === 'options'}
          <Options />
        {:else if app.overlay === 'achievements'}
          <Achievements />
        {:else}
          <Stats />
        {/if}
      </div>
    {/if}
  {/if}
</div>

{#if app.game?.saveFailed}
  <div class="save-banner" role="alert">
    <span>{messages.toasts.saveFailed}</span>
    <button type="button" onclick={() => app.game?.flush(true)}>{messages.retry}</button>
    <button type="button" onclick={() => app.game && app.exportSlot(app.game.state.slot)}
      >{messages.toasts.exportNow}</button
    >
  </div>
{/if}

<ToastRegion offset={toastOffset} />

<div class="visually-hidden" aria-live="polite" aria-atomic="true">{announcer.polite}</div>
<div class="visually-hidden" aria-live="assertive" aria-atomic="true">{announcer.assertive}</div>

<style>
  .app {
    min-height: 100dvh;
  }
  .hidden {
    display: none;
  }
  .overlay {
    position: fixed;
    inset: 0;
    z-index: var(--z-drawer);
    background: var(--canvas);
    overflow: hidden;
  }
  .too-small {
    display: grid;
    place-content: center;
    gap: var(--space-2);
    min-height: 100dvh;
    padding: var(--space-4);
    text-align: center;
  }
  .big {
    font-family: var(--font-display);
    font-size: var(--step-2);
  }
  .save-banner {
    position: fixed;
    inset-inline: 0;
    inset-block-start: 0;
    z-index: var(--z-toast);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--gutter);
    padding-block-start: max(var(--space-2), env(safe-area-inset-top));
    background: var(--surface-3);
    color: var(--warning);
    box-shadow: var(--shadow-2);
  }
  .save-banner button {
    min-height: var(--hit);
    padding-inline: var(--space-3);
    background: var(--surface-2);
    color: var(--text);
    border: var(--border) solid var(--line-strong);
    border-radius: var(--radius-s);
    cursor: pointer;
  }
  .save-banner button:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
</style>
