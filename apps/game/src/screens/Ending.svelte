<script lang="ts">
  import { Button, Dialog } from '@arbre/ui';
  import { getApp } from '../lib/game/context';
  import { formatClock } from '../lib/game/format';
  import { messages } from '../messages.fr';
  import Blocks from './ending/Blocks.svelte';
  import Report from './ending/Report.svelte';
  import { visibleSections } from '../lib/game/report';

  /** P15 Dénouement (et P16 Résultats chrono en mode chronométré). */
  const app = getApp();
  const m = messages.ending;
  const game = $derived(app.game);
  const ending = $derived(game && app.ending ? game.content.endings[app.ending] : null);
  const timed = $derived(game?.state.mode === 'timed');
  const best = $derived(game ? app.profile.completed[game.content.id]?.bestTimedMs : undefined);
  const sections = $derived(
    game && app.ending ? visibleSections(app.ending, game.state, game.content) : [],
  );
  let resultsOpen = $state(false);

  async function toTitle() {
    resultsOpen = false;
    await app.saveAndQuit();
  }
</script>

{#if game && app.ending === null}
  <Report {game} />
{:else}
  <main id="contenu" class="ending" tabindex="-1">
    <article class="sheet grain" data-surface="paper" aria-labelledby="ending-title">
      <p class="kicker caps">{m.kicker}</p>
      <h1 id="ending-title">{ending?.title ?? messages.announce.endingReached}</h1>
      <div class="reading">
        {#each sections as section, i (i)}
          <section class="section">
            {#if section.title}<h2>{section.title}</h2>{/if}
            <Blocks blocks={section.body} />
          </section>
        {/each}
      </div>
    </article>
    <div class="actions">
      {#if timed}
        <Button variant="primary" iconName="clock" onclick={() => (resultsOpen = true)}
          >{m.timedResults}</Button
        >
      {/if}
      <Button
        variant={timed ? 'secondary' : 'primary'}
        iconName="forward"
        onclick={() => app.resumeAfterEnding()}>{m.continueInvestigation}</Button
      >
      <Button iconName="back" onclick={toTitle}>{m.toTitle}</Button>
    </div>
  </main>
{/if}

{#if game && timed}
  <Dialog bind:open={resultsOpen} title={messages.timed.title} size="s">
    <dl class="results">
      <div>
        <dt>{messages.timed.total}</dt>
        <dd class="num">{formatClock(game.state.elapsedMs)}</dd>
      </div>
      {#if best !== undefined}
        <div>
          <dt>{messages.timed.best}</dt>
          <dd class="num">{formatClock(best)}</dd>
        </div>
      {/if}
    </dl>
    {#if best !== undefined && best === game.state.elapsedMs}
      <p class="new">{messages.timed.newBest}</p>
    {/if}
    <h3>{messages.timed.splits}</h3>
    {#if game.splits.length === 0}
      <p class="muted">{messages.timed.noSplits}</p>
    {:else}
      <ol class="splits">
        {#each game.splits as s, i (i)}
          <li>
            <span>{messages.timed.split(i + 1, s.count)}</span>
            <span class="num">{formatClock(s.elapsedMs)}</span>
          </li>
        {/each}
      </ol>
    {/if}
    {#snippet actions()}
      <Button variant="primary" onclick={toTitle}>{messages.timed.toTitle}</Button>
    {/snippet}
  </Dialog>
{/if}

<style>
  .ending {
    display: grid;
    justify-items: center;
    align-content: start;
    gap: var(--space-6);
    min-height: 100dvh;
    padding: var(--space-8) var(--gutter);
    padding-block: max(var(--space-8), env(safe-area-inset-top))
      max(var(--space-8), env(safe-area-inset-bottom));
    overflow-y: auto;
    outline: none;
  }
  .sheet {
    width: 100%;
    max-width: var(--container-narrow);
    padding: var(--space-8) var(--space-6);
    background: var(--canvas);
    color: var(--text);
    border-radius: var(--radius-paper);
    box-shadow: var(--shadow-paper);
    animation: settle var(--dur-open) var(--ease-paper) both;
  }
  .kicker {
    color: var(--text-muted);
    font-size: var(--step--1);
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
  }
  h1 {
    font-family: var(--font-display);
    font-size: var(--step-3);
    margin-block: var(--space-2) var(--space-5);
    text-wrap: balance;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-3);
  }
  .results > div,
  .splits li {
    display: flex;
    justify-content: space-between;
    gap: var(--space-4);
    min-height: var(--hit);
    align-items: center;
  }
  .section + .section {
    margin-block-start: var(--space-6);
  }
  .section h2 {
    font-family: var(--font-display);
    font-size: var(--step-2);
    margin-block-end: var(--space-3);
  }
  h3 {
    margin-block: var(--space-4) var(--space-2);
    font-size: var(--step-0);
  }
  .new {
    color: var(--success);
  }
  .muted {
    color: var(--text-muted);
  }
  .splits {
    padding: 0;
    list-style: none;
  }
  @keyframes settle {
    from {
      opacity: 0;
      transform: translateY(var(--rise)) scale(0.985);
    }
  }
</style>
