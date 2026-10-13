<script lang="ts">
  import { Button, Dialog } from '@arbre/ui';
  import { getApp } from '../../lib/game/context';
  import { askedQuestions } from '../../lib/game/report';
  import type { GameStoreImpl } from '../../lib/game/store.svelte';
  import { messages } from '../../messages.fr';

  /**
   * Rapport final : questions posées une à une (groupe radio natif, flèches au clavier,
   * croix à la manette), réponses modifiables jusqu'à la confirmation, puis `finish`.
   */
  interface Props {
    game: GameStoreImpl;
  }
  let { game }: Props = $props();
  const app = getApp();
  const m = messages.report;

  let index = $state(0);
  let confirmOpen = $state(false);
  let finishing = $state(false);
  let heading: HTMLElement | undefined = $state();

  const questions = $derived(askedQuestions(game.state, game.content));
  const q = $derived(questions[Math.min(index, questions.length - 1)]);
  const options = $derived(q?.options ?? []);
  const answers = $derived(
    Object.fromEntries(questions.map((x) => [x.id, x.answer ?? undefined])) as Record<
      string,
      string | undefined
    >,
  );
  const current = $derived(q?.answer ?? undefined);
  const last = $derived(index >= questions.length - 1);
  const complete = $derived(questions.every((x) => answers[x.id] !== undefined));

  function choose(option: string) {
    if (!q) return;
    game.dispatch({ type: 'answer', question: q.id, option });
  }

  function go(delta: number) {
    index = Math.max(0, Math.min(questions.length - 1, index + delta));
    queueMicrotask(() => heading?.focus());
  }

  function finish() {
    finishing = true;
    confirmOpen = false;
    game.finishReport();
    finishing = false;
  }

  function labelOf(qid: string, oid: string | undefined) {
    const question = questions.find((x) => x.id === qid);
    return question?.options.find((o) => o.id === oid)?.label ?? '—';
  }
</script>

<main id="contenu" class="report" tabindex="-1">
  <article class="sheet grain" data-surface="paper" aria-labelledby="report-title">
    <p class="kicker caps">{m.kicker}</p>
    <h1 id="report-title">{m.title}</h1>
    <p class="intro">{m.intro}</p>

    {#if q}
      <form class="question" onsubmit={(e) => e.preventDefault()}>
        <fieldset>
          <legend>
            <span class="progress num">{m.progress(index + 1, questions.length)}</span>
            <span class="prompt reading" tabindex="-1" bind:this={heading}>{q.prompt}</span>
          </legend>
          {#if options.length === 0}
            <p class="muted">{m.noOption}</p>
          {/if}
          <div class="options">
            {#each options as o (o.id)}
              <label class="option" class:checked={current === o.id}>
                <input
                  type="radio"
                  name="report-{q.id}"
                  value={o.id}
                  checked={current === o.id}
                  onchange={() => choose(o.id)}
                />
                <span>{o.label}</span>
              </label>
            {/each}
          </div>
        </fieldset>
        {#if current === undefined}
          <p class="muted" role="status">{m.unanswered}</p>
        {/if}
        <div class="nav">
          <Button iconName="back" disabled={index === 0} onclick={() => go(-1)}>{m.previous}</Button
          >
          {#if last}
            <Button
              variant="primary"
              iconName="stamp"
              disabled={!complete}
              onclick={() => (confirmOpen = true)}>{m.submit}</Button
            >
          {:else}
            <Button
              variant="primary"
              iconName="forward"
              disabled={current === undefined}
              onclick={() => go(1)}>{m.next}</Button
            >
          {/if}
        </div>
      </form>
    {/if}
  </article>
  <Button variant="ghost" iconName="back" onclick={() => app.leaveReport()}>{m.later}</Button>
</main>

<Dialog bind:open={confirmOpen} title={m.confirmTitle} description={m.confirmText} size="s">
  <h3 class="summary-title">{m.summary}</h3>
  <dl class="summary">
    {#each questions as x, i (x.id)}
      <div>
        <dt>{x.prompt}</dt>
        <dd>
          {labelOf(x.id, answers[x.id])}
          <Button
            variant="ghost"
            onclick={() => {
              confirmOpen = false;
              index = i;
            }}>{m.change}</Button
          >
        </dd>
      </div>
    {/each}
  </dl>
  {#snippet actions()}
    <Button onclick={() => (confirmOpen = false)}>{m.cancel}</Button>
    <Button variant="primary" loading={finishing} onclick={finish}>{m.confirm}</Button>
  {/snippet}
</Dialog>

<style>
  .report {
    display: grid;
    justify-items: center;
    align-content: start;
    gap: var(--space-5);
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
  }
  .kicker,
  .progress {
    display: block;
    color: var(--text-muted);
    font-size: var(--step--1);
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
  }
  h1 {
    font-family: var(--font-display);
    font-size: var(--step-3);
    margin-block: var(--space-2) var(--space-3);
  }
  .intro,
  .muted {
    color: var(--text-muted);
  }
  .question {
    display: grid;
    gap: var(--space-4);
    margin-block-start: var(--space-6);
  }
  fieldset {
    border: 0;
    padding: 0;
    min-width: 0;
  }
  legend {
    display: grid;
    gap: var(--space-2);
    margin-block-end: var(--space-4);
    padding: 0;
  }
  .prompt {
    font-family: var(--font-display);
    font-size: var(--step-1);
    font-weight: var(--weight-semibold);
    outline: none;
  }
  .options {
    display: grid;
    gap: var(--space-2);
  }
  .option {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-height: var(--hit-row);
    padding: var(--space-2) var(--space-4);
    background: var(--surface-1);
    border: var(--border) solid var(--line-strong);
    border-radius: var(--radius-s);
    cursor: pointer;
  }
  .option:hover {
    background: var(--surface-2);
  }
  .option.checked {
    border: var(--border-strong) solid var(--accent);
    background: var(--accent-tint);
  }
  .option:has(input:focus-visible) {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
  .option input {
    width: var(--space-5);
    height: var(--space-5);
    margin: 0;
    accent-color: var(--accent);
    flex-shrink: 0;
  }
  .option input:focus-visible {
    outline: none;
  }
  .nav {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--space-3);
  }
  .summary-title {
    font-size: var(--step-0);
    margin-block-end: var(--space-2);
  }
  .summary > div {
    padding-block: var(--space-2);
    border-block-end: var(--border) solid var(--line);
  }
  dt {
    color: var(--text-muted);
  }
  dd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }
</style>
