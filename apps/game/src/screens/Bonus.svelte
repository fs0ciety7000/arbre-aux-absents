<script lang="ts">
  import { Card } from '@arbre/ui';
  import { getApp } from '../lib/game/context';
  import { messages } from '../messages.fr';
  import ScreenFrame from './ScreenFrame.svelte';

  /** E08 : fins vues, carte complète (épilogue), galerie, artbook léger. */
  const app = getApp();
  const m = messages.bonus;
  const entries = $derived(
    app.cases
      .map((c) => ({ c: c.content, done: app.profile.completed[c.content.id] }))
      .filter((x) => x.done && x.done.endings.length > 0),
  );
</script>

<ScreenFrame title={m.title} onback={() => app.goto('title')}>
  {#if entries.length === 0}
    <p class="muted" role="status">{m.locked}</p>
  {:else}
    <div class="stack">
      {#each entries as { c, done } (c.id)}
        <Card title={c.meta.title} kicker={m.endingsSeen}>
          <ul>
            {#each done?.endings ?? [] as id (id)}
              <li>{c.endings[id]?.title ?? id}</li>
            {/each}
          </ul>
        </Card>
      {/each}
      <Card title={m.map}><p class="muted">{m.mapLocked}</p></Card>
      <Card title={m.artbook}><p class="muted">{m.artbookSoon}</p></Card>
    </div>
  {/if}
</ScreenFrame>

<style>
  .stack {
    display: grid;
    gap: var(--space-4);
  }
  .muted {
    color: var(--text-muted);
  }
</style>
