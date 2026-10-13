<script lang="ts">
  import { getApp } from '../lib/game/context';
  import { messages } from '../messages.fr';
  import CardorMonogram from './brand/CardorMonogram.svelte';
  import CreativeLogo from './brand/CreativeLogo.svelte';
  import InteractiveLogo from './brand/InteractiveLogo.svelte';
  import ScreenFrame from './ScreenFrame.svelte';

  /** E09 : CARDOR Media · CM Interactive · CM Creative Lab (DESIGN §11, monochrome). */
  const app = getApp();
  const m = messages.creditsScreen;
  const content = $derived(app.game?.content ?? app.cases.find((c) => !c.fixture)?.content);
</script>

<ScreenFrame title={m.title} onback={() => app.goto('title')}>
  <div class="stack">
    <ul class="logos">
      <li>
        <CardorMonogram class="logo emblem" />
        <span>{m.publisher}</span>
      </li>
      <li>
        <InteractiveLogo class="logo" />
        <span>{m.edition}</span>
      </li>
      <li>
        <CreativeLogo class="logo" />
        <span>{m.writing}</span>
      </li>
    </ul>
    {#if content?.meta.credits?.length}
      <section aria-labelledby="case-credits">
        <h2 id="case-credits">{m.caseCredits} : {content.meta.title}</h2>
        <ul class="lines">
          {#each content.meta.credits as line, i (i)}<li>{line}</li>{/each}
        </ul>
      </section>
    {/if}
    <p class="muted">{m.fonts}</p>
  </div>
</ScreenFrame>

<style>
  .stack {
    display: grid;
    gap: var(--space-8);
  }
  .logos {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: center;
    gap: var(--space-8);
    padding: 0;
    list-style: none;
  }
  .logos li {
    display: grid;
    justify-items: center;
    gap: var(--space-3);
    padding: var(--space-4);
    color: var(--text-muted);
    font-size: var(--step--1);
    text-align: center;
  }
  .logos :global(.logo) {
    height: var(--space-16);
    width: auto;
  }
  .logos :global(.emblem) {
    height: var(--space-16);
  }
  h2 {
    font-family: var(--font-display);
    font-size: var(--step-1);
    margin-block-end: var(--space-3);
  }
  .lines {
    padding-inline-start: var(--space-5);
  }
  .muted {
    color: var(--text-muted);
  }
</style>
