<script lang="ts">
  import PortraitPlate from '#lib/components/PortraitPlate.svelte';
  import Seo from '#lib/components/Seo.svelte';
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
</script>

<Seo
  title="Artbook"
  description="Les planches de L’Arbre aux absents : portraits gravés et aquarellés, détails de la carte de la Velmarche, et l’intention artistique du jeu."
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

<div class="container page-head">
  <p class="kicker">Artbook</p>
  <h1>Gravure et aquarelle</h1>
  <p class="lede">
    Un trait d’encre bleu-noir gravé, des hachures pour le volume, puis quelques lavis transparents
    posés par un coloriste. Toute l’illustration du jeu suit ce procédé ancien, dans une interface
    nette et contemporaine.
  </p>
</div>

<section class="band intent grain" data-surface="paper" aria-labelledby="intention-title">
  <div class="container split">
    <div class="section-head">
      <p class="kicker">Intention</p>
      <h2 id="intention-title">« Le bureau sous la lampe »</h2>
    </div>
    <div class="prose">
      <p>
        Il est tard. Sur un bureau d’enquêteur plongé dans le bleu de la nuit, une lampe de laiton
        éclaire des archives : lettres, registres, photographies, une carte dépliée. Tout ce qui se
        lit est du papier dans la lumière ; tout ce qui sert d’outil reste dans l’ombre, net et
        discret.
      </p>
      <p>
        L’illustration est une <strong>taille-douce à l’encre ferro-gallique</strong>, rehaussée d’<strong
          >aquarelle</strong
        >. Le trait hiérarchise : contours appuyés, détails plus fins, ombres et courbes de niveau à
        peine posées. Les lavis restent transparents, jamais plus de deux couches, et débordent un
        peu du trait, comme la main d’un coloriste.
      </p>
      <p>
        Les portraits sont des bustes de trois-quarts, reconnaissables en vignette comme en grand :
        chaque personne a sa silhouette de coiffure, son accessoire et sa couleur de vêtement.
      </p>
    </div>
  </div>
</section>

<section class="band" aria-labelledby="portraits-title">
  <div class="container">
    <div class="section-head">
      <p class="kicker">Portraits</p>
      <h2 id="portraits-title">Galerie des visages</h2>
      <p class="lede">
        Quelques planches parmi la trentaine de portraits du jeu. Les noms restent dans les archives
        : à vous de les y retrouver.
      </p>
    </div>
    {#if data.plates.some((p) => p.node)}
      <ul class="gallery">
        {#each data.plates as plate, i (plate.plate)}
          <li><PortraitPlate {plate} tilt={i % 3 === 0 ? -1 : i % 3 === 1 ? 0.75 : -0.5} /></li>
        {/each}
      </ul>
    {:else}
      <p class="empty">Les portraits arrivent bientôt.</p>
    {/if}
  </div>
</section>

<section class="band" aria-labelledby="carte-title">
  <div class="container">
    <div class="section-head">
      <p class="kicker">La carte</p>
      <h2 id="carte-title">Détails de la carte de la Velmarche</h2>
      <p class="lede">
        Une seule grande planche, découpée en couches : fond, relief, eaux, lieux et toponymes. Dans
        le jeu, chaque lieu s’éclaire quand on le visite.
      </p>
    </div>
    {#if data.map}
      <ul class="details">
        {#each details as d (d.id)}
          <li>
            <figure>
              <div class="crop" data-surface="paper">
                <svg
                  class="art"
                  viewBox={d.viewBox}
                  role="img"
                  aria-label="Détail de la carte : {d.title}"
                >
                  <use href="#artbook-map" />
                </svg>
              </div>
              <figcaption>
                <span class="fig-title">{d.title}</span>
                {d.text}
              </figcaption>
            </figure>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="empty">Les planches de la carte arrivent bientôt.</p>
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
  .split {
    display: grid;
    grid-template-columns: minmax(0, 4fr) minmax(0, 8fr);
    gap: var(--space-10);
    align-items: start;
  }
  .gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
    gap: var(--space-8);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .details {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-8);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  figure {
    display: grid;
    gap: var(--space-3);
    margin: 0;
  }
  .crop {
    padding: var(--space-2);
    border-radius: var(--radius-paper);
    background: var(--surface-1);
    box-shadow: var(--shadow-paper);
  }
  .crop svg {
    inline-size: 100%;
    block-size: auto;
    aspect-ratio: 4 / 3;
    background: var(--art-paper);
  }
  figcaption {
    display: grid;
    gap: var(--space-1);
    color: var(--text-muted);
    font-family: var(--font-read);
    line-height: var(--leading-snug);
  }
  .fig-title {
    font-family: var(--font-display);
    font-size: var(--step-1);
    font-weight: var(--weight-semibold);
    color: var(--text);
  }
  .note,
  .empty {
    margin-block-start: var(--space-8);
    color: var(--text-muted);
  }
  @media (max-width: 79.9375rem) {
    .split {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-6);
    }
    .details {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 37.4375rem) {
    .details {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
