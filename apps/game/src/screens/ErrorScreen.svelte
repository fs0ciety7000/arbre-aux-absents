<script lang="ts">
  import { Button, pushToast } from '@arbre/ui';
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

<main id="contenu" class="error-screen" tabindex="-1">
  <div class="box" role="alert">
    <h1>{m.title}</h1>
    <p>{error.message}</p>
    <p class="code num">{m.code(error.code)}</p>
  </div>
  <pre class="log">{error.detail}</pre>
  <div class="actions">
    <Button variant="primary" onclick={onback}>{m.toTitle}</Button>
    <Button iconName="list" onclick={copy}>{m.copyLog}</Button>
  </div>
</main>

<style>
  .error-screen {
    display: grid;
    gap: var(--space-5);
    max-width: var(--container-narrow);
    margin-inline: auto;
    padding: var(--space-8) var(--gutter);
  }
  h1 {
    font-family: var(--font-display);
    font-size: var(--step-3);
    color: var(--danger);
  }
  .code {
    color: var(--text-muted);
  }
  .log {
    max-height: 40vh;
    overflow: auto;
    padding: var(--space-3);
    background: var(--surface-2);
    border-radius: var(--radius-s);
    font-family: var(--font-type);
    font-size: var(--step--1);
    white-space: pre-wrap;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }
</style>
