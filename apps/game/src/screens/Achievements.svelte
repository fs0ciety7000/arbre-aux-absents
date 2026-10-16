<script lang="ts">
  import type { CaseAchievements } from '@arbre/contract';
  import { Badge, Button, Icon, Loader } from '@arbre/ui';
  import type { CaseInfo } from '../lib/game/case-folders';
  import { getApp } from '../lib/game/context';
  import { formatDay } from '../lib/game/format';
  import { messages } from '../messages.fr';
  import ScreenFrame from './ScreenFrame.svelte';

  /**
   * E06 : obtenus, à obtenir, cachés (« ??? »), une section par affaire (ordre des affaires) avec
   * son compteur. Les succès sont rangés par id dans le profil (ids préfixés par affaire). Les
   * listes viennent d'un petit fichier par affaire (hors index), chargées à l'ouverture.
   */
  const app = getApp();
  const m = messages.achievements;
  const contents = $derived.by(() => {
    const all: CaseInfo[] = app.cases.map((c) => c.content);
    const g = app.game?.content;
    if (g && !all.some((c) => c.id === g.id)) all.unshift(g);
    return all;
  });
  const single = $derived(contents.length === 1);
  const gotOf = (list: readonly { id: string }[]) =>
    list.filter((a) => app.profile.achievements[a.id] !== undefined).length;

  /** Succès par affaire ; `null` tant que tout n'est pas chargé. */
  let lists = $state.raw<Record<string, CaseAchievements> | null>(null);
  let failed = $state(false);
  let attempt = $state(0);

  $effect(() => {
    void attempt;
    // Relu à chaque changement d'affaires ou de langue (l'index est rechargé avec la langue).
    const ids = contents.map((c) => c.id);
    let live = true;
    failed = false;
    Promise.all(ids.map((id) => app.achievementsOf(id))).then(
      (all) => {
        if (live) lists = Object.fromEntries(ids.map((id, i) => [id, all[i]!]));
      },
      (err: unknown) => {
        console.error('[succès]', err);
        if (live) failed = true;
      },
    );
    return () => {
      live = false;
    };
  });
</script>

<ScreenFrame
  title={m.title}
  kicker={single ? contents[0]?.meta.title : undefined}
  onback={() => app.closeSecondary()}
>
  {#if contents.length === 0}
    <p class="muted" role="status">{m.none}</p>
  {:else if failed}
    <div class="state" role="alert">
      <p>{messages.errors.contentLoad}</p>
      <Button variant="primary" onclick={() => attempt++}>{messages.retry}</Button>
    </div>
  {:else if !lists}
    <div class="state">
      <Loader label={messages.errors.contentLoading} showLabel />
    </div>
  {:else}
    <div class="sections">
      {#each contents as content (content.id)}
        {@const list = lists[content.id] ?? []}
        <section class="stack" aria-labelledby="ach-{content.id}" data-case={content.id}>
          <h2 id="ach-{content.id}" class="case-title" class:visually-hidden={single}>
            {content.meta.title}
          </h2>
          <p class="count num">{m.count(gotOf(list), list.length)}</p>
          {#if list.length === 0}
            <p class="muted">{m.noneForCase}</p>
          {/if}
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
                  <h3>{hidden ? m.hidden : a.title}</h3>
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
        </section>
      {/each}
    </div>
  {/if}
</ScreenFrame>

<style>
  .state {
    display: grid;
    gap: var(--space-4);
    justify-items: center;
    padding-block: var(--space-8);
    text-align: center;
  }
  .sections {
    display: grid;
    gap: var(--space-10);
  }
  .stack {
    display: grid;
    gap: var(--space-4);
  }
  .case-title {
    margin: 0;
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-size: var(--step-2);
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
  h3 {
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
