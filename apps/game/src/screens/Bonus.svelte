<script lang="ts">
  import { Card } from '@arbre/ui';
  import { getApp } from '../lib/game/context';
  import { messages } from '../messages.fr';
  import ScreenFrame from './ScreenFrame.svelte';
  import Spot from '../shell/Spot.svelte';

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
    <div class="empty" role="status">
      <Spot name="lighthouse" size="10rem" />
      <p class="muted">{m.locked}</p>
    </div>
  {:else}
    <div class="stack">
      {#each entries as { c, done } (c.id)}
        <Card variant="index" title={c.meta.title} kicker={m.endingsSeen} deal={0}>
          <ul>
            {#each done?.endings ?? [] as id (id)}
              <li>{c.endings[id]?.title ?? id}</li>
            {/each}
          </ul>
        </Card>
      {/each}
      <Card variant="index" title={m.map} deal={1} tilt={0.6}
        ><p class="muted">{m.mapLocked}</p></Card
      >
      <Card variant="index" title={m.artbook} deal={2} tilt={-0.5}
        ><p class="muted">{m.artbookSoon}</p></Card
      >
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
  .empty {
    display: grid;
    justify-items: center;
    gap: var(--space-3);
    padding-block: var(--space-6);
    text-align: center;
  }
</style>
