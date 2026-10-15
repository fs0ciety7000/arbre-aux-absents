<!--
  Presse v2 : la fiche technique tapée sur une fiche bristol, le pitch en grand titre d'affiche,
  la présentation sur une feuille, le contact dans une chemise kraft, puis le kit presse à
  télécharger (généré par `npm run presskit`, manifeste lu au prérendu). Prérendu, sans JS.
-->
<script lang="ts">
  import { asset } from '$app/paths';
  import { Button, Folder, Icon, IndexCard, Ornament, PaperSheet, Stamp } from '@arbre/ui';
  import Seo from '#lib/components/Seo.svelte';
  import { PRESS_FACTS } from '#lib/content/press';
  import { presskit, type KitRow } from '#lib/content/presskit';
  import { STRINGS } from '#lib/i18n/index';
  import { currentLang, localHref } from '#lib/i18n/app';
  import Rich from '#lib/i18n/Rich.svelte';
  import { ITCH_URL } from '#lib/site';
  import type { AssetPath } from '$app/types';

  const lang = $derived(currentLang());
  const t = $derived(STRINGS[lang]);
  const p = $derived(t.presse);
  /** Fiche technique : celle du kit presse (press.ts) en français, traduite ailleurs. */
  const facts = $derived(p.facts ?? PRESS_FACTS);
  const kit = $derived(presskit(t.presskit));

  const tilts = [-1.2, 0.8, -0.5, 1, -0.7];
</script>

{#snippet rowList(rows: KitRow[], label: string)}
  <ul class="files" aria-label={label}>
    {#each rows as row (row.label)}
      <li class="file">
        <span class="file-label">{row.label}</span>
        <span class="file-links">
          {#each row.links as l (l.href)}
            <a class="file-link" href={asset(l.href as AssetPath)} download>
              <span class="fmt">{l.format}</span>
              <span class="file-detail">{l.detail}</span>
              <span class="file-size num">{l.size}</span>
            </a>
          {/each}
        </span>
      </li>
    {/each}
  </ul>
{/snippet}

<Seo title={p.seoTitle} description={p.seoDescription} path="presse/" />

<header class="container page-head">
  <p class="kicker">{p.kicker}</p>
  <h1><Rich text={p.title} /></h1>
  <p class="lede"><Rich text={p.lede} /></p>
</header>

<section class="container pitch-block" aria-labelledby="court-title" data-sr>
  <h2 id="court-title" class="kicker">{p.oneLine}</h2>
  <p class="pitch"><Rich text={p.pitch} /></p>
  <span class="pitch-fern" aria-hidden="true"><Ornament name="fern" size="8rem" /></span>
</section>

<section class="band" aria-label={p.factsLabel}>
  <div class="container layout">
    <div class="fiche" data-sr style:--reveal-tilt="-3deg">
      <IndexCard title={p.factSheet} cote="ORC 74 · PR" tilt={-0.8} headingLevel={2}>
        <dl>
          {#each facts as f (f.term)}
            <div class="row">
              <dt>{f.term}</dt>
              <dd>{f.value}</dd>
            </div>
          {/each}
          <div class="row">
            <dt>{p.download}</dt>
            <dd><a href={ITCH_URL} rel="external">cardorinteractive.itch.io</a></dd>
          </div>
        </dl>
      </IndexCard>
    </div>

    <div class="texts">
      <div data-sr style:--i="1" style:--reveal-tilt="2deg">
        <PaperSheet tone="paper" tilt={0.5} fastener="clip" as="section" class="presentation">
          <h2 id="long-title" class="sheet-title">{p.presentation}</h2>
          <div class="prose">
            {#each p.long as para, i (i)}
              <p><Rich text={para} /></p>
            {/each}
          </div>
        </PaperSheet>
      </div>

      <div data-sr style:--i="2">
        <Folder title={p.contact} cote="ORC 74 · CONTACT" tone="manila" headingLevel={2}>
          <div class="contact">
            <p>{p.contactText}</p>
            <Stamp text={p.contactStamp} tone="ink" size="s" rotate={-8} />
          </div>
        </Folder>
      </div>

      <div class="kit" data-sr style:--i="3">
        <Button variant="secondary" href="#kit-title" iconName="save">{p.kitButton}</Button>
        <Button variant="ghost" href={localHref(lang, 'charte/')} iconName="photo"
          >{p.charteButton}</Button
        >
      </div>
    </div>
  </div>
</section>

<!-- ── Kit presse ── -->
<section class="band kit-band" aria-labelledby="kit-title">
  <div class="container">
    <div class="section-head" data-sr>
      <p class="kicker">{p.kit.kicker}</p>
      <h2 id="kit-title" class="section-title"><Rich text={p.kit.title} /></h2>
      <p class="lede kit-lede"><Rich text={p.kit.lede} /></p>
      {#if p.kit.filesNote}
        <p class="kit-files-note">{p.kit.filesNote}</p>
      {/if}
      {#if kit.zip}
        <div class="zip">
          <Button variant="primary" size="l" href={asset(kit.zip.href as AssetPath)} iconName="save"
            >{p.kit.all} <span class="zip-meta">{p.kit.zip(kit.zip.size)}</span></Button
          >
          <span class="zip-note">{kit.zip.label}</span>
        </div>
      {/if}
    </div>

    <ul class="features">
      {#each kit.features as f, i (f.href)}
        <li data-sr style:--i={i % 5} style:--reveal-tilt="{tilts[i % 5]! * 2}deg">
          <a
            class="feature"
            href={asset(f.href as AssetPath)}
            download
            style:--tilt="{tilts[i % 5]}deg"
          >
            <img
              class="feature-img"
              src={asset(f.preview as AssetPath)}
              width={f.width}
              height={f.height}
              alt=""
              loading="lazy"
              decoding="async"
            />
            <span class="feature-label">{f.label}</span>
            <span class="feature-meta"
              ><Icon name="save" size="1rem" /> PDF · {f.detail} ·
              <span class="num">{f.size}</span></span
            >
          </a>
        </li>
      {/each}
    </ul>

    {#each kit.groups as g (g.id)}
      <div class="group" id="kit-{g.id}" data-sr>
        <h3 class="group-title">{g.title}</h3>
        <p class="group-intro">{g.intro}</p>
        {@render rowList(g.rows, g.title)}
      </div>
    {/each}
    <div class="group" id="captures" data-sr>
      <h3 class="group-title">{p.kit.captures}</h3>
      <p class="group-intro">{p.kit.capturesIntro}</p>
      {@render rowList(kit.captures, p.kit.captures)}
    </div>
  </div>
</section>

<style>
  .pitch-block {
    position: relative;
    display: grid;
    gap: var(--space-4);
    padding-block: var(--space-4) var(--space-8);
  }
  .pitch {
    max-inline-size: 56rem;
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-weight: var(--weight-display);
    font-size: var(--step-3);
    line-height: var(--leading-snug);
    text-wrap: pretty;
  }
  .pitch :global(em) {
    font-style: italic;
    color: var(--brand);
  }
  .pitch-fern {
    color: var(--fern);
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    gap: var(--space-12);
    align-items: start;
  }
  dl {
    margin: 0;
  }
  .row {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    gap: var(--space-4);
    align-items: baseline;
  }
  /* Sur la réglure de la fiche : chaque ligne tient sur un pas (--rule-gap). */
  dt,
  dd {
    line-height: var(--rule-gap);
  }
  dt {
    font-family: var(--font-label);
    font-size: var(--step--1);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--brand);
  }
  dd {
    margin: 0;
    font-family: var(--font-type);
    color: var(--ink);
  }
  .texts {
    display: grid;
    gap: var(--space-12);
  }
  .sheet-title {
    margin-block-end: var(--space-4);
    font-size: var(--step-3);
  }
  :global(.presentation) .prose {
    color: var(--ink);
  }
  .contact {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-6);
  }
  .contact p {
    flex: 1 1 18rem;
    max-inline-size: var(--measure);
    font-family: var(--font-read);
  }
  .kit {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }
  /* Kit presse */
  .kit-lede {
    max-inline-size: var(--measure);
  }
  .kit-files-note {
    max-inline-size: var(--measure);
    margin-block-start: var(--space-3);
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .zip {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3) var(--space-5);
    margin-block-start: var(--space-4);
  }
  .zip-meta {
    font-weight: var(--weight-regular);
    opacity: 0.8;
  }
  .zip-note {
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .features {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
    gap: var(--space-8) var(--space-6);
    margin-block-end: var(--space-16);
    padding: 0;
    list-style: none;
  }
  .feature {
    display: grid;
    gap: var(--space-2);
    color: var(--text);
    text-decoration: none;
    border-radius: var(--radius-s);
  }
  .feature-img {
    inline-size: 100%;
    block-size: 13rem;
    object-fit: contain;
    object-position: center bottom;
    transform: rotate(var(--tilt, 0deg));
    filter: drop-shadow(0 6px 10px var(--vignette));
    transition: transform var(--dur-fast) var(--ease-paper);
  }
  .feature:hover .feature-img {
    transform: rotate(0deg) translateY(-4px);
  }
  .feature-label {
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-weight: var(--weight-display);
    font-size: var(--step-1);
    line-height: var(--leading-snug);
  }
  .feature:hover .feature-label {
    color: var(--accent);
  }
  .feature-meta {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .group {
    margin-block-start: var(--space-12);
  }
  .group-title {
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-weight: var(--weight-display);
    font-size: var(--step-3);
  }
  .group-intro {
    max-inline-size: var(--measure);
    margin-block: var(--space-2) var(--space-5);
    color: var(--text-muted);
  }
  .files {
    display: grid;
    padding: 0;
    list-style: none;
    border-block-start: 1px solid var(--line);
  }
  .file {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    gap: var(--space-2) var(--space-6);
    align-items: baseline;
    padding-block: var(--space-3);
    border-block-end: 1px solid var(--line);
  }
  .file-label {
    font-family: var(--font-read);
  }
  .file-links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .file-link {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-1) var(--space-2);
    padding: var(--space-1) var(--space-3);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    color: var(--text);
    text-decoration: none;
    font-size: var(--step--1);
  }
  .file-link:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
  .fmt {
    font-family: var(--font-label);
    letter-spacing: var(--tracking-stamp);
    color: var(--accent);
  }
  .file-detail,
  .file-size {
    color: var(--text-muted);
  }
  @media (prefers-reduced-motion: reduce) {
    .feature-img {
      transition: none;
    }
  }
  @media (max-width: 63.9375rem) {
    .file {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (max-width: 63.9375rem) {
    .layout {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (max-width: 37.4375rem) {
    .row {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-1);
    }
  }
</style>
