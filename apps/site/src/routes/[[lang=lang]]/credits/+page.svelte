<!--
  Crédits v2 : les trois divisions sur des feuilles épinglées (logos monochromes, DESIGN §11),
  les polices présentées dans leur propre dessin, les outils libres à l'étiqueteuse, et
  l'avertissement de fiction tamponné. Prérendu, sans JS.
-->
<script lang="ts">
  import { DymoLabel, PaperSheet, Stamp } from '@arbre/ui';
  import { houseLogos } from '#lib/art/brand';
  import BrandLogo from '#lib/components/BrandLogo.svelte';
  import Seo from '#lib/components/Seo.svelte';
  import { STRINGS } from '#lib/i18n/index';
  import { currentLang } from '#lib/i18n/app';
  import Rich from '#lib/i18n/Rich.svelte';
  import ArtSvg from '#lib/svg/ArtSvg.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const t = $derived(STRINGS[currentLang()]);
  const c = $derived(t.credits);
  const logos = $derived(houseLogos(t.brand));

  /** Chaque police est montrée dans son propre dessin (familles des tokens) ; rôle au catalogue. */
  const FONTS = [
    { name: 'Fraunces', family: 'var(--font-display)' },
    { name: 'Oswald', family: 'var(--font-label)' },
    { name: 'Literata', family: 'var(--font-read)' },
    { name: 'Instrument Sans', family: 'var(--font-ui)' },
    { name: 'Courier Prime', family: 'var(--font-type)' },
    { name: 'Caveat', family: 'var(--font-hand)' },
    { name: 'Atkinson Hyperlegible Next', family: 'var(--font-legible)' },
  ] as const;
  const fonts = $derived(FONTS.map((f) => ({ ...f, role: c.fonts.roles[f.name] })));
  const tilts = [-1, 0.8, -0.5];
</script>

<Seo title={c.seoTitle} description={c.seoDescription} path="credits/" />

<header class="container page-head">
  <p class="kicker">{c.kicker}</p>
  <h1><Rich text={c.title} /></h1>
  <p class="lede"><Rich text={c.lede} /></p>
</header>

<section class="container" aria-labelledby="maison-title">
  <h2 id="maison-title" class="visually-hidden">{c.houseHeading}</h2>
  <div class="emblem-row" data-sr>
    {#if data.emblem?.node}
      <ArtSvg node={data.emblem.node} art={false} label="CARDOR Media" class="emblem logo-mono" />
    {/if}
    <p>{c.house}</p>
  </div>

  <ul class="divisions">
    {#each logos as logo, i (logo.id)}
      <li data-sr style:--i={i} style:--reveal-tilt="{tilts[i]! * 4}deg">
        <PaperSheet tone={i === 1 ? 'new' : 'paper'} tilt={tilts[i]} fastener="pin" as="article">
          <div class="division">
            <BrandLogo {logo} />
            <h3>{logo.name}</h3>
            <ul class="roles">
              {#each c.divisions[logo.id] ?? [] as role (role)}<li>{role}</li>{/each}
            </ul>
          </div>
        </PaperSheet>
      </li>
    {/each}
  </ul>
</section>

<section class="band" aria-labelledby="polices-title">
  <div class="container">
    <div class="section-head" data-sr>
      <p class="kicker">{c.fonts.kicker}</p>
      <h2 id="polices-title" class="section-title"><Rich text={c.fonts.title} /></h2>
      <p class="lede">{c.fonts.lede}</p>
    </div>
    <ul class="fonts">
      {#each fonts as f, i (f.name)}
        <li data-sr style:--i={i % 4}>
          <span class="specimen" style:font-family={f.family}>{f.name}</span>
          <span class="font-role">{f.role}</span>
        </li>
      {/each}
    </ul>
  </div>
</section>

<section class="band tools-band" aria-labelledby="outils-title">
  <div class="container tools">
    <div class="section-head" data-sr>
      <p class="kicker">{c.tools.kicker}</p>
      <h2 id="outils-title" class="section-title"><Rich text={c.tools.title} /></h2>
      <p class="lede">{c.tools.lede}</p>
    </div>
    <ul class="labels" data-sr style:--i="1">
      {#each c.tools.list as tool, i (tool)}<li>
          <DymoLabel text={tool} tilt={i % 2 ? 1.2 : -1} />
        </li>{/each}
    </ul>
  </div>
</section>

<section class="container-narrow notice" aria-labelledby="fiction-title" data-sr>
  <PaperSheet tone="aged" tilt={-0.4} fastener="tape" as="div">
    <div class="notice-body">
      <div>
        <h2 id="fiction-title">{c.notice.title}</h2>
        <p>{c.notice.text}</p>
      </div>
      <Stamp text={c.notice.stamp} tone="danger" size="s" rotate={-10} />
    </div>
  </PaperSheet>
</section>

<style>
  .emblem-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-8);
    padding-block-end: var(--space-10);
  }
  .emblem-row p {
    flex: 1 1 20rem;
    max-inline-size: var(--measure);
    font-family: var(--font-read);
    font-size: var(--step-read);
    line-height: var(--leading-read);
  }
  .emblem-row :global(.emblem) {
    block-size: var(--space-24);
    inline-size: auto;
  }
  .divisions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
    gap: var(--space-10) var(--space-8);
    margin: var(--space-6) 0 0;
    padding: 0;
    list-style: none;
  }
  .divisions > li :global(.sheet-wrap) {
    block-size: 100%;
  }
  .division {
    display: grid;
    align-content: start;
    justify-items: start;
    gap: var(--space-3);
    padding-block-start: var(--space-3);
  }
  .division :global(.brand-logo) {
    block-size: var(--space-12);
    inline-size: auto;
    margin-block-end: var(--space-2);
  }
  .division h3 {
    font-size: var(--step-2);
    color: var(--ink);
  }
  .roles {
    display: grid;
    gap: var(--space-1);
    margin: 0;
    padding-inline-start: var(--space-5);
    font-family: var(--font-read);
    color: var(--ink-muted);
  }
  .roles li::marker {
    color: var(--brand);
  }
  .fonts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
    gap: 0 var(--space-8);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .fonts li {
    display: grid;
    gap: var(--space-1);
    padding-block: var(--space-5);
    border-block-start: var(--border) solid var(--line);
  }
  .specimen {
    font-size: var(--step-3);
    line-height: var(--leading-tight);
    color: var(--text);
  }
  .font-role {
    font-family: var(--font-label);
    font-size: var(--step--1);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .tools {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    gap: var(--space-10);
    align-items: center;
  }
  .tools .section-head {
    margin-block-end: 0;
  }
  .labels {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4) var(--space-5);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .notice {
    padding-block: var(--space-6) var(--space-4);
  }
  .notice-body {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-6);
  }
  .notice-body > div {
    flex: 1 1 18rem;
  }
  .notice h2 {
    margin-block-end: var(--space-2);
    font-size: var(--step-1);
    color: var(--ink);
  }
  .notice p {
    font-family: var(--font-read);
    color: var(--ink-muted);
  }
  @media (max-width: 63.9375rem) {
    .tools {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
