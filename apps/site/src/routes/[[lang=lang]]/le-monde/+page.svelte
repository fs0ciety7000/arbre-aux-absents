<!--
  Le monde v2 (DESIGN §14) : la carte interactive épinglée sur le bureau (seule partie hydratée),
  puis l'histoire tapée sur une feuille de registre, le lexique ostrien en fiches bristol et les
  lieux en fiches distribuées. Révélations au défilement : data-sr / data-play (hooks.server.ts).
-->
<script lang="ts">
  import { IndexCard, Icon, PaperSheet, Tape } from '@arbre/ui';
  import VineDivider from '#lib/components/VineDivider.svelte';
  import Seo from '#lib/components/Seo.svelte';
  import WorldMapExplorer from '#lib/components/WorldMapExplorer.svelte';
  import Rich from '#lib/i18n/Rich.svelte';
  import type { PageProps } from './$types';

  // Page hydratée : les textes arrivent par `data` (une langue), jamais par les catalogues.
  let { data }: PageProps = $props();
  const t = $derived(data.t);
</script>

<Seo title={data.seo.title} description={data.seo.description} path="le-monde/" />

<header class="container page-head world-head">
  <div class="head-copy">
    <p class="kicker">{t.kicker}</p>
    <h1><Rich text={t.title} /></h1>
    <p class="lede">{t.lede}</p>
  </div>
  <img
    class="art-img head-spot mv-rise"
    src={data.spots.lighthouse.src}
    width={data.spots.lighthouse.width}
    height={data.spots.lighthouse.height}
    alt=""
    decoding="async"
  />
</header>

<section class="container map-section" aria-labelledby="carte-title">
  <h2 id="carte-title" class="visually-hidden">{t.mapHeading}</h2>
  <div class="map-pinned">
    <Tape class="tape-a" length="7rem" rotate={-8} />
    <Tape class="tape-b" length="7rem" rotate={6} />
    <WorldMapExplorer places={data.places} title={data.mapTitle} t={data.mapText} />
  </div>
  <p class="map-note">
    <Icon name="compass" size="1.1rem" />
    <span>{t.mapKeys}</span>
  </p>
</section>

<VineDivider vine={data.vine} />

<section class="band" aria-labelledby="histoire-title">
  <div class="container split">
    <div class="section-head" data-sr>
      <p class="kicker">{t.history.kicker}</p>
      <h2 id="histoire-title" class="section-title"><Rich text={t.history.title} /></h2>
      <p class="lede">{t.history.lede}</p>
      <img
        class="art-img side-spot mv-parallax"
        src={data.spots.register.src}
        width={data.spots.register.width}
        height={data.spots.register.height}
        alt=""
        loading="lazy"
        decoding="async"
      />
    </div>
    <div data-sr style:--i="1" style:--reveal-tilt="1.5deg">
      <PaperSheet tone="aged" tilt={-0.5} fastener="pin" as="article" class="register">
        <p class="register-head">{t.history.register}</p>
        <ol class="timeline">
          {#each t.history.events as h (h.date)}
            <li>
              <span class="date num">{h.date}</span>
              <span class="event">{h.text}</span>
            </li>
          {/each}
        </ol>
      </PaperSheet>
    </div>
  </div>
</section>

<VineDivider vine={data.vine} />

<section class="band" aria-labelledby="langues-title">
  <div class="container split">
    <div class="section-head" data-sr>
      <p class="kicker">{t.languages.kicker}</p>
      <h2 id="langues-title" class="section-title"><Rich text={t.languages.title} /></h2>
      <div class="prose">
        {#each t.languages.prose as para, i (i)}
          <p><Rich text={para} /></p>
        {/each}
      </div>
    </div>
    <div class="lexicon-wrap">
      <h3 class="lexicon-title" data-sr>{t.languages.lexiconTitle}</h3>
      <ul class="lexicon">
        {#each t.languages.lexicon as [word, meaning], i (word)}
          <li class="word-card" data-sr style:--i={i % 4} style:--reveal-tilt="{i % 2 ? 4 : -4}deg">
            <IndexCard tilt={[-1.2, 0.8, -0.4, 1.4][i % 4]}>
              <span class="word">{word}</span>
              <span class="visually-hidden"> : </span>
              <span class="meaning">{meaning}</span>
            </IndexCard>
          </li>
        {/each}
      </ul>
      <p class="lexicon-note" data-sr><Rich text={t.languages.lexiconNote} /></p>
    </div>
  </div>
</section>

<VineDivider vine={data.vine} />

<section class="band" aria-labelledby="lieux-title">
  <div class="container">
    <div class="section-head center" data-sr>
      <p class="kicker">{t.places.kicker}</p>
      <h2 id="lieux-title" class="section-title"><Rich text={t.places.title} /></h2>
      <p class="lede">{t.places.lede}</p>
    </div>
    {#if data.places.length}
      <ul class="places">
        {#each data.places as p, i (p.id)}
          <li data-sr style:--i={i % 3} style:--reveal-tilt="{i % 2 ? 5 : -5}deg">
            <IndexCard title={p.name} cote={p.kindLabel} tilt={[-1, 0.6, -0.3, 1.1][i % 4]}>
              <p class="place-desc">{p.description}</p>
            </IndexCard>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="empty">
        <Icon name="map" size="1.1rem" />
        {t.places.empty}
      </p>
    {/if}
  </div>
</section>

<style>
  .world-head {
    grid-template-columns: minmax(0, 1fr) minmax(8rem, 15rem);
    align-items: end;
    gap: var(--space-8);
  }
  .head-copy {
    display: grid;
    justify-items: start;
    gap: var(--space-4);
  }
  .head-spot {
    --i: 2;
  }
  .map-section {
    padding-block-end: var(--space-8);
  }
  .map-pinned {
    position: relative;
  }
  .map-pinned :global(.tape-a),
  .map-pinned :global(.tape-b) {
    position: absolute;
    z-index: 2;
    inset-block-start: calc(var(--space-3) * -1);
  }
  .map-pinned :global(.tape-a) {
    inset-inline-start: var(--space-6);
  }
  .map-pinned :global(.tape-b) {
    inset-inline-end: var(--space-6);
  }
  .map-note {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    margin-block-start: var(--space-5);
    font-family: var(--font-type);
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .map-note :global(svg) {
    flex: none;
    color: var(--fern);
  }
  .split {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    gap: var(--space-12);
    align-items: start;
  }
  .split .section-head {
    margin-block-end: 0;
  }
  .side-spot {
    inline-size: min(16rem, 70%);
    margin-block-start: var(--space-6);
  }
  .register-head {
    margin-block-end: var(--space-4);
    padding-block-end: var(--space-3);
    border-block-end: 2px solid var(--brand);
    font-family: var(--font-label);
    font-size: var(--step--1);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--brand);
  }
  .timeline {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .timeline li {
    display: grid;
    grid-template-columns: 6.5rem minmax(0, 1fr);
    gap: var(--space-4);
    padding-block: var(--space-3);
    border-block-end: var(--border) solid var(--line);
  }
  .timeline li:last-child {
    border-block-end: 0;
  }
  .date {
    font-family: var(--font-type);
    font-weight: var(--weight-bold);
    color: var(--ink-type);
  }
  .event {
    font-family: var(--font-read);
    line-height: var(--leading-read);
  }
  .timeline li:last-child .event {
    font-family: var(--font-hand);
    font-size: var(--step-1);
    color: var(--ink-hand);
  }
  .lexicon-wrap {
    display: grid;
    gap: var(--space-5);
  }
  .lexicon-title {
    font-family: var(--font-label);
    font-size: var(--step-0);
    font-weight: var(--weight-regular);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--brand);
  }
  .lexicon {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
    gap: var(--space-5);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .word-card :global(.index-card) {
    block-size: 100%;
  }
  /* Sur la réglure : l'interligne reste le pas de la fiche (--rule-gap). */
  .word {
    display: block;
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-style: italic;
    font-size: var(--step-1);
    line-height: var(--rule-gap);
    color: var(--ink);
  }
  .meaning {
    display: block;
    font-family: var(--font-type);
    color: var(--ink-muted);
  }
  .lexicon-note {
    font-family: var(--font-read);
    color: var(--text-muted);
  }
  .places {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
    gap: var(--space-8) var(--space-6);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .places li :global(.index-card) {
    block-size: 100%;
  }
  .place-desc {
    font-family: var(--font-read);
    color: var(--ink);
  }
  .empty {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--text-muted);
  }
  @media (max-width: 63.9375rem) {
    .split {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-8);
    }
  }
  @media (max-width: 37.4375rem) {
    .world-head {
      grid-template-columns: minmax(0, 1fr);
    }
    .head-spot {
      inline-size: 9rem;
      grid-row: 1;
    }
    .timeline li {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-1);
    }
  }
</style>
