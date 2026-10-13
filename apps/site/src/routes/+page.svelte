<!--
  Accueil v2 (DESIGN §14) : héros sur l'art clé vivant, puis un récit au défilement — le principe
  (ordre de mission tapé), les gestes du jeu (feuilles épinglées et vignettes d'aquarelle), la
  carte qui s'encre, les visages distribués comme des fiches, les plateformes (chemise kraft) et
  les captures. Prérendu sans hydratation ; le mouvement au défilement est le petit script en
  ligne de hooks.server.ts (data-sr, data-play, data-tilt), sans effet en mouvement réduit.
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import { Button, DymoLabel, Folder, Icon, PaperSheet, Wordmark } from '@arbre/ui';
  import HeroArt from '#lib/components/HeroArt.svelte';
  import MapSheet from '#lib/components/MapSheet.svelte';
  import PortraitPlate from '#lib/components/PortraitPlate.svelte';
  import Seo from '#lib/components/Seo.svelte';
  import VineDivider from '#lib/components/VineDivider.svelte';
  import { SITE_DESCRIPTION, SITE_NAME } from '#lib/site';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const s = $derived(data.spots);

  type Fastener = 'tape' | 'pin' | 'clip';
  const features = $derived<
    {
      spot: typeof s.tree;
      kicker: string;
      title: string;
      text: string;
      tilt: number;
      fastener: Fastener;
    }[]
  >([
    {
      spot: s.tree,
      kicker: 'Reconstituer',
      title: 'Un arbre sur quatre générations',
      text: 'Une trentaine de cases à remplir : prénom, nom, visage et métier. Chaque nom se gagne pièce par pièce.',
      tilt: -1.4,
      fastener: 'tape',
    },
    {
      spot: s.archives,
      kicker: 'Fouiller',
      title: 'Des archives qui se contredisent',
      text: 'Lettres, registres, coupures de presse, annuaires, photographies sans légende : croisez-les, surlignez, épinglez.',
      tilt: 0.8,
      fastener: 'pin',
    },
    {
      spot: s.map,
      kicker: 'Voyager',
      title: 'La carte de la Velmarche',
      text: 'Une carte gravée et aquarellée du pays : chaque lieu ouvre ses archives, du port de pêche à la capitale.',
      tilt: -0.6,
      fastener: 'tape',
    },
    {
      spot: s.catalogue,
      kicker: 'Interroger',
      title: 'Un catalogue qui répond aux mots-clés',
      text: 'Le meuble à fiches de l’Office : tapez un nom, un lieu, une date, et tirez le tiroir.',
      tilt: 1,
      fastener: 'clip',
    },
    {
      spot: s.stamp,
      kicker: 'Établir',
      title: 'Des réponses validées par groupes',
      text: 'Impossible de deviner au hasard : une branche ne se tamponne «\u00a0Établi\u00a0» que lorsqu’elle tient entière.',
      tilt: -0.9,
      fastener: 'tape',
    },
    {
      spot: s.magnifier,
      kicker: 'Déduire',
      title: 'Une enquête sans rail',
      text: 'Aucun ordre imposé : vous tirez le fil que vous voulez. Plusieurs fins selon les secrets mis au jour.',
      tilt: 0.6,
      fastener: 'pin',
    },
  ]);

  const platforms = ['Windows', 'macOS', 'Linux', 'Android'];

  const shots = $derived([
    { spot: s.tree, title: 'L’arbre et le lecteur d’archives', tilt: -1.2 },
    { spot: s.map, title: 'La carte et ses lieux', tilt: 0.9 },
    { spot: s.letter, title: 'Le carnet d’enquête', tilt: -0.5 },
  ]);
</script>

<Seo title={SITE_NAME} description={SITE_DESCRIPTION} path="/" />

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
<section class="hero" aria-label="L’Arbre aux absents">
  <HeroArt images={data.hero.images} live={data.hero.live} alt={data.hero.alt} class="hero-bg" />
  <div class="hero-copy">
    <div>
      <Wordmark
        size="hero"
        animate
        glow
        kicker="Un jeu d’enquête généalogique"
        tagline="Une famille effacée des registres. Un bureau, une lampe, et tout l’automne pour lui rendre ses noms."
      />
    </div>
    <div class="cta mv-rise" style:--i="7">
      <Button variant="primary" size="l" href="/jouer/" rel="external" iconName="forward"
        >Jouer dans le navigateur</Button
      >
      <Button variant="secondary" size="l" href={resolve('le-monde/')} iconName="map"
        >Explorer la Velmarche</Button
      >
      <Button variant="secondary" size="l" href={resolve('artbook/')} iconName="photo"
        >Voir l’artbook</Button
      >
    </div>
    <div class="platforms-line mv-rise" style:--i="8">
      <DymoLabel text="Windows · macOS · Linux · Android" tilt={-1} />
      <span class="demo-note"><Icon name="clock" size="1rem" /> Gratuit, aussi sur itch.io</span>
    </div>
  </div>
</section>

<VineDivider vine={data.vine} />

<!-- ── Le principe : l'ordre de mission ─────────────────────────────────────────── -->
<section class="band premise" aria-labelledby="principe-title">
  <div class="container premise-grid">
    <div class="section-head" data-sr>
      <p class="kicker">Le principe</p>
      <h2 id="principe-title" class="section-title">Velmarche, <em>octobre</em> 1974</h2>
      <p class="lede">
        La Régence est tombée depuis vingt ans. Une loi nouvelle permet enfin de rendre leur nom aux
        «&nbsp;absents&nbsp;».
      </p>
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
          <p class="letter-office">Office de Réinscription civile</p>
          <p class="letter-ref num">Ordre de mission · Aubrelieu, le 7 octobre 1974</p>
        </header>
        <div class="letter-body">
          <p>
            Pendant quinze ans, les bureaux de la Régence ont rayé des registres des milliers de
            citoyens : sans état civil, sans droits, on les appelait les «&nbsp;absents&nbsp;».
          </p>
          <p>
            Vous êtes rapporteur à l’Office. Sur votre bureau : une succession à instruire, un arbre
            généalogique presque vide et des cartons d’archives.
          </p>
          <p>
            Reconstituez la famille, pièce par pièce, et comprenez ce que les papiers ont effacé.
          </p>
        </div>
        <p class="letter-sign ink-hand">Le Directeur de l’Office</p>
      </PaperSheet>
    </div>
  </div>
</section>

<VineDivider vine={data.vine} />

<!-- ── Les gestes : feuilles épinglées ──────────────────────────────────────────── -->
<section id="jeu" class="band" aria-labelledby="jeu-title">
  <div class="container">
    <div class="section-head center" data-sr>
      <p class="kicker">Le jeu</p>
      <h2 id="jeu-title" class="section-title">Six gestes <em>d’archiviste</em></h2>
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
      <p class="kicker">Le monde</p>
      <h2 id="carte-title" class="section-title">Un pays qui <em>n’existe pas</em></h2>
      <p class="lede">
        La vallée de l’Orvelle et sa capitale Aubrelieu, les fjords de l’Ostrie, le golfe d’Ambre,
        les monts Corvins. Chaque lieu, dans le jeu, ouvre ses propres archives.
      </p>
      <Button variant="secondary" href={resolve('le-monde/')} iconName="compass"
        >Ouvrir la carte interactive</Button
      >
    </div>
    <div class="map-wrap">
      <MapSheet
        map={data.map}
        label="Carte de la Velmarche, gravure rehaussée d’aquarelle : la vallée de l’Orvelle et sa capitale Aubrelieu au centre, l’Ostrie et ses fjords au nord, le golfe d’Ambre à l’ouest, les monts Corvins au sud-est."
      />
      <p class="map-credit">Dressée et gravée par CM Creative Lab.</p>
    </div>
  </div>
</section>

<VineDivider vine={data.vine} />

<!-- ── Les visages : distribués comme des fiches ───────────────────────────────── -->
<section class="band" aria-labelledby="faces-title">
  <div class="container">
    <div class="section-head center" data-sr>
      <p class="kicker">Les visages</p>
      <h2 id="faces-title" class="section-title">Des portraits <em>à reconnaître</em></h2>
      <p class="lede">
        Chacun a sa silhouette, son accessoire, sa couleur. Sur une photo de groupe ou au dos d’une
        carte postale, à vous de le retrouver.
      </p>
    </div>
    <ul class="plates">
      {#each data.plates as plate, i (plate.plate)}
        <li data-sr style:--i={i} style:--reveal-tilt="{i % 2 ? 6 : -6}deg">
          <PortraitPlate {plate} tilt={i % 2 ? 1.5 : -1.5} />
        </li>
      {/each}
    </ul>
    <p class="more">
      <a class="more-link" href={resolve('artbook/')}
        >Toutes les planches de l’artbook <Icon name="forward" size="1rem" /></a
      >
    </p>
  </div>
</section>

<!-- ── Plateformes : une chemise kraft ──────────────────────────────────────────── -->
<section class="band" id="plateformes" aria-label="Plateformes" tabindex="-1">
  <div class="container folder-wrap" data-sr>
    <Folder
      id="folder-plateformes"
      title="Plateformes"
      cote="ORC 74 · DIFFUSION"
      tabAlign="start"
      headingLevel={2}
    >
      <div class="folder-body">
        <p class="folder-lede">Sur ordinateur, sur téléphone, et bientôt dans le navigateur.</p>
        <ul class="platforms">
          {#each platforms as p, i (p)}
            <li>
              <DymoLabel text={p} tilt={i % 2 ? 1 : -1} />
              <span class="status">En développement</span>
            </li>
          {/each}
          <li class="demo">
            <DymoLabel text="Démo web" tone="red" tilt={-1.5} />
            <span class="status">Bientôt sur itch.io</span>
          </li>
        </ul>
        <p class="folder-note">
          Jeu en français, en solo, de six à dix heures. Prix et date de sortie à annoncer.
        </p>
      </div>
    </Folder>
  </div>
</section>

<!-- ── Captures : tirages en attente ───────────────────────────────────────────── -->
<section class="band" aria-labelledby="shots-title">
  <div class="container">
    <div class="section-head center" data-sr>
      <p class="kicker">Captures</p>
      <h2 id="shots-title" class="section-title">Le bureau <em>de l’enquêteur</em></h2>
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
                <span class="shot-soon"><Icon name="photo" size="1rem" /> Capture à venir</span>
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
