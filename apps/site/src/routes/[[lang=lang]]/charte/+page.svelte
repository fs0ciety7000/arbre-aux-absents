<!--
  Charte graphique v2 « Le dossier vivant » (DESIGN §1–§11), pour la presse et les partenaires :
  le titre du jeu (Wordmark, trois tailles), la palette lue dans les tokens, sept polices, les
  matières du bureau, les icônes encrées, les ornements, le mouvement, l'illustration, les règles
  d'usage et les logos de la maison en couleurs d'origine. Prérendu, sans JS ; les démos de
  mouvement se jouent à l'entrée dans la vue (data-play) et restent immobiles en mouvement réduit.
-->
<script lang="ts">
  import { asset, resolve } from '$app/paths';
  import {
    DymoLabel,
    Folder,
    Icon,
    IndexCard,
    InkReveal,
    Ornament,
    ORNAMENT_NAMES,
    PaperSheet,
    Stamp,
    Tape,
    Wordmark,
    type IconName,
  } from '@arbre/ui';
  import { houseLogos } from '#lib/art/brand';
  import BrandLogo from '#lib/components/BrandLogo.svelte';
  import Seo from '#lib/components/Seo.svelte';
  import { STRINGS } from '#lib/i18n/index';
  import { currentLang, localPath } from '#lib/i18n/app';
  import Rich from '#lib/i18n/Rich.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const lang = $derived(currentLang());
  const t = $derived(STRINGS[lang]);
  const c = $derived(t.charte);
  const logos = $derived(houseLogos(t.brand));

  /** Les sept polices (familles des tokens) ; rôle et spécimen au catalogue. */
  const FONTS = [
    { token: '--font-display', name: 'Fraunces' },
    { token: '--font-label', name: 'Oswald' },
    { token: '--font-read', name: 'Literata' },
    { token: '--font-ui', name: 'Instrument Sans' },
    { token: '--font-type', name: 'Courier Prime' },
    { token: '--font-hand', name: 'Caveat' },
    { token: '--font-legible', name: 'Atkinson Hyperlegible Next' },
  ] as const;
  const fonts = $derived(FONTS.map((f) => ({ ...f, ...c.type.fonts[f.token] })));

  /** Une sélection d'icônes encrées, avec leur lavis. */
  const ICONS: { name: IconName & keyof typeof c.icons.names; wash?: string }[] = [
    { name: 'tree', wash: 'var(--fern)' },
    { name: 'archives', wash: 'var(--kraft)' },
    { name: 'reader' },
    { name: 'catalog', wash: 'var(--kraft)' },
    { name: 'notebook' },
    { name: 'map', wash: 'var(--fern)' },
    { name: 'pinboard' },
    { name: 'faces', wash: 'var(--brand)' },
    { name: 'search' },
    { name: 'stamp', wash: 'var(--established)' },
    { name: 'lamp', wash: 'var(--accent)' },
    { name: 'quill' },
    { name: 'envelope', wash: 'var(--brand)' },
    { name: 'photo' },
    { name: 'compass', wash: 'var(--accent)' },
    { name: 'typewriter' },
    { name: 'fern', wash: 'var(--fern)' },
    { name: 'lock' },
  ];
  const icons = $derived(ICONS.map((ic) => ({ ...ic, label: c.icons.names[ic.name] })));
</script>

<Seo title={c.seoTitle} description={c.seoDescription} path="charte/" />

<header class="container page-head">
  <p class="kicker">{c.kicker}</p>
  <h1><Rich text={c.title} /></h1>
  <p class="lede"><Rich text={c.lede} /></p>
</header>

<!-- ── Le titre du jeu ── -->
<section class="band" aria-labelledby="logo-title">
  <div class="container">
    <div class="section-head" data-sr>
      <p class="kicker">{c.logo.kicker}</p>
      <h2 id="logo-title" class="section-title"><Rich text={c.logo.title} /></h2>
      <p class="lede">{c.logo.lede}</p>
    </div>
    <div class="logo-grid">
      <figure class="logo-card wide" data-sr>
        <div class="logo-stage desk-surface" role="img" aria-label={c.logo.posterLabel}>
          <span class="wm" aria-hidden="true"
            ><Wordmark size="hero" as="span" glow kicker={c.logo.posterKicker} /></span
          >
        </div>
        <figcaption>{c.logo.posterCaption}</figcaption>
      </figure>
      <figure class="logo-card" data-sr style:--i="1">
        <div
          class="logo-stage paper mat-paper"
          data-surface="paper"
          role="img"
          aria-label={c.logo.titleLabel}
        >
          <span class="wm" aria-hidden="true"><Wordmark size="title" as="span" /></span>
        </div>
        <figcaption>{c.logo.titleCaption}</figcaption>
      </figure>
      <figure class="logo-card" data-sr style:--i="2">
        <div class="logo-stage night" role="img" aria-label={c.logo.headerLabel}>
          <span class="wm" aria-hidden="true"><Wordmark size="header" as="span" /></span>
          <img class="favicon" src={asset('favicon.svg')} width="64" height="64" alt="" />
        </div>
        <figcaption>{c.logo.headerCaption}</figcaption>
      </figure>
    </div>
  </div>
</section>

<!-- ── Palette ── -->
<section class="band" aria-labelledby="palette-title">
  <div class="container">
    <div class="section-head" data-sr>
      <p class="kicker">{c.palette.kicker}</p>
      <h2 id="palette-title" class="section-title"><Rich text={c.palette.title} /></h2>
      <p class="lede">{c.palette.lede}</p>
    </div>
    {#each data.palette as group (group.title)}
      <div class="palette-group" data-sr>
        <h3>{group.title}</h3>
        <p class="group-intro">{group.intro}</p>
        <ul class="swatches">
          {#each group.swatches as s (s.token)}
            <li class="swatch">
              <span class="chip" style:background="var({s.token})" aria-hidden="true"></span>
              <span class="sw-name">{s.name}</span>
              <span class="sw-usage">{s.usage}</span>
              <code class="sw-value">{s.token}</code>
              <span class="sw-value num">{s.hex ?? s.value}</span>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </div>
</section>

<!-- ── Typographie ── -->
<section class="band" aria-labelledby="type-title">
  <div class="container">
    <div class="section-head" data-sr>
      <p class="kicker">{c.type.kicker}</p>
      <h2 id="type-title" class="section-title"><Rich text={c.type.title} /></h2>
      <p class="lede">{c.type.lede}</p>
    </div>
    <ul class="fonts">
      {#each fonts as f, i (f.token)}
        <li data-sr style:--i={i % 2}>
          <p class="font-meta"><span class="font-name">{f.name}</span> · {f.role}</p>
          <p
            class="specimen"
            class:display={f.token === '--font-display'}
            class:label={f.token === '--font-label'}
            style:font-family="var({f.token})"
          >
            {f.sample}
          </p>
        </li>
      {/each}
    </ul>
  </div>
</section>

<!-- ── Matières ── -->
<section class="band desk-band" aria-labelledby="mat-title">
  <div class="container">
    <div class="section-head" data-sr>
      <p class="kicker">{c.materials.kicker}</p>
      <h2 id="mat-title" class="section-title"><Rich text={c.materials.title} /></h2>
      <p class="lede">{c.materials.lede}</p>
    </div>
    <ul class="materials">
      <li data-sr>
        <PaperSheet tone="paper" tilt={-1.2} fastener="tape" as="div">
          <p class="mat-sample">{c.materials.sheet}</p>
          <p class="mat-caption">{c.materials.sheetCaption}</p>
        </PaperSheet>
      </li>
      <li data-sr style:--i="1">
        <Folder title={c.materials.folder} cote="ORC 74-118" headingLevel={3}>
          <p class="mat-note">{c.materials.folderNote}</p>
        </Folder>
      </li>
      <li data-sr style:--i="2">
        <IndexCard title={c.materials.card} cote="RG-09" tilt={1.2}>
          <p class="mat-note card-note">{c.materials.cardNote}</p>
        </IndexCard>
      </li>
      <li class="small-mats" data-sr style:--i="3">
        <div class="mat-row">
          <DymoLabel text={c.materials.dymo} tilt={-2} />
          <DymoLabel text={c.materials.dymoRed} tone="red" tilt={1.5} />
        </div>
        <div class="mat-row tape-row">
          <Tape length="9rem" rotate={-6} />
          <span class="mat-cap">{c.materials.tape}</span>
        </div>
        <div class="mat-row">
          <Stamp text={c.materials.stamp} size="m" label={c.materials.stampLabel} />
          <span class="mat-cap">{c.materials.stampCaption}</span>
        </div>
      </li>
    </ul>
  </div>
</section>

<!-- ── Icônes et ornements ── -->
<section class="band" aria-labelledby="icons-title">
  <div class="container">
    <div class="section-head" data-sr>
      <p class="kicker">{c.icons.kicker}</p>
      <h2 id="icons-title" class="section-title"><Rich text={c.icons.title} /></h2>
      <p class="lede">{c.icons.lede}</p>
    </div>
    <ul class="icons">
      {#each icons as ic, i (ic.name)}
        <li data-sr style:--i={i % 6}>
          <Icon name={ic.name} size="2.5rem" wash={ic.wash ?? false} />
          <span>{ic.label}</span>
        </li>
      {/each}
    </ul>
    <h3 class="sub-title" data-sr>{c.icons.ornaments}</h3>
    <ul class="ornaments">
      {#each ORNAMENT_NAMES as name, i (name)}
        <li data-sr style:--i={i % 4}>
          <span class="orn"><Ornament {name} size={name === 'divider' ? '9rem' : '4rem'} /></span>
          <span>{c.icons.ornamentNames[name] ?? name}</span>
        </li>
      {/each}
    </ul>
  </div>
</section>

<!-- ── Mouvement ── -->
<section class="band" aria-labelledby="motion-title">
  <div class="container">
    <div class="section-head" data-sr>
      <p class="kicker">{c.motion.kicker}</p>
      <h2 id="motion-title" class="section-title"><Rich text={c.motion.title} /></h2>
      <p class="lede">{c.motion.lede}</p>
    </div>
    <ul class="motions">
      <li data-play>
        <div class="motion-stage deal-stage">
          {#each [-6, 2, 8] as tilt, i (tilt)}
            <IndexCard cote={c.motion.card(i + 1)} tilt={tilt / 4} deal={i} class="deal-card">
              <span class="deal-line"></span>
            </IndexCard>
          {/each}
        </div>
        <p class="motion-name">{c.motion.deal.name}</p>
        <p class="motion-text">{c.motion.deal.text}</p>
      </li>
      <li data-play>
        <div class="motion-stage ink-stage">
          <InkReveal from="left" blur>
            <span class="ink-word">Velmarche</span>
          </InkReveal>
        </div>
        <p class="motion-name">{c.motion.ink.name}</p>
        <p class="motion-text">{c.motion.ink.text}</p>
      </li>
      <li data-play>
        <div class="motion-stage stamp-stage">
          <Stamp text={c.materials.stamp} size="l" animate label={c.materials.stampLabel} />
        </div>
        <p class="motion-name">{c.motion.stamp.name}</p>
        <p class="motion-text">{c.motion.stamp.text}</p>
      </li>
      <li data-play>
        <div class="motion-stage sway-stage">
          <PaperSheet tone="aged" fastener="pin" sway as="div">
            <span class="deal-line"></span>
            <span class="deal-line short"></span>
          </PaperSheet>
        </div>
        <p class="motion-name">{c.motion.sway.name}</p>
        <p class="motion-text">{c.motion.sway.text}</p>
      </li>
    </ul>
  </div>
</section>

<!-- ── Illustration ── -->
<section class="band" aria-labelledby="illu-title">
  <div class="container split">
    <div class="section-head" data-sr>
      <p class="kicker">{c.illustration.kicker}</p>
      <h2 id="illu-title" class="section-title"><Rich text={c.illustration.title} /></h2>
      <div class="prose">
        <p>{c.illustration.text}</p>
      </div>
    </div>
    <ul class="illus">
      {#each data.spots as spot, i (spot.src)}
        <li data-sr style:--i={i} style:--reveal-tilt="{i % 2 ? 4 : -4}deg">
          <PaperSheet tone="paper" tilt={[-1.4, 0.8, -0.4][i]} fastener={i === 1 ? 'pin' : 'tape'}>
            <img
              class="art-img"
              src={spot.src}
              width={spot.width}
              height={spot.height}
              alt=""
              loading="lazy"
              decoding="async"
            />
          </PaperSheet>
        </li>
      {/each}
    </ul>
  </div>
</section>

<!-- ── Usage ── -->
<section class="band" aria-labelledby="usage-title">
  <div class="container">
    <div class="section-head" data-sr>
      <p class="kicker">{c.usage.kicker}</p>
      <h2 id="usage-title" class="section-title"><Rich text={c.usage.title} /></h2>
    </div>
    <div class="do-dont">
      <div data-sr>
        <PaperSheet tone="new" tilt={-0.6} fastener="clip" as="div">
          <h3 class="do-title"><Icon name="check" /> {c.usage.do}</h3>
          <ul class="rules">
            {#each c.usage.dos as d (d)}<li>{d}</li>{/each}
          </ul>
        </PaperSheet>
      </div>
      <div data-sr style:--i="1">
        <PaperSheet tone="aged" tilt={0.6} fastener="clip" as="div">
          <h3 class="dont-title"><Icon name="close" /> {c.usage.dont}</h3>
          <ul class="rules">
            {#each c.usage.donts as d (d)}<li>{d}</li>{/each}
          </ul>
        </PaperSheet>
      </div>
    </div>
  </div>
</section>

<!-- ── Logos de la maison ── -->
<section class="band" aria-labelledby="partners-title">
  <div class="container">
    <div class="section-head" data-sr>
      <p class="kicker">{c.partners.kicker}</p>
      <h2 id="partners-title" class="section-title"><Rich text={c.partners.title} /></h2>
      <p class="lede">{c.partners.lede}</p>
    </div>
    <ul class="partners">
      {#each logos as logo, i (logo.id)}
        <li data-sr style:--i={i}>
          <BrandLogo {logo} mono={false} />
          <span class="partner-name">{logo.name}</span>
          <span class="partner-role">{logo.role}</span>
        </li>
      {/each}
    </ul>
  </div>
</section>

<!-- ── Ressources ── -->
<section class="band" aria-labelledby="dl-title">
  <div class="container dl-grid">
    <div class="section-head" data-sr>
      <p class="kicker">{c.downloads.kicker}</p>
      <h2 id="dl-title" class="section-title"><Rich text={c.downloads.title} /></h2>
      <img
        class="art-img seal"
        src={data.seal.src}
        width={data.seal.width}
        height={data.seal.height}
        alt=""
        loading="lazy"
        decoding="async"
      />
    </div>
    <ul class="downloads" data-sr style:--i="1">
      {#each logos as l (l.id)}
        <li>
          <!-- Fichiers servis depuis apps/site/static/brand/ (copie de static/brand/). -->
          <a href={asset(`brand/${l.id}.svg`)} download
            ><Icon name="save" /> {c.downloads.logo(l.name)}</a
          >
          <span class="dl-detail">{c.downloads.logoDetail}</span>
        </li>
      {/each}
      <li>
        <a href={resolve(localPath(lang, 'presse/', 'kit-logos'))}
          ><Icon name="save" /> {c.downloads.titleEmblem}</a
        >
        <span class="dl-detail">{c.downloads.titleEmblemDetail}</span>
      </li>
      <li>
        <a href={resolve(localPath(lang, 'presse/', 'kit-affiches'))}
          ><Icon name="save" /> {c.downloads.posters}</a
        >
        <span class="dl-detail">{c.downloads.postersDetail}</span>
      </li>
      <li>
        <a href={resolve(localPath(lang, 'presse/', 'kit-documents'))}
          ><Icon name="save" /> {c.downloads.documents}</a
        >
        <span class="dl-detail">{c.downloads.documentsDetail}</span>
      </li>
      <li>
        <a href={resolve(localPath(lang, 'presse/', 'captures'))}
          ><Icon name="save" /> {c.downloads.captures}</a
        >
        <span class="dl-detail">{c.downloads.capturesDetail}</span>
      </li>
    </ul>
  </div>
</section>

<style>
  .split {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    gap: var(--space-12);
    align-items: start;
  }
  .split .section-head,
  .dl-grid .section-head {
    margin-block-end: 0;
  }

  /* Titre du jeu */
  .logo-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-8);
  }
  .logo-card {
    display: grid;
    gap: var(--space-3);
    margin: 0;
  }
  .logo-card.wide {
    grid-column: 1 / -1;
  }
  .logo-stage {
    position: relative;
    display: grid;
    place-items: center;
    gap: var(--space-6);
    min-block-size: 14rem;
    padding: var(--space-12) var(--space-8);
    border-radius: var(--radius-m);
    overflow: hidden;
  }
  .logo-stage.desk-surface {
    min-block-size: 22rem;
    border: var(--border) solid var(--line);
  }
  .logo-stage.night {
    grid-auto-flow: column;
    background: var(--surface-1);
    border: var(--border) solid var(--line);
  }
  .logo-stage.paper {
    box-shadow: var(--shadow-paper);
  }
  .favicon {
    inline-size: 4rem;
    block-size: 4rem;
  }
  .logo-card figcaption {
    font-family: var(--font-type);
    font-size: var(--step--1);
    color: var(--text-muted);
  }

  /* Palette */
  .palette-group h3,
  .sub-title {
    font-size: var(--step-2);
  }
  .palette-group + .palette-group {
    margin-block-start: var(--space-12);
  }
  .group-intro {
    margin-block: var(--space-2) var(--space-5);
    color: var(--text-muted);
  }
  .swatches {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(10.5rem, 1fr));
    gap: var(--space-5);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .swatch {
    display: grid;
    gap: var(--space-1);
    font-size: var(--step--1);
  }
  .chip {
    display: block;
    block-size: 5rem;
    margin-block-end: var(--space-2);
    border-radius: var(--radius-m);
    box-shadow:
      inset 0 0 0 var(--border) var(--line),
      var(--shadow-1);
  }
  .sw-name {
    font-size: var(--step-0);
    font-weight: var(--weight-semibold);
  }
  .sw-usage {
    color: var(--text-muted);
  }
  .sw-value {
    font-family: var(--font-type);
    color: var(--text-muted);
  }

  /* Polices */
  .fonts {
    display: grid;
    gap: var(--space-6);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .fonts li {
    display: grid;
    gap: var(--space-2);
    padding-block-end: var(--space-6);
    border-block-end: var(--border) solid var(--line);
  }
  .font-meta {
    font-family: var(--font-label);
    font-size: var(--step--1);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .font-name {
    color: var(--brand);
  }
  .specimen {
    font-size: var(--step-3);
    line-height: var(--leading-snug);
  }
  .specimen.display {
    font-variation-settings: var(--display-settings);
    font-weight: var(--weight-display-black);
    font-size: var(--step-4);
    line-height: var(--leading-display);
  }
  .specimen.label {
    letter-spacing: var(--tracking-stamp);
  }

  /* Matières */
  .materials {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
    gap: var(--space-10) var(--space-8);
    align-items: start;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .mat-sample {
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-size: var(--step-3);
    color: var(--ink);
  }
  .mat-caption,
  .mat-note {
    font-family: var(--font-read);
    color: var(--ink-muted);
  }
  .mat-note {
    color: var(--text);
  }
  .card-note {
    color: var(--ink-muted);
  }
  .small-mats {
    display: grid;
    gap: var(--space-6);
  }
  .mat-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-4);
  }
  .mat-cap {
    font-family: var(--font-type);
    font-size: var(--step--1);
    color: var(--text-muted);
  }

  /* Icônes et ornements */
  .icons {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
    gap: var(--space-6) var(--space-4);
    margin: 0 0 var(--space-16);
    padding: 0;
    list-style: none;
  }
  .icons li,
  .ornaments li {
    display: grid;
    justify-items: center;
    gap: var(--space-2);
    font-family: var(--font-label);
    font-size: var(--step--1);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .icons :global(svg) {
    color: var(--text);
  }
  .sub-title {
    margin-block-end: var(--space-6);
  }
  .ornaments {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
    gap: var(--space-8) var(--space-6);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .orn {
    display: grid;
    place-items: center;
    min-block-size: 5rem;
    color: var(--fern);
  }

  /* Mouvement */
  .motions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    gap: var(--space-8);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .motion-stage {
    display: grid;
    place-items: center;
    block-size: 12rem;
    margin-block-end: var(--space-4);
    padding: var(--space-6);
    border-radius: var(--radius-m);
    background: var(--surface-1);
    border: var(--border) solid var(--line);
    overflow: hidden;
  }
  .deal-stage {
    grid-template-areas: 'stack';
  }
  .deal-stage :global(.deal-card) {
    grid-area: stack;
    inline-size: 9rem;
    block-size: 6rem;
  }
  .deal-stage :global(.deal-card:nth-child(1)) {
    translate: -2.5rem 0.75rem;
  }
  .deal-stage :global(.deal-card:nth-child(3)) {
    translate: 2.5rem -0.75rem;
  }
  .deal-line {
    display: block;
    inline-size: 80%;
    block-size: 0.35rem;
    margin-block: var(--space-3);
    border-radius: var(--radius-pill);
    background: var(--ink-faint);
  }
  .deal-line.short {
    inline-size: 50%;
  }
  .ink-word {
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-style: italic;
    font-size: var(--step-4);
    color: var(--brand);
  }
  .sway-stage :global(.sheet-wrap) {
    inline-size: 9rem;
  }
  .motion-name {
    font-family: var(--font-label);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--brand);
  }
  .motion-text {
    color: var(--text-muted);
  }

  /* Illustration */
  .illus {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-6);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* Usage */
  .do-dont {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-10);
  }
  .do-title,
  .dont-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--step-2);
  }
  .do-title {
    color: var(--success);
  }
  .dont-title {
    color: var(--danger);
  }
  .rules {
    display: grid;
    gap: var(--space-2);
    margin-block-start: var(--space-4);
    padding-inline-start: var(--space-5);
    font-family: var(--font-read);
    color: var(--ink);
  }

  /* Logos */
  .partners {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--space-8);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .partners li {
    display: grid;
    justify-items: start;
    gap: var(--space-2);
    padding: var(--space-6);
    border-radius: var(--radius-m);
    background: var(--surface-1);
  }
  .partners :global(.brand-logo) {
    block-size: var(--space-16);
    inline-size: auto;
    margin-block-end: var(--space-2);
  }
  .partner-name {
    font-family: var(--font-label);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
  }
  .partner-role {
    color: var(--text-muted);
    font-size: var(--step--1);
  }

  /* Ressources */
  .dl-grid {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    gap: var(--space-12);
    align-items: start;
  }
  .seal {
    inline-size: min(10rem, 50%);
    margin-block-start: var(--space-6);
  }
  .downloads {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .downloads li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-4);
    min-block-size: var(--hit-row);
    border-block-end: var(--border) solid var(--line);
  }
  .downloads a {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-block-size: var(--hit);
    font-weight: var(--weight-medium);
  }
  .dl-detail {
    color: var(--text-muted);
    font-size: var(--step--1);
  }

  @media (max-width: 63.9375rem) {
    .split,
    .dl-grid,
    .do-dont {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-8);
    }
    .logo-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (max-width: 37.4375rem) {
    .specimen {
      font-size: var(--step-2);
    }
    .specimen.display {
      font-size: var(--step-3);
    }
    .logo-stage {
      padding: var(--space-8) var(--space-4);
    }
    .illus {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
