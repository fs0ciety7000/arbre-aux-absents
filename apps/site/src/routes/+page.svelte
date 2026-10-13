<script lang="ts">
  import { resolve } from '$app/paths';
  import { Badge, Button, Icon, type IconName } from '@arbre/ui';
  import MapArt from '#lib/components/MapArt.svelte';
  import PortraitPlate from '#lib/components/PortraitPlate.svelte';
  import Seo from '#lib/components/Seo.svelte';
  import { SITE_DESCRIPTION, SITE_NAME } from '#lib/site';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const features: { icon: IconName; title: string; text: string }[] = [
    {
      icon: 'archives',
      title: 'Une enquête sans rail',
      text: 'Aucun ordre imposé, aucune progression balisée : vous tirez le fil que vous voulez, dans les archives que vous voulez.',
    },
    {
      icon: 'tree',
      title: 'Un arbre sur quatre générations',
      text: 'Une trentaine de personnes à nommer, à reconnaître et à situer : prénom, nom, visage et métier, case après case.',
    },
    {
      icon: 'map',
      title: 'La carte de la Velmarche',
      text: 'Une carte gravée et aquarellée du pays : chaque lieu ouvre ses propres archives, du port de pêche à la capitale.',
    },
    {
      icon: 'search',
      title: 'Des archives à recouper',
      text: 'Lettres, registres, photographies, coupures de presse, annuaires, et un lecteur de fiches d’époque qui répond aux mots-clés.',
    },
    {
      icon: 'lock',
      title: 'Validation par groupes',
      text: 'Les réponses ne se confirment que par groupes de cases : impossible de deviner au hasard, la déduction reste la vôtre.',
    },
    {
      icon: 'star',
      title: 'Rejouabilité',
      text: 'Plusieurs fins selon les secrets que vous mettez au jour, des succès à débloquer et un mode chronométré pour les rapporteurs pressés.',
    },
  ];

  const platforms = [
    { name: 'Windows', status: 'En développement' },
    { name: 'macOS', status: 'En développement' },
    { name: 'Linux', status: 'En développement' },
    { name: 'Android', status: 'En développement' },
  ];
</script>

<Seo title={SITE_NAME} description={SITE_DESCRIPTION} path="/" />

<section class="hero" aria-labelledby="hero-title">
  <div class="container hero-grid">
    <div class="hero-text">
      <p class="kicker">Une enquête généalogique</p>
      <h1 id="hero-title">L’Arbre aux absents</h1>
      <p class="lede">
        Un arbre vide, une pile d’archives et la carte d’un pays qui n’existe pas. Rendez leur nom,
        leur visage et leur métier à tous les membres d’une famille, en croisant lettres, registres
        et photographies.
      </p>
      <div class="actions">
        <Button variant="primary" size="l" href={resolve('le-monde/')} iconName="map"
          >Explorer la Velmarche</Button
        >
        <Button variant="secondary" size="l" href="#plateformes">Plateformes</Button>
      </div>
    </div>
    <figure class="hero-map">
      <div class="sheet" data-surface="paper">
        <MapArt
          map={data.map}
          label="Carte de la Velmarche, gravure rehaussée d’aquarelle : la vallée de l’Orvelle et sa capitale Aubrelieu au centre, l’Ostrie et ses fjords au nord, le golfe d’Ambre à l’ouest, les monts Corvins au sud-est."
        />
      </div>
      <figcaption>Carte de la Velmarche, dressée et gravée par CM Creative Lab.</figcaption>
    </figure>
  </div>
</section>

<section class="band grain" data-surface="paper" aria-labelledby="principe-title">
  <div class="container principle">
    <div class="section-head">
      <p class="kicker">Le principe</p>
      <h2 id="principe-title">Velmarche, octobre 1974</h2>
    </div>
    <div class="prose">
      <p>
        La Régence est tombée depuis vingt ans. Pendant quinze ans, ses bureaux ont rayé des
        registres des milliers de citoyens : sans état civil, sans droits, on les appelait les
        «&nbsp;absents&nbsp;». Une loi nouvelle permet enfin de les réinscrire.
      </p>
      <p>
        Vous êtes rapporteur à l’Office de Réinscription civile. Sur votre bureau, une succession à
        instruire, un arbre généalogique presque vide et des cartons d’archives. À vous de
        reconstituer la famille, pièce par pièce, et de comprendre ce que les papiers ont effacé.
      </p>
    </div>
  </div>
</section>

<section class="band" aria-labelledby="features-title">
  <div class="container">
    <div class="section-head">
      <p class="kicker">Le jeu</p>
      <h2 id="features-title">Lire, chercher, déduire</h2>
    </div>
    <ul class="features">
      {#each features as f (f.title)}
        <li class="feature">
          <span class="feature-icon"><Icon name={f.icon} size="1.5rem" /></span>
          <h3>{f.title}</h3>
          <p>{f.text}</p>
        </li>
      {/each}
    </ul>
  </div>
</section>

<section class="band faces" aria-labelledby="faces-title">
  <div class="container">
    <div class="section-head">
      <p class="kicker">Les visages</p>
      <h2 id="faces-title">Des portraits à reconnaître</h2>
      <p class="lede">
        Chaque personne a sa silhouette, son accessoire, sa couleur. Sur une photographie de groupe
        ou au dos d’une carte postale, c’est à vous de la retrouver.
      </p>
    </div>
    <ul class="plates">
      {#each data.plates as plate, i (plate.plate)}
        <li><PortraitPlate {plate} tilt={i % 2 ? 1 : -1} caption={false} /></li>
      {/each}
    </ul>
    <p class="more">
      <a href={resolve('artbook/')}>Voir toutes les planches de l’artbook</a>
    </p>
  </div>
</section>

<section class="band" id="plateformes" aria-labelledby="platforms-title" tabindex="-1">
  <div class="container">
    <div class="section-head">
      <p class="kicker">Plateformes</p>
      <h2 id="platforms-title">Sur ordinateur, sur téléphone, dans le navigateur</h2>
    </div>
    <ul class="platforms">
      {#each platforms as p (p.name)}
        <li>
          <span class="platform-name">{p.name}</span>
          <Badge tone="neutral" variant="outline">{p.status}</Badge>
        </li>
      {/each}
      <li class="demo">
        <span class="platform-name">Démo navigateur</span>
        <Badge tone="accent" iconName="clock">Bientôt sur itch.io</Badge>
      </li>
    </ul>
    <p class="note">
      Jeu en français, en solo, de six à dix heures. Prix et date de sortie à annoncer.
    </p>
  </div>
</section>

<section class="band" aria-labelledby="shots-title">
  <div class="container">
    <div class="section-head">
      <p class="kicker">Captures</p>
      <h2 id="shots-title">Le bureau de l’enquêteur</h2>
    </div>
    <ul class="shots">
      {#each ['L’arbre et le lecteur d’archives', 'La carte et ses lieux', 'Le carnet d’enquête'] as shot (shot)}
        <li class="shot">
          <Icon name="look" size="1.5rem" />
          <span>{shot}</span>
          <span class="soon">Capture à venir</span>
        </li>
      {/each}
    </ul>
  </div>
</section>

<style>
  .hero {
    padding-block: var(--space-12) var(--space-16);
  }
  .hero-grid {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    align-items: center;
    gap: var(--space-12);
  }
  .hero-text {
    display: grid;
    gap: var(--space-5);
  }
  h1 {
    font-size: var(--step-5);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-block-start: var(--space-2);
  }
  .hero-map {
    display: grid;
    gap: var(--space-3);
    margin: 0;
  }
  .sheet {
    padding: var(--space-2);
    border-radius: var(--radius-paper);
    background: var(--surface-1);
    box-shadow: var(--shadow-paper);
    rotate: calc(var(--tilt-max) * -0.5);
  }
  .hero-map figcaption {
    font-size: var(--step--1);
    color: var(--text-muted);
    text-align: end;
  }

  .principle .section-head {
    margin-block-end: 0;
  }
  .principle {
    display: grid;
    grid-template-columns: minmax(0, 4fr) minmax(0, 8fr);
    gap: var(--space-8);
  }

  .features {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-6);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .feature {
    display: grid;
    align-content: start;
    gap: var(--space-3);
    padding: var(--space-6);
    border-radius: var(--radius-m);
    background: var(--surface-1);
    box-shadow: var(--shadow-1);
  }
  .feature h3 {
    font-size: var(--step-1);
  }
  .feature p {
    color: var(--text-muted);
  }
  .feature-icon {
    display: inline-grid;
    place-items: center;
    inline-size: var(--hit-l);
    block-size: var(--hit-l);
    border-radius: var(--radius-pill);
    background: var(--accent-tint);
    color: var(--accent);
  }

  .plates {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-8);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .more {
    margin-block-start: var(--space-8);
  }
  .more a {
    display: inline-flex;
    align-items: center;
    min-block-size: var(--hit);
  }

  .platforms {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    gap: var(--space-4);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .platforms li {
    display: grid;
    justify-items: start;
    gap: var(--space-3);
    padding: var(--space-5);
    border: var(--border) solid var(--line);
    border-radius: var(--radius-m);
    background: var(--surface-1);
  }
  .platforms .demo {
    border-color: var(--accent);
  }
  .platform-name {
    font-family: var(--font-display);
    font-size: var(--step-1);
    font-weight: var(--weight-semibold);
  }
  .note {
    margin-block-start: var(--space-6);
    color: var(--text-muted);
  }
  #plateformes:focus {
    outline: none;
  }

  .shots {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-6);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .shot {
    display: grid;
    place-content: center;
    justify-items: center;
    gap: var(--space-2);
    aspect-ratio: 16 / 10;
    padding: var(--space-4);
    border: var(--border-strong) dashed var(--line-strong);
    border-radius: var(--radius-m);
    color: var(--text-muted);
    text-align: center;
  }
  .soon {
    font-size: var(--step--1);
  }

  @media (max-width: 79.9375rem) {
    .hero-grid,
    .principle {
      grid-template-columns: minmax(0, 1fr);
    }
    .features {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .plates {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 37.4375rem) {
    .hero {
      padding-block: var(--space-8) var(--space-12);
    }
    .features,
    .shots {
      grid-template-columns: minmax(0, 1fr);
    }
    .plates {
      gap: var(--space-5);
    }
    .actions :global(a) {
      flex: 1 1 100%;
    }
  }
</style>
