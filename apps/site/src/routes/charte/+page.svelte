<script lang="ts">
  import { asset } from '$app/paths';
  import { Badge, Icon, Stamp } from '@arbre/ui';
  import { HOUSE_LOGOS } from '#lib/art/brand';
  import BrandLogo from '#lib/components/BrandLogo.svelte';
  import Seo from '#lib/components/Seo.svelte';
  import TreeMark from '#lib/components/TreeMark.svelte';
  import Wordmark from '#lib/components/Wordmark.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const fonts = [
    {
      token: '--font-read',
      name: 'Literata',
      role: 'Titres, lecture, documents imprimés',
      sample: 'Reconstituez l’arbre d’une famille, pièce par pièce.',
    },
    {
      token: '--font-ui',
      name: 'Instrument Sans',
      role: 'Interface : boutons, panneaux, navigation',
      sample: 'Archives · Carnet · Carte · 12 / 30 identifiés',
    },
    {
      token: '--font-type',
      name: 'Courier Prime',
      role: 'Machine à écrire : rapports, télégrammes, fiches',
      sample: 'OFFICE DE RÉINSCRIPTION CIVILE — DOSSIER N° 74-0112',
    },
    {
      token: '--font-hand',
      name: 'Caveat',
      role: 'Manuscrit : lettres, dos de photographies (remplaçable)',
      sample: 'Bons baisers des Bains-de-Mérande…',
    },
    {
      token: '--font-legible',
      name: 'Atkinson Hyperlegible Next',
      role: 'Option de lisibilité du jeu',
      sample: 'Une police pensée pour la lecture facile.',
    },
  ];

  const dos = [
    'Le logo-titre sur la nuit du bureau, en vélin et laiton, ou sur papier, à l’encre.',
    'Une zone de protection d’au moins la hauteur de l’emblème autour du logo-titre.',
    'Les illustrations sur leur papier, sans recadrage qui coupe un visage.',
    'Le laiton pour une seule action par écran.',
  ];
  const donts = [
    'Recolorer le logo-titre, le déformer ou lui ajouter une ombre ou un contour.',
    'Poser le logo-titre sur une illustration chargée ou sur la carte.',
    'Employer une police pixel art ou une typographie de fantaisie.',
    'Révéler un nom, un secret ou une fin de l’enquête dans une communication.',
  ];
</script>

<Seo
  title="Charte graphique"
  description="La charte graphique de L’Arbre aux absents pour la presse et les partenaires : logo-titre, palette, typographies, illustration, règles d’usage et ressources."
  path="/charte/"
/>

<div class="container page-head">
  <p class="kicker">Charte graphique</p>
  <h1>L’identité du jeu</h1>
  <p class="lede">
    Pour la presse et les partenaires : comment présenter <em class="title">L’Arbre aux absents</em
    >. Toutes les valeurs de cette page sont lues dans le système de design du jeu.
  </p>
</div>

<section class="band" aria-labelledby="logo-title">
  <div class="container">
    <div class="section-head">
      <p class="kicker">Logo</p>
      <h2 id="logo-title">Le logo-titre</h2>
      <p class="lede">
        Un arbre de quatre générations dessiné à la plume, dont une case reste vide, et le nom du
        jeu en Literata demi-gras.
      </p>
    </div>
    <div class="logo-grid">
      <figure class="logo-card">
        <div class="logo-stage night"><Wordmark size="l" /></div>
        <figcaption>Sur la nuit du bureau (usage principal)</figcaption>
      </figure>
      <figure class="logo-card">
        <div class="logo-stage paper grain" data-surface="paper"><Wordmark size="l" /></div>
        <figcaption>Sur papier</figcaption>
      </figure>
      <figure class="logo-card">
        <div class="logo-stage night mark-only">
          <span class="mark-big"><TreeMark size="6rem" /></span>
        </div>
        <figcaption>L’emblème seul : icône, avatar, favicon</figcaption>
      </figure>
    </div>
  </div>
</section>

<section class="band" aria-labelledby="palette-title">
  <div class="container">
    <div class="section-head">
      <p class="kicker">Couleurs</p>
      <h2 id="palette-title">Palette</h2>
      <p class="lede">
        Valeurs en OKLCH (source) et leur équivalent hexadécimal approché, pour l’impression et les
        outils qui n’en ont pas.
      </p>
    </div>
    {#each data.palette as group (group.title)}
      <div class="palette-group">
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

<section class="band" aria-labelledby="type-title">
  <div class="container">
    <div class="section-head">
      <p class="kicker">Typographie</p>
      <h2 id="type-title">Cinq polices libres</h2>
      <p class="lede">
        Toutes sous licence SIL Open Font License, auto-hébergées. Aucune police pixel art.
      </p>
    </div>
    <ul class="fonts">
      {#each fonts as f (f.token)}
        <li>
          <p class="font-meta"><span class="font-name">{f.name}</span> · {f.role}</p>
          <p class="specimen" style:font-family="var({f.token})">{f.sample}</p>
        </li>
      {/each}
    </ul>
  </div>
</section>

<section class="band grain" data-surface="paper" aria-labelledby="illu-title">
  <div class="container split">
    <div class="section-head">
      <p class="kicker">Illustration</p>
      <h2 id="illu-title">Gravure rehaussée d’aquarelle</h2>
    </div>
    <div class="prose">
      <p>
        Un trait d’encre ferro-gallique bleu-noir, des hachures pour le volume, puis des lavis
        transparents. Les documents du jeu (lettres, registres, coupures de presse) sont du papier
        dans la lumière ; l’interface autour reste sombre, nette et discrète.
      </p>
      <p class="stamp-line">
        <Stamp text="Établi" size="m" label="Tampon «&nbsp;Établi&nbsp;»" />
        <span>Le tampon violet marque ce que le joueur a établi. Il n’est jamais décoratif.</span>
      </p>
    </div>
  </div>
</section>

<section class="band" aria-labelledby="usage-title">
  <div class="container">
    <div class="section-head">
      <p class="kicker">Usage</p>
      <h2 id="usage-title">À faire, à éviter</h2>
    </div>
    <div class="do-dont">
      <div class="do">
        <h3><Icon name="check" /> À faire</h3>
        <ul>
          {#each dos as d (d)}<li>{d}</li>{/each}
        </ul>
      </div>
      <div class="dont">
        <h3><Icon name="close" /> À éviter</h3>
        <ul>
          {#each donts as d (d)}<li>{d}</li>{/each}
        </ul>
      </div>
    </div>
  </div>
</section>

<section class="band" aria-labelledby="partners-title">
  <div class="container">
    <div class="section-head">
      <p class="kicker">Signature</p>
      <h2 id="partners-title">Logos de la maison</h2>
      <p class="lede">
        Dans cet ordre, sur une même ligne de base : CARDOR Media, CM Interactive, CM Creative Lab.
        Monochromes vélin sur le site et dans le jeu ; couleurs d’origine ci-dessous, pour la
        presse.
      </p>
    </div>
    <ul class="partners">
      {#each HOUSE_LOGOS as logo (logo.id)}
        <li>
          <BrandLogo {logo} mono={false} />
          <span class="partner-name">{logo.name}</span>
          <span class="partner-role">{logo.role}</span>
        </li>
      {/each}
    </ul>
  </div>
</section>

<section class="band" aria-labelledby="dl-title">
  <div class="container">
    <div class="section-head">
      <p class="kicker">Ressources</p>
      <h2 id="dl-title">À télécharger</h2>
    </div>
    <ul class="downloads">
      {#each HOUSE_LOGOS as l (l.id)}
        <li>
          <!-- Fichiers servis depuis apps/site/static/brand/ (copie de static/brand/). -->
          <a href={asset(`brand/${l.id}.svg`)} download><Icon name="save" /> Logo {l.name}</a>
          <span class="dl-detail">SVG, couleurs d’origine</span>
        </li>
      {/each}
      <li>
        <span class="dl-soon">Logo-titre du jeu (SVG et PNG)</span>
        <Badge tone="neutral" variant="outline">Bientôt</Badge>
      </li>
      <li>
        <span class="dl-soon">Carte de la Velmarche en haute définition</span>
        <Badge tone="neutral" variant="outline">Bientôt</Badge>
      </li>
      <li>
        <span class="dl-soon">Captures d’écran et planches de portraits</span>
        <Badge tone="neutral" variant="outline">Bientôt</Badge>
      </li>
    </ul>
  </div>
</section>

<style>
  .title {
    font-style: italic;
  }
  .split {
    display: grid;
    grid-template-columns: minmax(0, 4fr) minmax(0, 8fr);
    gap: var(--space-10);
    align-items: start;
  }

  .logo-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-6);
  }
  .logo-card {
    display: grid;
    gap: var(--space-3);
    margin: 0;
  }
  .logo-stage {
    display: grid;
    place-items: center;
    min-block-size: 12rem;
    padding: var(--space-10) var(--space-6);
    border-radius: var(--radius-m);
    overflow: hidden;
  }
  .logo-stage.night {
    background: var(--canvas);
    border: var(--border) solid var(--line);
  }
  .logo-stage.paper {
    background: var(--canvas);
    box-shadow: var(--shadow-paper);
  }
  .logo-stage :global(.wordmark.l) {
    font-size: var(--step-3);
    white-space: normal;
  }
  .mark-big {
    color: var(--accent);
  }
  .logo-card figcaption {
    color: var(--text-muted);
    font-size: var(--step--1);
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
    color: var(--text-muted);
    font-size: var(--step--1);
  }
  .font-name {
    color: var(--text);
    font-weight: var(--weight-semibold);
  }
  .specimen {
    font-size: var(--step-3);
    line-height: var(--leading-snug);
  }

  .stamp-line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-6);
  }

  .do-dont {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-6);
  }
  .do,
  .dont {
    padding: var(--space-6);
    border-radius: var(--radius-m);
    background: var(--surface-1);
    border-block-start: var(--border-strong) solid;
  }
  .do {
    border-color: var(--success);
  }
  .dont {
    border-color: var(--danger);
  }
  .do h3,
  .dont h3 {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--step-1);
  }
  .do h3 {
    color: var(--success);
  }
  .dont h3 {
    color: var(--danger);
  }
  .do ul,
  .dont ul {
    display: grid;
    gap: var(--space-2);
    margin-block-start: var(--space-4);
    padding-inline-start: var(--space-5);
  }

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
    font-weight: var(--weight-semibold);
  }
  .partner-role {
    color: var(--text-muted);
    font-size: var(--step--1);
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

  @media (max-width: 79.9375rem) {
    .split {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-6);
    }
    .logo-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (max-width: 37.4375rem) {
    .do-dont {
      grid-template-columns: minmax(0, 1fr);
    }
    .specimen {
      font-size: var(--step-2);
    }
  }
</style>
