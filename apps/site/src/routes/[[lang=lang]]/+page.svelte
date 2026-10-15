<!--
  Accueil v2 (DESIGN §14) : héros sur l'art clé vivant, puis un récit au défilement — le principe
  (ordre de mission tapé), les gestes du jeu (feuilles épinglées et vignettes d'aquarelle), la
  carte qui s'encre, les visages distribués comme des fiches, les plateformes (chemise kraft) et
  les captures. Prérendu sans hydratation ; le mouvement au défilement est le petit script en
  ligne de hooks.server.ts (data-sr, data-play, data-tilt), sans effet en mouvement réduit.
-->
<script lang="ts">
  import { Button, DymoLabel, Folder, Icon, PaperSheet, Wordmark } from '@arbre/ui';
  import HeroArt from '#lib/components/HeroArt.svelte';
  import MapSheet from '#lib/components/MapSheet.svelte';
  import PortraitPlate from '#lib/components/PortraitPlate.svelte';
  import Seo from '#lib/components/Seo.svelte';
  import VineDivider from '#lib/components/VineDivider.svelte';
  import { STRINGS } from '#lib/i18n/index';
  import { resolve } from '$app/paths';
  import { currentLang, localHref, localPath } from '#lib/i18n/app';
  import Rich from '#lib/i18n/Rich.svelte';
  import {
    ITCH_EMBED,
    ITCH_URL,
    SITE_NAME,
    SITE_URL,
    TRAILER_DURATION,
    TRAILER_EMBED_URL,
    TRAILER_POSTER,
    TRAILER_UPLOAD_DATE,
    TRAILER_WATCH_URL,
  } from '#lib/site';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const lang = $derived(currentLang());
  const t = $derived(STRINGS[lang]);
  const h = $derived(t.home);
  const s = $derived(data.spots);
  /** Version web du jeu (hors SvelteKit) : `?lang=en` sert d'indice de langue (D6). */
  const playHref = $derived(lang === 'fr' ? '/jouer/' : `/jouer/?lang=${lang}`);

  type Fastener = 'tape' | 'pin' | 'clip';
  /** Mise en page des six gestes (textes : catalogue, même ordre). */
  const FEATURE_LAYOUT: { spot: keyof typeof s; tilt: number; fastener: Fastener }[] = [
    { spot: 'tree', tilt: -1.4, fastener: 'tape' },
    { spot: 'archives', tilt: 0.8, fastener: 'pin' },
    { spot: 'map', tilt: -0.6, fastener: 'tape' },
    { spot: 'catalogue', tilt: 1, fastener: 'clip' },
    { spot: 'stamp', tilt: -0.9, fastener: 'tape' },
    { spot: 'magnifier', tilt: 0.6, fastener: 'pin' },
  ];
  const features = $derived(
    FEATURE_LAYOUT.map((f, i) => ({ ...f, ...h.game.features[i]!, spot: s[f.spot] })),
  );

  const platforms = ['Windows', 'macOS', 'Linux', 'Android'];

  const SHOT_LAYOUT: { spot: keyof typeof s; tilt: number }[] = [
    { spot: 'tree', tilt: -1.2 },
    { spot: 'map', tilt: 0.9 },
    { spot: 'letter', tilt: -0.5 },
  ];
  const shots = $derived(
    SHOT_LAYOUT.map((sh, i) => ({ ...sh, spot: s[sh.spot], title: h.shots.items[i]! })),
  );

  /** Bande-annonce : données structurées (VideoObject) et lecteur `og:video`. */
  const trailerLd = $derived({
    '@type': 'VideoObject',
    name: t.meta.trailerTitle,
    description: t.meta.trailerDescription,
    thumbnailUrl: [new URL(TRAILER_POSTER.jpg, SITE_URL).href],
    uploadDate: TRAILER_UPLOAD_DATE,
    duration: TRAILER_DURATION,
    contentUrl: TRAILER_WATCH_URL,
    embedUrl: TRAILER_EMBED_URL,
    // La vidéo elle-même (cartons) est en français, quelle que soit la langue de la page.
    inLanguage: 'fr',
  });
</script>

<Seo
  title={SITE_NAME}
  description={t.meta.description}
  path=""
  video={{
    embedUrl: TRAILER_EMBED_URL,
    width: TRAILER_POSTER.width,
    height: TRAILER_POSTER.height,
  }}
  jsonLd={trailerLd}
/>

<svelte:head>
  <!-- L'art clé est le LCP : demandé dès l'en-tête, avant la lecture du corps de page. -->
  <link
    rel="preload"
    as="image"
    href={data.hero.images.tall.src}
    media="(max-width: 47.4375rem)"
    fetchpriority="high"
  />
  <link
    rel="preload"
    as="image"
    href={data.hero.images.wide.src}
    media="(min-width: 47.5rem)"
    fetchpriority="high"
  />
</svelte:head>

<!-- ── Héros : l'art clé vivant, le titre sur le voile de la zone calme ───────────── -->
<section class="hero" aria-label={h.heroLabel}>
  <HeroArt
    images={data.hero.images}
    live={data.hero.live}
    alt={t.meta.keyArtAlt ?? data.hero.alt}
    class="hero-bg"
  />
  <div class="hero-copy">
    <div>
      <Wordmark size="hero" animate glow kicker={h.kicker} tagline={h.tagline} />
    </div>
    <div class="cta mv-rise" style:--i="7">
      <Button variant="primary" size="l" href={playHref} rel="external" iconName="forward"
        >{h.play}</Button
      >
      <Button variant="secondary" size="l" href={localHref(lang, 'le-monde/')} iconName="map"
        >{h.exploreWorld}</Button
      >
      <Button variant="secondary" size="l" href={localHref(lang, 'artbook/')} iconName="photo"
        >{h.seeArtbook}</Button
      >
    </div>
    <div class="platforms-line mv-rise" style:--i="8">
      <DymoLabel text={h.platformsLine} tilt={-1} />
      <a class="demo-note" href={ITCH_URL} rel="external"
        ><Icon name="save" size="1rem" /> {h.free}</a
      >
    </div>
  </div>
</section>

<VineDivider vine={data.vine} />

<!-- ── Le principe : l'ordre de mission ─────────────────────────────────────────── -->
<section class="band premise" aria-labelledby="principe-title">
  <div class="container premise-grid">
    <div class="section-head" data-sr>
      <p class="kicker">{h.premise.kicker}</p>
      <h2 id="principe-title" class="section-title"><Rich text={h.premise.title} /></h2>
      <p class="lede">{h.premise.lede}</p>
      <img
        class="art-img premise-spot mv-parallax"
        src={s.register.src}
        width={s.register.width}
        height={s.register.height}
        alt=""
        loading="lazy"
        decoding="async"
      />
    </div>
    <div class="letter-wrap" data-sr style:--i="1" style:--reveal-tilt="2deg">
      <PaperSheet tone="new" tilt={0.8} fastener="clip" edge="torn" as="article" class="letter">
        <header class="letter-head">
          <p class="letter-office">{h.premise.office}</p>
          <p class="letter-ref num">{h.premise.ref}</p>
        </header>
        <div class="letter-body">
          {#each h.premise.body as para, i (i)}
            <p>{para}</p>
          {/each}
        </div>
        <p class="letter-sign ink-hand">{h.premise.sign}</p>
      </PaperSheet>
    </div>
  </div>
</section>

<VineDivider vine={data.vine} />

<!-- ── Bande-annonce : façade (affiche locale), lecteur YouTube au clic seulement ── -->
<section class="band" aria-labelledby="bande-annonce-title">
  <div class="container trailer-wrap">
    <div class="section-head center" data-sr>
      <p class="kicker">{h.trailer.kicker}</p>
      <h2 id="bande-annonce-title" class="section-title"><Rich text={h.trailer.title} /></h2>
    </div>
    <div class="trailer" data-sr>
      <a
        class="trailer-facade"
        href={TRAILER_WATCH_URL}
        rel="external"
        data-yt-embed="{TRAILER_EMBED_URL}?autoplay=1&rel=0"
        data-yt-title={t.meta.trailerTitle}
        data-yt-class="trailer-frame"
      >
        <picture>
          <source
            type="image/webp"
            srcset="{TRAILER_POSTER.webp640} 640w, {TRAILER_POSTER.webp1280} 1280w"
            sizes="(max-width: 60rem) 100vw, 60rem"
          />
          <img
            class="trailer-poster"
            src={TRAILER_POSTER.jpg}
            width={TRAILER_POSTER.width}
            height={TRAILER_POSTER.height}
            alt=""
            loading="lazy"
            decoding="async"
          />
        </picture>
        <span class="trailer-play" aria-hidden="true"></span>
        <span class="trailer-label"
          >{h.trailer.play} <span class="num">{h.trailer.duration}</span></span
        >
      </a>
    </div>
    <p class="trailer-note">{h.trailer.note}</p>
  </div>
</section>

<VineDivider vine={data.vine} />

<!-- ── Les gestes : feuilles épinglées ──────────────────────────────────────────── -->
<section id="jeu" class="band" aria-labelledby="jeu-title">
  <div class="container">
    <div class="section-head center" data-sr>
      <p class="kicker">{h.game.kicker}</p>
      <h2 id="jeu-title" class="section-title"><Rich text={h.game.title} /></h2>
    </div>
    <ul class="features">
      {#each features as f, i (f.title)}
        <li data-sr style:--i={i % 3} style:--reveal-tilt="{f.tilt * 2}deg">
          <div class="feature" data-tilt="3">
            <PaperSheet tone="paper" tilt={f.tilt} fastener={f.fastener} as="article">
              <img
                class="art-img feature-spot"
                src={f.spot.src}
                width={f.spot.width}
                height={f.spot.height}
                alt=""
                loading="lazy"
                decoding="async"
              />
              <p class="f-kick">{f.kicker}</p>
              <h3 class="f-title">{f.title}</h3>
              <p class="f-text">{f.text}</p>
            </PaperSheet>
          </div>
        </li>
      {/each}
    </ul>
  </div>
</section>

<VineDivider vine={data.vine} />

<!-- ── La carte qui s'encre ─────────────────────────────────────────────────────── -->
<section class="band" aria-labelledby="carte-title">
  <div class="container map-grid">
    <div class="section-head map-copy" data-sr>
      <p class="kicker">{h.world.kicker}</p>
      <h2 id="carte-title" class="section-title"><Rich text={h.world.title} /></h2>
      <p class="lede">{h.world.lede}</p>
      <Button variant="secondary" href={localHref(lang, 'le-monde/')} iconName="compass"
        >{h.world.open}</Button
      >
    </div>
    <div class="map-wrap">
      <MapSheet map={data.map} label={h.world.mapLabel} fallback={t.common.mapTitle} />
      <p class="map-credit">{h.world.credit}</p>
    </div>
  </div>
</section>

<VineDivider vine={data.vine} />

<!-- ── Les visages : distribués comme des fiches ───────────────────────────────── -->
<section class="band" aria-labelledby="faces-title">
  <div class="container">
    <div class="section-head center" data-sr>
      <p class="kicker">{h.faces.kicker}</p>
      <h2 id="faces-title" class="section-title"><Rich text={h.faces.title} /></h2>
      <p class="lede">{h.faces.lede}</p>
    </div>
    <ul class="plates">
      {#each data.plates as plate, i (plate.plate)}
        <li data-sr style:--i={i} style:--reveal-tilt="{i % 2 ? 6 : -6}deg">
          <PortraitPlate
            {plate}
            tilt={i % 2 ? 1.5 : -1.5}
            cote={t.common.plate(plate.plate)}
            missing={t.common.portraitSoon}
          />
        </li>
      {/each}
    </ul>
    <p class="more">
      <a class="more-link" href={resolve(localPath(lang, 'artbook/'))}
        >{h.faces.more} <Icon name="forward" size="1rem" /></a
      >
    </p>
  </div>
</section>

<!-- ── Plateformes : une chemise kraft ──────────────────────────────────────────── -->
<section class="band" id="plateformes" aria-label={h.platforms.label} tabindex="-1">
  <div class="container folder-wrap" data-sr>
    <Folder
      id="folder-plateformes"
      title={h.platforms.title}
      cote="ORC 74 · DIFFUSION"
      tabAlign="start"
      headingLevel={2}
    >
      <div class="folder-body">
        <p class="folder-lede">
          <Rich text={h.platforms.lede} /><a href={ITCH_URL} rel="external">itch.io</a>{h.platforms
            .ledeEnd}
        </p>
        <ul class="platforms">
          {#each platforms as p, i (p)}
            <li>
              <DymoLabel text={p} tilt={i % 2 ? 1 : -1} />
              <span class="status">{h.platforms.available}</span>
            </li>
          {/each}
          <li class="demo">
            <DymoLabel text={h.platforms.browser} tone="red" tilt={-1.5} />
            <a class="status" href={playHref} rel="external">{h.platforms.playHere}</a>
          </li>
        </ul>
        <iframe
          class="itch-embed"
          src={ITCH_EMBED}
          title={h.platforms.itchTitle}
          width="552"
          height="167"
          loading="lazy"><a href={ITCH_URL} rel="external">{h.platforms.itchTitle}</a></iframe
        >
        <p class="folder-note">{h.platforms.note}</p>
      </div>
    </Folder>
  </div>
</section>

<!-- ── Captures : tirages en attente ───────────────────────────────────────────── -->
<section class="band" aria-labelledby="shots-title">
  <div class="container">
    <div class="section-head center" data-sr>
      <p class="kicker">{h.shots.kicker}</p>
      <h2 id="shots-title" class="section-title"><Rich text={h.shots.title} /></h2>
    </div>
    <ul class="shots">
      {#each shots as shot, i (shot.title)}
        <li data-sr style:--i={i}>
          <PaperSheet tone="new" tilt={shot.tilt} fastener="tape" as="div">
            <figure class="sheet-fig">
              <div class="shot-frame">
                <img
                  class="art-img"
                  src={shot.spot.src}
                  width={shot.spot.width}
                  height={shot.spot.height}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <span class="shot-soon"><Icon name="photo" size="1rem" /> {h.shots.soon}</span>
              </div>
              <figcaption>{shot.title}</figcaption>
            </figure>
          </PaperSheet>
        </li>
      {/each}
    </ul>
  </div>
</section>

<style>
  /* ── Héros ── */
  .hero {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(24rem, 36%);
    min-block-size: min(54rem, 92dvh);
  }
  .hero :global(.hero-bg) {
    position: absolute;
    inset: 0;
  }
  /* Voile de la zone calme (DESIGN §8.5) sous la colonne de texte. */
  .hero::after {
    content: '';
    position: absolute;
    inset: 0 0 0 auto;
    inline-size: 50%;
    background: linear-gradient(to left, var(--scrim-art) 64%, transparent);
    pointer-events: none;
  }
  .hero-copy {
    grid-column: 2;
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--space-6);
    padding: calc(var(--site-header-h) + var(--space-12)) var(--gutter) var(--space-12) 0;
  }
  .cta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }
  .platforms-line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3) var(--space-4);
  }
  .demo-note {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--step--1);
    color: var(--text-muted);
  }

  /* ── Principe ── */
  .premise-grid {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
    gap: var(--space-16);
    align-items: center;
  }
  .premise-spot {
    inline-size: min(16rem, 45%);
    margin-block-start: var(--space-6);
    --parallax: 28px;
  }
  .letter-wrap {
    max-inline-size: 36rem;
  }
  .letter-head {
    display: grid;
    gap: var(--space-1);
    padding-block-end: var(--space-3);
    margin-block-end: var(--space-4);
    border-block-end: var(--border-strong) solid var(--brand);
  }
  .letter-office {
    font-family: var(--font-label);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--brand);
  }
  .letter-ref {
    font-family: var(--font-type);
    font-size: var(--step--1);
    color: var(--ink-muted);
  }
  .letter-body {
    display: grid;
    gap: var(--space-4);
    font-family: var(--font-type);
    color: var(--ink-type);
    line-height: var(--leading-read);
  }
  .letter-sign {
    margin-block-start: var(--space-5);
    text-align: end;
    font-family: var(--font-hand);
    font-size: var(--step-2);
  }

  /* ── Bande-annonce : façade 16:9 (DESIGN §14.5) ── */
  .trailer-wrap {
    max-inline-size: 60rem;
  }
  .trailer {
    position: relative;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: var(--radius-m);
    background: var(--surface-3);
    box-shadow: var(--shadow-lifted);
  }
  .trailer-facade {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: var(--text);
    text-decoration: none;
  }
  .trailer-facade:focus-visible {
    outline-offset: -6px;
  }
  .trailer-facade::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, var(--scrim) 0%, transparent 45%);
    pointer-events: none;
  }
  .trailer-poster {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }
  .trailer-play {
    position: relative;
    z-index: 1;
    inline-size: clamp(3rem, 10vw, 5.5rem);
    aspect-ratio: 1;
    border-radius: var(--radius-pill);
    background: var(--accent);
    box-shadow: var(--shadow-press), var(--shadow-2);
    transition:
      transform var(--dur-fast) var(--ease-out),
      background-color var(--dur-fast) var(--ease-out);
  }
  /* Triangle de lecture découpé dans le disque (aucune icône « lecture » dans le jeu). */
  .trailer-play::before {
    content: '';
    position: absolute;
    inset: 30% 26% 30% 36%;
    background: var(--accent-contrast);
    clip-path: polygon(0 0, 100% 50%, 0 100%);
  }
  .trailer-facade:hover .trailer-play,
  .trailer-facade:focus-visible .trailer-play {
    transform: scale(1.06);
    background: var(--accent-strong);
  }
  .trailer-label {
    position: absolute;
    z-index: 1;
    inset-inline: var(--space-4);
    inset-block-end: var(--space-4);
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: var(--space-3);
    font-family: var(--font-label);
    font-size: var(--step-0);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
  }
  .trailer-label .num {
    font-family: var(--font-type);
    letter-spacing: normal;
    text-transform: none;
    color: var(--text-muted);
  }
  .trailer :global(.trailer-frame) {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    border: 0;
  }
  .trailer-note {
    margin-block-start: var(--space-4);
    font-family: var(--font-type);
    font-size: var(--step--1);
    color: var(--text-muted);
    text-align: center;
  }
  @media (max-width: 37.4375rem) {
    .trailer-label {
      inset-block-end: var(--space-2);
      font-size: var(--step--1);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .trailer-play {
      transition: none;
    }
    .trailer-facade:hover .trailer-play,
    .trailer-facade:focus-visible .trailer-play {
      transform: none;
    }
  }

  /* ── Gestes ── */
  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
    gap: var(--space-12) var(--space-10);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .feature {
    block-size: 100%;
  }
  .feature :global(.sheet-wrap) {
    block-size: 100%;
  }
  .feature-spot {
    inline-size: min(72%, 14rem);
    margin: calc(var(--space-2) * -1) auto var(--space-3);
  }
  .f-kick {
    font-family: var(--font-label);
    font-size: var(--step--1);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--paper-accent-strong);
  }
  .f-title {
    margin-block: var(--space-1) var(--space-2);
    font-size: var(--step-2);
    color: var(--ink);
  }
  .f-text {
    color: var(--ink-muted);
  }

  /* ── Carte ── */
  .map-grid {
    display: grid;
    grid-template-columns: minmax(0, 4fr) minmax(0, 7fr);
    gap: var(--space-12);
    align-items: center;
  }
  .map-copy {
    margin-block-end: 0;
  }
  .map-credit {
    margin-block-start: var(--space-4);
    font-family: var(--font-type);
    font-size: var(--step--1);
    color: var(--text-muted);
    text-align: end;
  }

  /* ── Visages ── */
  .plates {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-8);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .more {
    margin-block-start: var(--space-10);
    text-align: center;
  }

  /* ── Plateformes ── */
  #plateformes:focus {
    outline: none;
  }
  .folder-body {
    display: grid;
    gap: var(--space-6);
    padding: var(--space-4) var(--space-2) var(--space-2);
  }
  .folder-lede {
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-size: var(--step-2);
    font-style: italic;
  }
  .folder-wrap {
    max-inline-size: 60rem;
  }
  .platforms {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
    gap: var(--space-5);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .platforms li {
    display: grid;
    justify-items: start;
    gap: var(--space-2);
    padding: var(--space-4);
    border-radius: var(--radius-s);
    background: var(--surface-1);
    box-shadow: var(--shadow-1);
  }
  .status {
    font-family: var(--font-type);
    font-size: var(--step--1);
  }
  .folder-note {
    font-size: var(--step--1);
  }
  /* Widget itch.io : 552 × 167 au plus, à la largeur du dossier sur téléphone. */
  .itch-embed {
    display: block;
    width: 100%;
    max-width: 552px;
    height: 167px;
    border: 0;
    border-radius: var(--radius-s);
  }

  /* ── Captures ── */
  .shots {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-10);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .shot-frame {
    position: relative;
    display: grid;
    place-items: center;
    aspect-ratio: 16 / 10;
    padding: var(--space-4);
    background: var(--surface-3);
    border-radius: var(--radius-xs);
  }
  .shot-frame img {
    inline-size: 56%;
    opacity: 0.9;
  }
  .shot-soon {
    position: absolute;
    inset-block-end: var(--space-3);
    inset-inline-end: var(--space-3);
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-type);
    font-size: var(--step--1);
    color: var(--ink-muted);
  }
  .shots figcaption {
    margin-block-start: var(--space-3);
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-size: var(--step-1);
    color: var(--ink);
  }

  @media (max-width: 79.9375rem) {
    .plates {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .map-grid,
    .premise-grid {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-10);
    }
  }
  @media (max-width: 47.4375rem) {
    .hero {
      display: block;
      min-block-size: 0;
    }
    .hero :global(.hero-bg) {
      position: relative;
      inset: auto;
      aspect-ratio: 4 / 5;
      max-block-size: 72dvh;
      inline-size: 100%;
    }
    .hero::after {
      display: none;
    }
    .hero-copy {
      margin-block-start: -22vw;
      padding: 0 var(--gutter) var(--space-8);
    }
    .shots {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (max-width: 37.4375rem) {
    .cta :global(.btn) {
      flex: 1 1 100%;
    }
    .plates {
      gap: var(--space-5);
    }
  }
</style>
