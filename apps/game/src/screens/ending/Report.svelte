<script lang="ts">
  import {
    Button,
    DecisionCard,
    DecisionGroup,
    Dialog,
    Folder,
    Icon,
    LampLight,
    Ornament,
  } from '@arbre/ui';
  import { getApp } from '../../lib/game/context';
  import { askedQuestions } from '../../lib/game/report';
  import type { GameStoreImpl } from '../../lib/game/store.svelte';
  import { messages } from '../../messages.fr';
  import TutorialLayer from '../../tutorial/TutorialLayer.svelte';

  /**
   * Rapport final : questions posées une à une (groupe radio natif, flèches au clavier,
   * croix à la manette), réponses modifiables jusqu'à la confirmation, puis `finish`.
   * Une question `choice` (décision, AFFAIRE-2 §3.2) est rendue en tampons de décision :
   * fiches côte à côte, option indisponible grisée avec sa raison (`unavailableReason`).
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
  /** Le rapport se conclut par une décision : la confirmation parle de tampon. */
  const decides = $derived(questions.some((x) => x.kind === 'choice'));

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

<main id="contenu" class="report desk-surface" tabindex="-1">
  <LampLight x={50} y={-10} dust={10} radius="70vmax" />
  <header class="head">
    <h1 id="report-title" class="mv-ink">{m.title}</h1>
    <span class="rule" aria-hidden="true"><Ornament name="divider" size="100%" /></span>
    <p class="intro mv-rise" style:--i="1">{m.intro}</p>
  </header>

  <div class="folder-wrap">
    <Folder title={m.kicker} tone="manila" cote={game.content.meta.title} enter>
      <div class="filed" aria-hidden="true">
        {#each questions as x, i (x.id)}
          <span
            class="tick"
            class:done={answers[x.id] !== undefined}
            class:here={i === index}
            style:--i={i}
          >
            {#if answers[x.id] !== undefined}<Icon name="check" size="0.9rem" />{:else}{i + 1}{/if}
          </span>
        {/each}
      </div>
      {#if q}
        <form class="question" onsubmit={(e) => e.preventDefault()}>
          {#key q.id}
            {#if q.kind === 'choice'}
              <div class="choice" data-report-choice>
                <p class="progress num">{m.progress(index + 1, questions.length)}</p>
                <span class="prompt" tabindex="-1" bind:this={heading}>{q.prompt}</span>
                <DecisionGroup legend={q.prompt} legendHidden>
                  {#each options as o, i (o.id)}
                    <DecisionCard
                      name="report-{q.id}"
                      value={o.id}
                      label={o.label}
                      stamp={m.decisionStamp}
                      reason={o.unavailableReason}
                      reasonLabel={m.unavailable}
                      checked={current === o.id}
                      onselect={choose}
                      deal={i}
                    />
                  {/each}
                </DecisionGroup>
                {#if options.some((o) => o.unavailableReason !== undefined)}
                  <!-- Une piste reste ouverte (P3) : retour au dossier, rien n'est perdu. -->
                  <div class="reopen">
                    <Button variant="ghost" iconName="back" onclick={() => app.leaveReport()}
                      >{m.backToFile}</Button
                    >
                  </div>
                {/if}
              </div>
            {:else}
              <fieldset class="card mat-card mv-deal" data-surface="paper">
                <legend>
                  <span class="progress num">{m.progress(index + 1, questions.length)}</span>
                  <span class="prompt" tabindex="-1" bind:this={heading}>{q.prompt}</span>
                </legend>
                {#if options.length === 0}
                  <p class="muted">{m.noOption}</p>
                {/if}
                <div class="options">
                  {#each options as o (o.id)}
                    <label
                      class="option"
                      class:checked={current === o.id}
                      class:disabled={o.unavailableReason !== undefined}
                    >
                      <input
                        type="radio"
                        name="report-{q.id}"
                        value={o.id}
                        checked={current === o.id}
                        disabled={o.unavailableReason !== undefined}
                        aria-describedby={o.unavailableReason
                          ? `report-${q.id}-${o.id}-why`
                          : undefined}
                        onchange={() => choose(o.id)}
                      />
                      <span class="label"
                        >{o.label}{#if o.unavailableReason}<span
                            class="why"
                            id="report-{q.id}-{o.id}-why">{m.unavailable}{o.unavailableReason}</span
                          >{/if}</span
                      >
                      {#if current === o.id}
                        <span class="mark mv-stamp" aria-hidden="true"
                          ><Icon name="check" size="1.1rem" /></span
                        >
                      {/if}
                    </label>
                  {/each}
                </div>
              </fieldset>
            {/if}
          {/key}
          {#if current === undefined}
            <p class="muted" role="status">{m.unanswered}</p>
          {/if}
          <div class="nav">
            <Button iconName="back" disabled={index === 0} onclick={() => go(-1)}
              >{m.previous}</Button
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
    </Folder>
  </div>
  <Button variant="ghost" iconName="back" onclick={() => app.leaveReport()}>{m.later}</Button>
</main>

{#if app.overlay === null}
  <TutorialLayer {app} {game} screen="report" />
{/if}

<Dialog
  bind:open={confirmOpen}
  title={decides ? m.confirmDecisionTitle : m.confirmTitle}
  description={decides ? m.confirmDecisionText : m.confirmText}
  size="s"
>
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
    <Button autofocus onclick={() => (confirmOpen = false)}>{m.cancel}</Button>
    <Button variant="primary" loading={finishing} onclick={finish}>{m.confirm}</Button>
  {/snippet}
</Dialog>

<style>
  .report {
    position: relative;
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
  .head {
    position: relative;
    display: grid;
    justify-items: center;
    gap: var(--space-2);
    max-width: var(--container-narrow);
    text-align: center;
  }
  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-weight: var(--weight-display-black);
    font-size: var(--step-4);
    line-height: var(--leading-display);
    letter-spacing: var(--tracking-display);
    text-wrap: balance;
  }
  .rule {
    display: block;
    width: min(100%, 15rem);
    color: var(--brand);
  }
  .intro {
    margin: 0;
    color: var(--text-muted);
    font-family: var(--font-display);
    font-style: italic;
    font-size: var(--step-1);
  }
  .folder-wrap {
    position: relative;
    width: 100%;
    max-width: var(--container-narrow);
  }
  .muted {
    color: var(--text-muted);
  }
  .choice {
    display: grid;
    gap: var(--space-2);
  }
  .choice .progress {
    margin: 0;
    color: var(--text-muted);
  }
  .reopen {
    justify-self: end;
  }
  .choice .prompt {
    color: var(--text);
  }
  /* Pastilles des questions : cochées quand la réponse est classée. */
  .filed {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-block-end: var(--space-4);
  }
  .tick {
    display: grid;
    place-items: center;
    inline-size: 1.75rem;
    block-size: 1.75rem;
    border: var(--border) dashed var(--line-strong);
    border-radius: 50%;
    font-family: var(--font-type);
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .tick.done {
    border-style: solid;
    border-color: var(--established);
    color: var(--established);
  }
  .tick.here {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .question {
    display: grid;
    gap: var(--space-4);
  }
  /* La question : une fiche bristol réglée (§6.3), distribuée à chaque question. */
  .card {
    --head-h: calc(var(--rule-gap) * 2.4);
    margin: 0;
    padding: 0 var(--space-5) var(--space-4);
    border: 0;
    min-width: 0;
    rotate: -0.4deg;
  }
  legend {
    float: inline-start;
    width: 100%;
    display: grid;
    align-content: end;
    min-height: var(--head-h);
    padding: var(--space-3) 0 var(--space-2);
    margin-block-end: var(--space-1);
  }
  legend + * {
    clear: both;
  }
  .progress {
    display: block;
    color: var(--ink-muted);
    font-family: var(--font-type);
    font-size: var(--step--1);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
  }
  .prompt {
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-size: var(--step-1);
    font-weight: var(--weight-display);
    line-height: 1.2;
    color: var(--ink);
    outline: none;
  }
  .options {
    clear: both;
    display: grid;
  }
  .option {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-height: max(var(--hit-row), calc(var(--rule-gap) * 2));
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-xs);
    font-family: var(--font-type);
    color: var(--ink);
    cursor: pointer;
    transition:
      background-color var(--dur-fast) var(--ease-out),
      transform var(--dur-fast) var(--ease-out);
  }
  .option:hover {
    background: var(--accent-tint);
    transform: translateX(var(--space-1));
  }
  .option.disabled {
    cursor: not-allowed;
    color: var(--ink-muted);
  }
  .option.disabled:hover {
    background: none;
    transform: none;
  }
  .why {
    display: block;
    font-family: var(--font-ui);
    font-size: var(--step--1);
    color: var(--ink);
  }
  .option.checked {
    background: var(--accent-tint);
    font-weight: var(--weight-bold);
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
  .label {
    flex: 1;
  }
  .mark {
    --stamp-rot: -8deg;
    display: grid;
    place-items: center;
    inline-size: 2rem;
    block-size: 2rem;
    border: 2px solid var(--established);
    border-radius: 50%;
    color: var(--established);
    rotate: -8deg;
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
  @media (forced-colors: active) {
    .card {
      border: 1px solid CanvasText;
    }
  }
</style>
