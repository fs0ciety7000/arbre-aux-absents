<script lang="ts">
  import type { Component } from 'svelte';
  import { onMount } from 'svelte';
  import { Button } from '@arbre/ui';
  import { getApp } from '../lib/game/context';
  import { loadKeyArt } from '../lib/game/keyart';
  import { messages } from '../messages.fr';

  /**
   * E01 : logo du studio (≤ 2 s, passable au clic ou à n'importe quelle touche). Même
   * composition que l'écran d'attente HTML (index.html, src/shell/splash.css), qu'il remplace
   * sans saut visible : seul le logo apparaît.
   */
  const app = getApp();
  let Logo = $state<Component<{ class?: string }> | null>(null);
  let done = false;

  function next() {
    if (done) return;
    done = true;
    app.goto('title');
  }

  onMount(() => {
    void import('./brand/InteractiveLogo.svelte').then((m) => (Logo = m.default));
    // L'art clé de l'écran titre se télécharge pendant le logo (un seul cadrage).
    loadKeyArt().catch(() => undefined);
    const onKey = (e: KeyboardEvent) => {
      // `done` : l'écran reste monté le temps de s'escamoter ; la touche suivante est au titre.
      if (e.key === 'Tab' || !app.ready || done) return;
      // La touche ne fait que passer le logo : sans cela, Entrée / Espace activeraient aussi le
      // premier bouton du titre (focalisé au montage), « Continuer » ou « Nouvelle partie ».
      e.preventDefault();
      next();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  });

  // 2 s au plus depuis l'ouverture de la page : l'écran d'attente HTML (même composition) en a
  // déjà montré une partie. Si l'initialisation finit après, on enchaîne dès qu'elle est prête.
  let elapsed = $state(false);
  onMount(() => {
    const t = setTimeout(() => (elapsed = true), Math.max(0, 2000 - performance.now()));
    return () => clearTimeout(t);
  });
  $effect(() => {
    if (elapsed && app.ready) next();
  });
</script>

<main id="contenu" class="launch desk-surface" tabindex="-1">
  <button
    type="button"
    class="stage"
    onclick={() => app.ready && next()}
    aria-label={messages.launch.skip}
  >
    <span class="logo" aria-hidden="true">
      {#if Logo}<Logo />{/if}
    </span>
    <span class="studio">{messages.studio}</span>
    <span class="presents">{messages.launch.presents}</span>
    <span class="game-title">L’Arbre <em>aux</em> absents</span>
    <span class="tagline">{messages.tagline}</span>
  </button>
  <div class="skip">
    <Button variant="ghost" onclick={next} disabled={!app.ready}>{messages.launch.skip}</Button>
  </div>
</main>

<style>
  /* Même composition que l'écran d'attente HTML (src/shell/splash.css) : rien ne saute. */
  .launch {
    position: relative;
    display: grid;
    place-items: center;
    min-height: 100dvh;
    padding: var(--space-8) var(--gutter);
    outline: none;
    --lamp-x: 50%;
    --lamp-y: -8%;
  }
  .stage {
    display: grid;
    justify-items: center;
    gap: var(--space-3);
    padding: 0;
    background: none;
    border: 0;
    color: var(--text-muted);
    font: inherit;
    text-align: center;
    cursor: pointer;
  }
  .stage:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
    border-radius: var(--radius-m);
  }
  .logo {
    display: block;
    width: 8rem;
    height: 6.5rem;
    animation:
      m-fade-in var(--dur-slow) var(--ease-out) backwards,
      m-settle var(--dur-open) var(--ease-paper) backwards;
  }
  .logo :global(svg) {
    width: 100%;
    height: 100%;
  }
  .studio {
    font-family: var(--font-label);
    font-weight: var(--weight-medium);
    font-size: var(--step-1);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--text);
  }
  .presents {
    font-family: var(--font-display);
    font-style: italic;
    font-size: var(--step-0);
  }
  .game-title {
    margin-block-start: var(--space-4);
    max-width: 14ch;
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-weight: var(--weight-display-black);
    font-size: var(--step-6);
    line-height: var(--leading-display);
    letter-spacing: var(--tracking-display);
    color: var(--text);
    text-wrap: balance;
  }
  .game-title em {
    font-style: italic;
    font-weight: var(--weight-display);
    color: var(--brand);
  }
  .tagline {
    max-width: 34rem;
    font-family: var(--font-display);
    font-style: italic;
    font-size: var(--step-1);
  }
  .skip {
    position: absolute;
    inset-block-end: max(var(--space-4), env(safe-area-inset-bottom));
    inset-inline-end: max(var(--space-4), env(safe-area-inset-right));
  }
</style>
