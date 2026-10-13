<script lang="ts">
  import type { Component } from 'svelte';
  import { onMount } from 'svelte';
  import { Button } from '@arbre/ui';
  import { getApp } from '../lib/game/context';
  import { messages } from '../messages.fr';

  /** E01 : logo du studio (≤ 2 s, passable au clic ou à n'importe quelle touche). */
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' && app.ready) next();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  });

  // Si l'initialisation finit après les 2 s, on enchaîne dès qu'elle est prête.
  let elapsed = $state(false);
  onMount(() => {
    const t = setTimeout(() => (elapsed = true), 2000);
    return () => clearTimeout(t);
  });
  $effect(() => {
    if (elapsed && app.ready) next();
  });
</script>

<main id="contenu" class="launch" tabindex="-1">
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
  </button>
  <div class="skip">
    <Button variant="ghost" onclick={next} disabled={!app.ready}>{messages.launch.skip}</Button>
  </div>
</main>

<style>
  .launch {
    position: relative;
    display: grid;
    place-items: center;
    min-height: 100dvh;
    outline: none;
  }
  .stage {
    display: grid;
    justify-items: center;
    gap: var(--space-3);
    padding: var(--space-8);
    background: none;
    border: 0;
    color: var(--text-muted);
    cursor: pointer;
    animation: fade var(--dur-slow) var(--ease-out) both;
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
  }
  .logo :global(svg) {
    width: 100%;
    height: 100%;
  }
  .studio {
    font-family: var(--font-display);
    font-weight: var(--weight-semibold);
    font-size: var(--step-2);
    color: var(--text);
  }
  .presents {
    font-size: var(--step--1);
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
  }
  .skip {
    position: absolute;
    inset-block-end: max(var(--space-4), env(safe-area-inset-bottom));
    inset-inline-end: max(var(--space-4), env(safe-area-inset-right));
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
</style>
