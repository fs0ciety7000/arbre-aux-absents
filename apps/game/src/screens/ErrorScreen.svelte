<script lang="ts">
  import { Button, DymoLabel, LampLight, pushToast } from '@arbre/ui';
  import type { FatalError } from '../lib/game/app.svelte';
  import { messages } from '../messages.fr';

  /** Erreur de chargement : code, retour au titre, journal technique copiable (ECRANS §5). */
  interface Props {
    error: FatalError;
    onback: () => void;
  }
  let { error, onback }: Props = $props();
  const m = messages.errors;

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${error.code}\n${error.message}\n${error.detail}`);
      pushToast({ tone: 'success', title: m.copied, timeout: 2500 });
    } catch {
      /* presse-papiers indisponible : le journal reste affiché */
    }
  }
</script>

<main id="contenu" class="error-screen desk-surface" tabindex="-1">
  <LampLight x={50} y={-10} dust={0} radius="60vmax" />
  <div class="sheet mat-paper mv-sheet" data-surface="paper">
    <div class="box" role="alert">
      <p class="code"><DymoLabel text={m.code(error.code)} tone="red" tilt={-1.5} /></p>
      <h1>{m.title}</h1>
      <p>{error.message}</p>
    </div>
    <pre class="log">{error.detail}</pre>
  </div>
  <div class="actions">
    <Button variant="primary" onclick={onback}>{m.toTitle}</Button>
    <Button iconName="list" onclick={copy}>{m.copyLog}</Button>
  </div>
</main>

<style>
  .error-screen {
    position: relative;
    display: grid;
    align-content: start;
    justify-items: center;
    gap: var(--space-5);
    min-height: 100dvh;
    padding: var(--space-10) var(--gutter);
  }
  .sheet {
    position: relative;
    display: grid;
    gap: var(--space-4);
    width: 100%;
    max-width: var(--container-narrow);
    padding: var(--space-6);
    rotate: -0.4deg;
  }
  h1 {
    margin: var(--space-2) 0;
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-weight: var(--weight-display-black);
    font-size: var(--step-3);
    line-height: var(--leading-display);
    color: var(--danger);
  }
  .code {
    margin: 0;
  }
  .log {
    max-height: 40vh;
    overflow: auto;
    padding: var(--space-3);
    background: var(--surface-2);
    border-radius: var(--radius-xs);
    margin: 0;
    font-family: var(--font-type);
    font-size: var(--step--1);
    white-space: pre-wrap;
  }
  .actions {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }
</style>
