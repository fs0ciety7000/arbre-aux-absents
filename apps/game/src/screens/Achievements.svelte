<script lang="ts">
  import { Badge, Icon } from '@arbre/ui';
  import { getApp } from '../lib/game/context';
  import { formatDay } from '../lib/game/format';
  import { messages } from '../messages.fr';
  import ScreenFrame from './ScreenFrame.svelte';

  /** E06 : obtenus, à obtenir, cachés (« ??? »). */
  const app = getApp();
  const m = messages.achievements;
  const content = $derived(app.game?.content ?? app.cases[0]?.content ?? null);
  const list = $derived(content?.achievements ?? []);
  const got = $derived(list.filter((a) => app.profile.achievements[a.id] !== undefined).length);
</script>

<ScreenFrame title={m.title} kicker={content?.meta.title} onback={() => app.closeSecondary()}>
  {#if !content}
    <p class="muted" role="status">{m.none}</p>
  {:else}
    <div class="stack">
      <p class="count num">{m.count(got, list.length)}</p>
      <ul class="grid">
        {#each list as a (a.id)}
          {@const at = app.profile.achievements[a.id]}
          {@const hidden = a.hidden && at === undefined}
          <li class="item" class:got={at !== undefined}>
            <span class="icon" aria-hidden="true"
              ><Icon name={at !== undefined ? 'star' : 'lock'} size="1.5rem" /></span
            >
            <div>
              <h2>{hidden ? m.hidden : a.title}</h2>
              <p class="muted">{hidden ? m.hiddenDesc : a.description}</p>
              {#if at !== undefined}
                <Badge tone="success" iconName="check">{m.obtainedOn(formatDay(at))}</Badge>
              {:else}
                <Badge tone="neutral">{m.locked}</Badge>
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</ScreenFrame>

<style>
  .stack {
    display: grid;
    gap: var(--space-4);
  }
  .count {
    color: var(--text-muted);
  }
  .grid {
    display: grid;
    gap: var(--space-3);
    padding: 0;
    list-style: none;
  }
  .item {
    display: flex;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--surface-1);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-1);
  }
  .item.got .icon {
    color: var(--accent);
  }
  .icon {
    color: var(--text-faint);
  }
  h2 {
    font-size: var(--step-1);
    font-family: var(--font-display);
  }
  .muted {
    color: var(--text-muted);
    margin-block: var(--space-1) var(--space-2);
  }
</style>
