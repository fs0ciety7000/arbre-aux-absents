<!--
  Artbook v2 (DESIGN §14.3) : l'art clé en grand tirage, les vignettes d'aquarelle en colonnes
  (masonry simple), l'intention sur une lettre, les portraits distribués en fiches bristol, puis
  les détails de la carte en épreuves scotchées. Prérendu sans JS : chaque planche s'ouvre en
  grand dans son propre SVG ; révélations au défilement par data-sr (hooks.server.ts).
-->
<script lang="ts">
  import { Icon, PaperSheet } from '@arbre/ui';
  import PortraitPlate from '#lib/components/PortraitPlate.svelte';
  import Seo from '#lib/components/Seo.svelte';
  import VineDivider from '#lib/components/VineDivider.svelte';
  import { STRINGS } from '#lib/i18n/index';
  import { currentLang } from '#lib/i18n/app';
  import Rich from '#lib/i18n/Rich.svelte';
  import SvgTree from '#lib/svg/SvgTree.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const t = $derived(STRINGS[currentLang()]);
  const a = $derived(t.artbook);

  /** Détails de la carte : recadrages (unités du viewBox 1350 × 1000) ; textes au catalogue. */
  const DETAILS = [
    { id: 'cartouche', viewBox: '20 815 370 180' },
    { id: 'rose', viewBox: '25 185 125 140' },
    { id: 'tennok', viewBox: '150 15 270 170' },
    { id: 'aubrelieu', viewBox: '560 470 270 190' },
    { id: 'moulinvert', viewBox: '730 600 280 280' },
    { id: 'corvins', viewBox: '1000 640 350 360' },
  ] as const;
  const details = $derived(DETAILS.map((d) => ({ ...d, ...a.map.details[d.id] })));

  const spotTilts = [-1.2, 0.9, -0.5, 1.3, -0.8, 0.6, -1.4, 1, -0.4, 0.8];
</script>

<Seo title={a.seoTitle} description={a.seoDescription} path="artbook/" />

{#if data.map}
  <!-- La carte n'est rendue qu'une fois ; chaque détail la réutilise par <use>. -->
  <svg class="art master" width="0" height="0" aria-hidden="true" focusable="false">
    <defs>
      <g id="artbook-map"><SvgTree nodes={data.map.c} /></g>
    </defs>
  </svg>
{/if}

<header class="container page-head">
  <p class="kicker">{a.kicker}</p>
  <h1><Rich text={a.title} /></h1>
  <p class="lede">{a.lede}</p>
</header>

<!-- ── L'art clé, en grand tirage ── -->
<section class="container keyart-section" aria-labelledby="keyart-title">
  <h2 id="keyart-title" class="visually-hidden">{a.keyArtHeading}</h2>
  <div class="keyart-wrap" data-sr>
    <PaperSheet tone="new" tilt={-0.4} fastener="tape" padded={false} as="div">
      <figure class="sheet-fig">
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- URL d'image déjà résolue au prérendu -->
        <a class="plate-link" href={data.keyart.wide.src} aria-label={a.enlargeKeyArt}>
          <picture>
            <source
              media="(max-width: 47.4375rem)"
              srcset={data.keyart.tall.src}
              width={data.keyart.tall.width}
              height={data.keyart.tall.height}
            />
            <img
              class="art-img keyart"
              src={data.keyart.wide.src}
              width={data.keyart.wide.width}
              height={data.keyart.wide.height}
              alt={data.keyart.alt}
              decoding="async"
            />
          </picture>
        </a>
        <figcaption class="keyart-cap">
          <span class="cap-title">{a.keyArtTitle}</span>
          <span>{a.keyArtCaption}</span>
        </figcaption>
      </figure>
    </PaperSheet>
  </div>
</section>

<VineDivider vine={data.vine} />

<!-- ── L'intention, sur une lettre ── -->
<section class="band" aria-labelledby="intention-title">
  <div class="container split">
    <div class="section-head" data-sr>
      <p class="kicker">{a.intention.kicker}</p>
      <h2 id="intention-title" class="section-title"><Rich text={a.intention.title} /></h2>
      <img
        class="art-img seal mv-parallax"
        src={data.seal.src}
        width={data.seal.width}
        height={data.seal.height}
        alt=""
        loading="lazy"
        decoding="async"
      />
    </div>
    <div data-sr style:--i="1" style:--reveal-tilt="2deg">
      <PaperSheet tone="paper" tilt={0.6} fastener="clip" edge="torn" as="article">
        <div class="prose letter">
          {#each a.intention.prose as para, i (i)}
            <p><Rich text={para} /></p>
          {/each}
        </div>
      </PaperSheet>
    </div>
  </div>
</section>

<VineDivider vine={data.vine} />

<!-- ── Les vignettes d'aquarelle, en colonnes ── -->
<section class="band" aria-labelledby="spots-title">
  <div class="container">
    <div class="section-head center" data-sr>
      <p class="kicker">{a.spots.kicker}</p>
      <h2 id="spots-title" class="section-title"><Rich text={a.spots.title} /></h2>
      <p class="lede">{a.spots.lede}</p>
    </div>
    <ul class="masonry">
      {#each data.spots as spot, i (spot.name)}
        <li data-sr style:--i={i % 3} style:--reveal-tilt="{spotTilts[i]! * 3}deg">
          <div data-tilt="3">
            <PaperSheet
              tone={i % 3 === 2 ? 'aged' : 'paper'}
              tilt={spotTilts[i]}
              fastener={i % 2 ? 'pin' : 'tape'}
              as="div"
            >
              <figure class="sheet-fig">
                <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- URL d'image déjà résolue au prérendu -->
                <a class="plate-link" href={spot.image.src}>
                  <img
                    class="art-img"
                    src={spot.image.src}
                    width={spot.image.width}
                    height={spot.image.height}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                  <span class="visually-hidden">{a.spots.enlarge(spot.title)}</span>
                </a>
                <figcaption class="spot-cap">{spot.title}</figcaption>
              </figure>
            </PaperSheet>
          </div>
        </li>
      {/each}
    </ul>
  </div>
</section>

<VineDivider vine={data.vine} />

<!-- ── Les portraits, distribués en fiches ── -->
<section class="band" aria-labelledby="portraits-title">
  <div class="container">
    <div class="section-head center" data-sr>
      <p class="kicker">{a.portraits.kicker}</p>
      <h2 id="portraits-title" class="section-title"><Rich text={a.portraits.title} /></h2>
      <p class="lede">{a.portraits.lede}</p>
    </div>
    {#if data.plates.some((p) => p.image)}
      <ul class="gallery">
        {#each data.plates as plate, i (plate.plate)}
          <li data-sr style:--i={i % 4} style:--reveal-tilt="{i % 2 ? 6 : -6}deg">
            <PortraitPlate
              {plate}
              tilt={i % 3 === 0 ? -1.4 : i % 3 === 1 ? 1 : -0.5}
              cote={t.common.plate(plate.plate)}
              missing={t.common.portraitSoon}
            />
          </li>
        {/each}
      </ul>
    {:else}
      <p class="empty"><Icon name="photo" size="1.1rem" /> {a.portraits.empty}</p>
    {/if}
  </div>
</section>

<VineDivider vine={data.vine} />

<!-- ── Les détails de la carte, en épreuves ── -->
<section class="band" aria-labelledby="carte-title">
  <div class="container">
    <div class="section-head center" data-sr>
      <p class="kicker">{a.map.kicker}</p>
      <h2 id="carte-title" class="section-title"><Rich text={a.map.title} /></h2>
      <p class="lede">{a.map.lede}</p>
    </div>
    {#if data.map}
      <ul class="details">
        {#each details as d, i (d.id)}
          <li data-sr style:--i={i % 3}>
            <PaperSheet
              tone="new"
              tilt={[-0.8, 0.6, -0.3][i % 3]}
              fastener={i % 2 ? 'pin' : 'tape'}
              as="div"
            >
              <figure class="sheet-fig">
                <div class="crop">
                  <svg
                    class="art"
                    viewBox={d.viewBox}
                    role="img"
                    aria-label={a.map.detailLabel(d.title)}
                  >
                    <use href="#artbook-map" />
                  </svg>
                </div>
                <figcaption class="detail-cap">
                  <span class="cap-title">{d.title}</span>
                  {d.text}
                </figcaption>
              </figure>
            </PaperSheet>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="empty">
        <Icon name="map" size="1.1rem" />
        {a.map.empty}
      </p>
    {/if}
    <p class="note">{a.map.note}</p>
  </div>
</section>

<style>
  .master {
    position: absolute;
    inline-size: 0;
    block-size: 0;
    overflow: hidden;
  }
  .keyart-section {
    padding-block-end: var(--space-6);
  }
  .keyart-wrap {
    max-inline-size: 72rem;
    margin-inline: auto;
  }
  .keyart {
    border-radius: var(--radius-s) var(--radius-s) 0 0;
  }
  .plate-link {
    display: block;
    border-radius: var(--radius-s);
  }
  .keyart-cap {
    display: grid;
    gap: var(--space-1);
    padding: var(--space-4) var(--space-5) var(--space-5);
    font-family: var(--font-type);
    font-size: var(--step--1);
    color: var(--ink-muted);
  }
  .cap-title {
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-size: var(--step-1);
    font-weight: var(--weight-display);
    color: var(--ink);
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
  .seal {
    inline-size: min(12rem, 50%);
    margin-block-start: var(--space-6);
  }
  .letter {
    color: var(--ink);
  }
  /* Planches en quinconce : une colonne sur deux descend d'un cran (masonry simple). */
  .masonry {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(12rem, 40vw), 1fr));
    gap: var(--space-8) var(--space-6);
    margin: 0;
    padding: 0 0 var(--space-10);
    list-style: none;
  }
  .masonry li:nth-child(even) {
    translate: 0 var(--space-10);
  }
  .spot-cap {
    margin-block-start: var(--space-2);
    font-family: var(--font-hand);
    font-size: var(--step-1);
    color: var(--ink-hand);
    text-align: center;
  }
  .gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(12.5rem, 40vw), 1fr));
    gap: var(--space-10) var(--space-6);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .details {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
    gap: var(--space-10) var(--space-8);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .details li :global(.sheet-wrap) {
    block-size: 100%;
  }
  .crop svg {
    display: block;
    inline-size: 100%;
    block-size: auto;
    aspect-ratio: 4 / 3;
    background: var(--art-paper);
  }
  .detail-cap {
    display: grid;
    gap: var(--space-1);
    margin-block-start: var(--space-3);
    font-family: var(--font-read);
    line-height: var(--leading-snug);
    color: var(--ink-muted);
  }
  .note,
  .empty {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-block-start: var(--space-10);
    color: var(--text-muted);
  }
  @media (max-width: 63.9375rem) {
    .split {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-8);
    }
  }
</style>
