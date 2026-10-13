<script lang="ts">
  import {
    Button,
    Celebrate,
    Dialog,
    DymoLabel,
    Folder,
    IndexCard,
    KeyArt,
    LampLight,
    PaperSheet,
    Stamp,
    Wordmark,
  } from '@arbre/ui';
  import { onMount } from 'svelte';
  import { getApp } from '../lib/game/context';
  import { loadKeyArt } from '../lib/game/keyart';
  import { formatClock } from '../lib/game/format';
  import { messages } from '../messages.fr';
  import Blocks from './ending/Blocks.svelte';
  import Report from './ending/Report.svelte';
  import { askedQuestions, visibleSections } from '../lib/game/report';

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

  /** Conclusions remises : une fiche par question, tamponnée « Classé » en cascade (§13.7). */
  const filed = $derived(
    game && app.ending
      ? askedQuestions(game.state, game.content).flatMap((q) => {
          const label = q.options.find((o) => o.id === q.answer)?.label;
          return label ? [{ id: q.id, prompt: q.prompt, label }] : [];
        })
      : [],
  );

  /** Art clé en fond, fondu sur les bords (chargé à la demande ; sans lui, le bureau seul). */
  let art = $state<string | null>(null);
  let burst = $state(0);
  onMount(() => {
    let alive = true;
    loadKeyArt().then(
      (svg) => alive && (art = svg),
      () => {},
    );
    burst = 1;
    return () => {
      alive = false;
    };
  });

  async function toTitle() {
    resultsOpen = false;
    await app.saveAndQuit();
  }
</script>

{#if game && app.ending === null}
  <Report {game} />
{:else}
  <main id="contenu" class="ending desk-surface" tabindex="-1">
    {#if art}
      <div class="ending-art" aria-hidden="true">
        <KeyArt svg={art} fade="edges" animate={false} />
      </div>
    {/if}
    <LampLight x={50} y={-10} dust={14} radius="80vmax" />
    <Celebrate key={burst} x={50} y={18} count={36} />
    <header class="head">
      <span aria-hidden="true"><Wordmark size="title" as="span" align="center" animate glow /></span
      >
      <span class="visually-hidden">{messages.title}</span>
      <span class="ending-kicker mv-stamp" style:--i="3"
        ><DymoLabel text={m.kicker} tone="red" tilt={-1.5} /></span
      >
    </header>
    <article class="sheet-wrap" aria-labelledby="ending-title">
      <PaperSheet tone="new" tilt={-0.5} fastener="clip" enter="sheet" index={2}>
        <h1 id="ending-title">{ending?.title ?? messages.announce.endingReached}</h1>
        <div class="reading">
          {#each sections as section, i (i)}
            <section class="section">
              {#if section.title}<h2>{section.title}</h2>{/if}
              <Blocks blocks={section.body} />
            </section>
          {/each}
        </div>
      </PaperSheet>
    </article>
    {#if filed.length > 0}
      <div class="filed">
        <Folder title={messages.report.summary} tone="manila" headingLevel={2} enter>
          <ul class="cards">
            {#each filed as f, i (f.id)}
              <li>
                <IndexCard title={f.prompt} deal={i + 3} tilt={i % 2 ? 0.8 : -0.6}>
                  <p class="answer">{f.label}</p>
                </IndexCard>
                <span class="stamp" aria-hidden="true"
                  ><Stamp
                    text={m.filed}
                    tone="ink"
                    size="s"
                    rotate={-10}
                    animate
                    delay={i + 6}
                  /></span
                >
              </li>
            {/each}
          </ul>
        </Folder>
      </div>
    {/if}
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
    position: relative;
    display: grid;
    justify-items: center;
    align-content: start;
    gap: var(--space-6);
    min-height: 100dvh;
    padding: var(--space-8) var(--gutter);
    padding-block: max(var(--space-8), env(safe-area-inset-top))
      max(var(--space-10), env(safe-area-inset-bottom));
    overflow-x: clip;
    overflow-y: auto;
    outline: none;
  }
  /* L'art clé en bandeau derrière le titre, fondu vers le bureau (masque alpha). */
  .ending-art {
    position: absolute;
    inset: 0 0 auto;
    block-size: min(90dvh, 60vw);
    opacity: 0.6;
    pointer-events: none;
    -webkit-mask-image: linear-gradient(to bottom, #000 35%, transparent);
    mask-image: linear-gradient(to bottom, #000 35%, transparent);
    animation: m-fade-in var(--dur-slow) var(--ease-out) backwards;
  }
  .ending-art :global(.keyart) {
    block-size: 100%;
  }
  .ending-art::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(60% 50% at 50% 30%, var(--scrim-art), transparent);
  }
  .head {
    position: relative;
    display: grid;
    justify-items: center;
    gap: var(--space-3);
    padding-block-start: var(--space-6);
    text-align: center;
  }
  .sheet-wrap,
  .filed {
    position: relative;
    width: 100%;
    max-width: var(--container-narrow);
  }
  h1 {
    margin-block: var(--space-2) var(--space-5);
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-weight: var(--weight-display-black);
    font-size: var(--step-3);
    line-height: var(--leading-display);
    text-wrap: balance;
  }
  .cards {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    gap: var(--space-6) var(--space-5);
  }
  .cards li {
    position: relative;
  }
  .answer {
    margin: 0;
    font-family: var(--font-type);
    font-weight: var(--weight-bold);
  }
  .stamp {
    position: absolute;
    inset-block-end: calc(var(--space-3) * -1);
    inset-inline-end: calc(var(--space-2) * -1);
    pointer-events: none;
  }
  .actions {
    position: relative;
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
    font-variation-settings: var(--display-settings);
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
  @media (forced-colors: active) {
    .ending-art {
      display: none;
    }
  }
</style>
