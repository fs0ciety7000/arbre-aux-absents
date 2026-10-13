<script lang="ts">
  import { Button, Loader } from '@arbre/ui';
  import { getApp } from '../lib/game/context';
  import { messages } from '../messages.fr';
  import ScreenFrame from './ScreenFrame.svelte';

  /** Ouverture des archives de l'affaire (chargée à la demande) : attente, puis erreur. */
  const app = getApp();
  const m = messages.errors;
</script>

<ScreenFrame title={messages.title} onback={() => app.goto('title')}>
  {#if app.contentStatus === 'error'}
    <div class="state" role="alert">
      <p>{m.contentLoad}</p>
      <div class="actions">
        <Button variant="primary" onclick={() => void app.ensureContent()}>{messages.retry}</Button>
        <Button onclick={() => app.goto('title')}>{m.toTitle}</Button>
      </div>
    </div>
  {:else}
    <div class="state">
      <Loader label={m.contentLoading} showLabel />
    </div>
  {/if}
</ScreenFrame>

<style>
  .state {
    display: grid;
    gap: var(--space-4);
    justify-items: start;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }
</style>
