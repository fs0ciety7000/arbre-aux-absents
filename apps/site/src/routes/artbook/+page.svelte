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
  import SvgTree from '#lib/svg/SvgTree.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  /** Détails de la carte : recadrages (unités du viewBox 1350 × 1000). */
  const details = [
    {
      id: 'cartouche',
      title: 'Le cartouche',
      viewBox: '20 815 370 180',
      text: 'Double filet, titre en capitales, mention du graveur : la carte se présente comme un document officiel de 1974.',
    },
    {
      id: 'rose',
      title: 'La rose des vents',
      viewBox: '25 185 125 140',
      text: 'Cercles à la plume, aiguille pleine au nord : le seul ornement de la marge ouest.',
    },
    {
      id: 'tennok',
      title: 'Le cap de Tennok',
      viewBox: '150 15 270 170',
      text: 'Un phare blanc à bande rouge sur la pointe nord-ouest, et les courbes de niveau de la mer Grise.',
    },
    {
      id: 'aubrelieu',
      title: 'Aubrelieu',
      viewBox: '560 470 270 190',
      text: 'La capitale en vignette : dôme, remparts et toits au lavis carmin, l’Orvelle en ruban céladon.',
    },
    {
      id: 'moulinvert',
      title: 'La Clairette et le lac d’Aulne',
      viewBox: '730 600 280 280',
      text: 'Cheminées, roues à aubes et un lac aux eaux claires : la vallée de la Clairette au pied des collines.',
    },
    {
      id: 'corvins',
      title: 'Les monts Corvins',
      viewBox: '1000 640 350 360',
      text: 'Le relief est gravé à la hachure, la frontière thalbère tracée en lavis carmin.',
    },
  ];

  const spotTilts = [-1.2, 0.9, -0.5, 1.3, -0.8, 0.6, -1.4, 1, -0.4, 0.8];
</script>

<Seo
  title="Artbook"
  description="Les planches de L’Arbre aux absents : l’art clé, les vignettes d’aquarelle, les portraits gravés, les détails de la carte de la Velmarche, et l’intention artistique du jeu."
  path="/artbook/"
/>

{#if data.map}
  <!-- La carte n'est rendue qu'une fois ; chaque détail la réutilise par <use>. -->
  <svg class="art master" width="0" height="0" aria-hidden="true" focusable="false">
    <defs>
      <g id="artbook-map"><SvgTree nodes={data.map.c} /></g>
    </defs>
  </svg>
{/if}

<header class="container page-head">
  <p class="kicker">Artbook</p>
  <h1>Gravure <em>et aquarelle</em></h1>
  <p class="lede">
    Un trait d’encre bleu-noir gravé, des hachures pour le volume, puis quelques lavis transparents
    posés par un coloriste. Toute l’illustration du jeu suit ce procédé ancien, dans une interface
    nette et contemporaine.
  </p>
</header>

<!-- ── L'art clé, en grand tirage ── -->
<section class="container keyart-section" aria-labelledby="keyart-title">
  <h2 id="keyart-title" class="visually-hidden">L’art clé</h2>
  <div class="keyart-wrap" data-sr>
    <PaperSheet tone="new" tilt={-0.4} fastener="tape" padded={false} as="div">
      <figure class="sheet-fig">
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- URL d'image déjà résolue au prérendu -->
        <a class="plate-link" href={data.keyart.wide.src} aria-label="Agrandir l’art clé">
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
          <span class="cap-title">« Le bureau sous la lampe »</span>
          <span>Art clé, 16:9 et 4:5 recomposé pour le téléphone. Écran titre du jeu.</span>
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
      <p class="kicker">Intention</p>
      <h2 id="intention-title" class="section-title">
        «&nbsp;Le bureau <em>sous la lampe</em>&nbsp;»
      </h2>
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
          <p>
            Il est tard. Sur un bureau d’enquêteur plongé dans le bleu de la nuit, une lampe de
            laiton éclaire des archives : lettres, registres, photographies, une carte dépliée. Tout
            ce qui se lit est du papier dans la lumière ; tout ce qui sert d’outil reste dans
            l’ombre, net et discret.
          </p>
          <p>
            L’illustration est une <strong>taille-douce à l’encre ferro-gallique</strong>, rehaussée
            d’<strong>aquarelle</strong>. Le trait hiérarchise : contours appuyés, détails plus
            fins, ombres et courbes de niveau à peine posées. Les lavis restent transparents, jamais
            plus de deux couches, et débordent un peu du trait, comme la main d’un coloriste.
          </p>
          <p>
            Les portraits sont des bustes de trois-quarts, reconnaissables en vignette comme en
            grand : chaque personne a sa silhouette de coiffure, son accessoire et sa couleur de
            vêtement.
          </p>
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
      <p class="kicker">Vignettes</p>
      <h2 id="spots-title" class="section-title">Les objets <em>du bureau</em></h2>
      <p class="lede">
        Dix vignettes peintes pour l’interface : chacune ouvre un geste du jeu, sur une tache de
        lavis.
      </p>
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
                  <span class="visually-hidden">Agrandir : {spot.title}</span>
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
      <p class="kicker">Portraits</p>
      <h2 id="portraits-title" class="section-title">Galerie <em>des visages</em></h2>
      <p class="lede">
        Quelques planches parmi la trentaine de portraits du jeu. Les noms restent dans les archives
        : à vous de les y retrouver.
      </p>
    </div>
    {#if data.plates.some((p) => p.image)}
      <ul class="gallery">
        {#each data.plates as plate, i (plate.plate)}
          <li data-sr style:--i={i % 4} style:--reveal-tilt="{i % 2 ? 6 : -6}deg">
            <PortraitPlate {plate} tilt={i % 3 === 0 ? -1.4 : i % 3 === 1 ? 1 : -0.5} />
          </li>
        {/each}
      </ul>
    {:else}
      <p class="empty"><Icon name="photo" size="1.1rem" /> Les portraits arrivent bientôt.</p>
    {/if}
  </div>
</section>

<VineDivider vine={data.vine} />

<!-- ── Les détails de la carte, en épreuves ── -->
<section class="band" aria-labelledby="carte-title">
  <div class="container">
    <div class="section-head center" data-sr>
      <p class="kicker">La carte</p>
      <h2 id="carte-title" class="section-title">Détails <em>de la Velmarche</em></h2>
      <p class="lede">
        Une seule grande planche, découpée en couches : fond, relief, eaux, lieux et toponymes. Dans
        le jeu, chaque lieu s’éclaire quand on le visite.
      </p>
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
                    aria-label="Détail de la carte : {d.title}"
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
        <Icon name="map" size="1.1rem" /> Les planches de la carte arrivent bientôt.
      </p>
    {/if}
    <p class="note">
      Les illustrations des documents (photographies, cartes postales, coupures de presse)
      rejoindront l’artbook à la sortie du jeu.
    </p>
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
