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
        {#each list as a, i (a.id)}
          {@const at = app.profile.achievements[a.id]}
          {@const hidden = a.hidden && at === undefined}
          <li
            class="item mat-card mv-deal mv-liftable"
            class:got={at !== undefined}
            class:hidden
            data-surface="paper"
            style:--i={Math.min(i, 12)}
            style:--tilt="{i % 3 === 0 ? -0.6 : i % 3 === 1 ? 0.5 : -0.2}deg"
          >
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
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr));
    gap: var(--space-5) var(--space-4);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  /* Une fiche bristol par succès (§6.3) : intitulé tapé sur la ligne de tête. */
  .item {
    --head-h: 3.4rem;
    display: flex;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4) var(--space-4);
    transform: rotate(var(--tilt, 0deg));
  }
  .item.hidden {
    opacity: 0.88;
  }
  .item.got .icon {
    color: var(--brand);
  }
  .icon {
    color: var(--ink-faint);
  }
  h2 {
    display: flex;
    align-items: flex-end;
    min-height: calc(var(--head-h) - var(--space-3) - var(--space-1));
    margin: 0 0 var(--space-2);
    font-family: var(--font-type);
    font-size: var(--step-0);
    font-weight: var(--weight-bold);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    line-height: 1.2;
  }
  .muted {
    color: var(--text-muted);
    margin-block: var(--space-1) var(--space-2);
  }
  @media (forced-colors: active) {
    .item {
      border: 1px solid CanvasText;
    }
  }
</style>
