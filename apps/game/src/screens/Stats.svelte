<script lang="ts">
  import { progress } from '@arbre/engine';
  import { getApp } from '../lib/game/context';
  import { formatClock, formatDuration } from '../lib/game/format';
  import { messages } from '../messages.fr';
  import ScreenFrame from './ScreenFrame.svelte';

  /** E07 : partie en cours et globales. Présentation neutre, jamais comparative. */
  const app = getApp();
  const m = messages.stats;

  const current = $derived.by(() => {
    const g = app.game;
    if (!g) return null;
    const s = g.state;
    const c = g.content;
    const p = progress(s, c);
    const empty = s.searchLog.filter((q) => q.keyword === null).length;
    return [
      [m.playTime, formatDuration(s.elapsedMs)],
      [m.documents, m.of(Object.keys(s.read).length, Object.keys(c.documents).length)],
      [m.keywords, String(s.searched.length)],
      [m.queries, `${s.searchLog.length} (${m.emptyQueries} ${empty})`],
      [m.places, String(s.visited.length)],
      [m.slots, m.of(p.locked, p.total)],
      [m.secrets, m.of(p.secrets, c.progression.secrets.length)],
      [m.hints, String(Object.keys(s.hintsUsed).length)],
    ] as const;
  });

  const global = $derived.by(() => {
    const completed = Object.values(app.profile.completed);
    const endings = completed.reduce((n, c) => n + c.endings.length, 0);
    const best = completed
      .map((c) => c.bestTimedMs)
      .filter((v): v is number => v !== undefined)
      .sort((a, b) => a - b)[0];
    return [
      [m.endings, String(endings)],
      [m.bestTime, best !== undefined ? formatClock(best) : m.none],
      [m.achievements, String(Object.keys(app.profile.achievements).length)],
    ] as const;
  });
</script>

<ScreenFrame title={m.title} onback={() => app.closeSecondary()} surface="paper">
  <div class="stack">
    <section aria-labelledby="stats-current">
      <h2 id="stats-current">{m.current}</h2>
      {#if current}
        <dl>
          {#each current as [label, value] (label)}
            <div>
              <dt>{label}</dt>
              <dd class="num">{value}</dd>
            </div>
          {/each}
        </dl>
      {:else}
        <p class="muted">{m.noGame}</p>
      {/if}
    </section>
    <section aria-labelledby="stats-global">
      <h2 id="stats-global">{m.global}</h2>
      <dl>
        {#each global as [label, value] (label)}
          <div>
            <dt>{label}</dt>
            <dd class="num">{value}</dd>
          </div>
        {/each}
      </dl>
    </section>
  </div>
</ScreenFrame>

<style>
  .stack {
    display: grid;
    gap: var(--space-8);
  }
  h2 {
    margin-block: 0 var(--space-3);
    font-family: var(--font-label);
    font-weight: var(--weight-medium);
    font-size: var(--step-0);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--accent-strong);
  }
  dl {
    display: grid;
    gap: 0;
  }
  dl > div {
    display: flex;
    justify-content: space-between;
    gap: var(--space-4);
    min-height: var(--hit-row);
    align-items: baseline;
    padding-block-start: var(--space-2);
    border-block-end: 1px dotted var(--line-strong);
  }
  dt {
    color: var(--text-muted);
  }
  dd {
    margin: 0;
    font-family: var(--font-type);
    font-weight: var(--weight-bold);
  }
  .muted {
    color: var(--text-muted);
  }
</style>
