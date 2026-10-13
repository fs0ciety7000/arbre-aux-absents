<!--
  Panneau chargé à la demande (fichier JS à part) : la Carte et ses couches SVG ne pèsent pas
  sur le premier affichage. États : chargement, erreur (réessayer), panneau.
-->
<script lang="ts">
  import { Button, Loader, Panel } from '@arbre/ui';
  import type { Component } from 'svelte';
  import { messages } from '../messages.fr';

  interface Props {
    title: string;
    load: () => Promise<{ default: Component }>;
  }
  let { title, load }: Props = $props();

  let Loaded = $state<Component | null>(null);
  let failed = $state(false);

  function run() {
    failed = false;
    load().then(
      (m) => (Loaded = m.default),
      (err: unknown) => {
        console.error('[panneau]', err);
        failed = true;
      },
    );
  }
  run();
</script>

{#if Loaded}
  <Loaded />
{:else}
  <Panel {title}>
    {#if failed}
      <div class="state" role="alert">
        <p>{messages.errors.panelLoad}</p>
        <Button onclick={run}>{messages.retry}</Button>
      </div>
    {:else}
      <div class="state"><Loader label={messages.loading} showLabel /></div>
    {/if}
  </Panel>
{/if}

<style>
  .state {
    display: grid;
    justify-items: start;
    gap: var(--space-3);
    padding: var(--space-4);
  }
</style>
