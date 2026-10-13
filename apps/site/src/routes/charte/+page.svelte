<!--
  Charte graphique v2 « Le dossier vivant » (DESIGN §1–§11), pour la presse et les partenaires :
  le titre du jeu (Wordmark, trois tailles), la palette lue dans les tokens, sept polices, les
  matières du bureau, les icônes encrées, les ornements, le mouvement, l'illustration, les règles
  d'usage et les logos de la maison en couleurs d'origine. Prérendu, sans JS ; les démos de
  mouvement se jouent à l'entrée dans la vue (data-play) et restent immobiles en mouvement réduit.
-->
<script lang="ts">
  import { asset } from '$app/paths';
  import {
    Badge,
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
  import { HOUSE_LOGOS } from '#lib/art/brand';
  import BrandLogo from '#lib/components/BrandLogo.svelte';
  import Seo from '#lib/components/Seo.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const fonts = [
    {
      token: '--font-display',
      name: 'Fraunces',
      role: 'Titrage d’affiche, « old style » aux axes doux et bancals',
      sample: 'Une famille effacée des registres.',
    },
    {
      token: '--font-label',
      name: 'Oswald',
      role: 'Étiquettes, onglets, boutons, tampons (capitales)',
      sample: 'ORC 74 · DIFFUSION · ARCHIVES',
    },
    {
      token: '--font-read',
      name: 'Literata',
      role: 'Lecture : documents imprimés, textes longs',
      sample: 'Reconstituez l’arbre d’une famille, pièce par pièce.',
    },
    {
      token: '--font-ui',
      name: 'Instrument Sans',
      role: 'Interface : panneaux, navigation, réglages',
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

  /** Une sélection d'icônes encrées, avec leur lavis. */
  const icons: { name: IconName; label: string; wash?: string }[] = [
    { name: 'tree', label: 'Arbre', wash: 'var(--fern)' },
    { name: 'archives', label: 'Archives', wash: 'var(--kraft)' },
    { name: 'reader', label: 'Lecteur' },
    { name: 'catalog', label: 'Catalogue', wash: 'var(--kraft)' },
    { name: 'notebook', label: 'Carnet' },
    { name: 'map', label: 'Carte', wash: 'var(--fern)' },
    { name: 'pinboard', label: 'Tableau' },
    { name: 'faces', label: 'Visages', wash: 'var(--brand)' },
    { name: 'search', label: 'Chercher' },
    { name: 'stamp', label: 'Tampon', wash: 'var(--established)' },
    { name: 'lamp', label: 'Lampe', wash: 'var(--accent)' },
    { name: 'quill', label: 'Plume' },
    { name: 'envelope', label: 'Lettre', wash: 'var(--brand)' },
    { name: 'photo', label: 'Photo' },
    { name: 'compass', label: 'Boussole', wash: 'var(--accent)' },
    { name: 'typewriter', label: 'Machine' },
    { name: 'fern', label: 'Fougère', wash: 'var(--fern)' },
    { name: 'lock', label: 'Verrou' },
  ];

  const ornamentLabels: Record<string, string> = {
    corner: 'Coin',
    fern: 'Fougère',
    divider: 'Filet',
    seal: 'Sceau',
    clip: 'Trombone',
    pin: 'Punaise',
    flourish: 'Volute',
  };

  const dos = [
    'Le titre du jeu sur la nuit du bureau, en vélin et vermillon, ou sur papier, à l’encre.',
    'Sur l’art clé, seulement dans sa zone calme, sur le voile prévu.',
    'Les illustrations sur leur papier, sans recadrage qui coupe un visage.',
    'Le safran pour une seule action par écran ; le vermillon pour la marque.',
  ];
  const donts = [
    'Recolorer le titre, le déformer ou lui ajouter une ombre ou un contour.',
    'Poser le titre sur une illustration chargée ou sur la carte.',
    'Employer une police pixel art ou une typographie de fantaisie.',
    'Révéler un nom, un secret ou une fin de l’enquête dans une communication.',
  ];
</script>

<Seo
  title="Charte graphique"
  description="La charte graphique de L’Arbre aux absents pour la presse et les partenaires : titre du jeu, palette, typographies, matières, icônes, mouvement, illustration, règles d’usage et ressources."
  path="/charte/"
/>

<header class="container page-head">
  <p class="kicker">Charte graphique</p>
  <h1>Le dossier <em>vivant</em></h1>
  <p class="lede">
    Pour la presse et les partenaires : comment présenter <em>L’Arbre aux absents</em>. Un bureau
    d’enquêteur la nuit, du papier sous la lampe, des gestes d’archiviste. Toutes les valeurs de
    cette page sont lues dans le système de design du jeu.
  </p>
</header>

<!-- ── Le titre du jeu ── -->
<section class="band" aria-labelledby="logo-title">
  <div class="container">
    <div class="section-head" data-sr>
      <p class="kicker">Titre</p>
      <h2 id="logo-title" class="section-title">Le titre <em>du jeu</em></h2>
      <p class="lede">
        Fraunces noir, «&nbsp;absents&nbsp;» en italique vermillon, une volute de fougère. Trois
        tailles : affiche, écran titre, en-tête.
      </p>
    </div>
    <div class="logo-grid">
      <figure class="logo-card wide" data-sr>
        <div class="logo-stage desk-surface" role="img" aria-label="Titre du jeu, taille affiche">
          <span class="wm" aria-hidden="true"
            ><Wordmark size="hero" as="span" glow kicker="Un jeu d’enquête généalogique" /></span
          >
        </div>
        <figcaption>Affiche, sur la nuit du bureau (usage principal)</figcaption>
      </figure>
      <figure class="logo-card" data-sr style:--i="1">
        <div
          class="logo-stage paper mat-paper"
          data-surface="paper"
          role="img"
          aria-label="Titre du jeu, taille écran titre"
        >
          <span class="wm" aria-hidden="true"><Wordmark size="title" as="span" /></span>
        </div>
        <figcaption>Écran titre, sur papier</figcaption>
      </figure>
      <figure class="logo-card" data-sr style:--i="2">
        <div
          class="logo-stage night"
          role="img"
          aria-label="Titre du jeu, taille en-tête, et emblème"
        >
          <span class="wm" aria-hidden="true"><Wordmark size="header" as="span" /></span>
          <img class="favicon" src={asset('favicon.svg')} width="64" height="64" alt="" />
        </div>
        <figcaption>En-tête et emblème : icône, avatar, favicon</figcaption>
      </figure>
    </div>
  </div>
</section>

<!-- ── Palette ── -->
<section class="band" aria-labelledby="palette-title">
  <div class="container">
    <div class="section-head" data-sr>
      <p class="kicker">Couleurs</p>
      <h2 id="palette-title" class="section-title">Palette <em>d’encre et de papier</em></h2>
      <p class="lede">
        Valeurs en OKLCH (source) et leur équivalent hexadécimal approché, pour l’impression et les
        outils qui n’en ont pas.
      </p>
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
      <p class="kicker">Typographie</p>
      <h2 id="type-title" class="section-title">Sept polices <em>libres</em></h2>
      <p class="lede">
        Toutes sous licence SIL Open Font License, auto-hébergées. Aucune police pixel art.
      </p>
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
      <p class="kicker">Matières</p>
      <h2 id="mat-title" class="section-title">Le bureau <em>en matières</em></h2>
      <p class="lede">
        Rien n’est une «&nbsp;carte&nbsp;» abstraite : chaque surface est un objet du bureau, posé,
        épinglé, scotché.
      </p>
    </div>
    <ul class="materials">
      <li data-sr>
        <PaperSheet tone="paper" tilt={-1.2} fastener="tape" as="div">
          <p class="mat-sample">La feuille</p>
          <p class="mat-caption">
            Papier, bords droits, déchirés ou perforés ; ruban, trombone, punaise.
          </p>
        </PaperSheet>
      </li>
      <li data-sr style:--i="1">
        <Folder title="La chemise" cote="ORC 74-118" headingLevel={3}>
          <p class="mat-note">Kraft ou manille, une cote à l’étiqueteuse, un onglet.</p>
        </Folder>
      </li>
      <li data-sr style:--i="2">
        <IndexCard title="La fiche" cote="RG-09" tilt={1.2}>
          <p class="mat-note card-note">Bristol, réglure bleue, ligne de tête vermillon.</p>
        </IndexCard>
      </li>
      <li class="small-mats" data-sr style:--i="3">
        <div class="mat-row">
          <DymoLabel text="Étiqueteuse" tilt={-2} />
          <DymoLabel text="Annonce" tone="red" tilt={1.5} />
        </div>
        <div class="mat-row tape-row">
          <Tape length="9rem" rotate={-6} />
          <span class="mat-cap">Ruban adhésif</span>
        </div>
        <div class="mat-row">
          <Stamp text="Établi" size="m" label="Tampon «&nbsp;Établi&nbsp;»" />
          <span class="mat-cap">Le tampon violet marque ce que le joueur a établi.</span>
        </div>
      </li>
    </ul>
  </div>
</section>

<!-- ── Icônes et ornements ── -->
<section class="band" aria-labelledby="icons-title">
  <div class="container">
    <div class="section-head" data-sr>
      <p class="kicker">Icônes</p>
      <h2 id="icons-title" class="section-title">Encrées <em>à la plume</em></h2>
      <p class="lede">
        Un tracé principal irrégulier, un second passage d’encre fin, et parfois un lavis
        d’aquarelle derrière. Les mêmes formes, nettes, sous 14 pixels.
      </p>
    </div>
    <ul class="icons">
      {#each icons as ic, i (ic.name)}
        <li data-sr style:--i={i % 6}>
          <Icon name={ic.name} size="2.5rem" wash={ic.wash ?? false} />
          <span>{ic.label}</span>
        </li>
      {/each}
    </ul>
    <h3 class="sub-title" data-sr>Ornements</h3>
    <ul class="ornaments">
      {#each ORNAMENT_NAMES as name, i (name)}
        <li data-sr style:--i={i % 4}>
          <span class="orn"><Ornament {name} size={name === 'divider' ? '9rem' : '4rem'} /></span>
          <span>{ornamentLabels[name] ?? name}</span>
        </li>
      {/each}
    </ul>
  </div>
</section>

<!-- ── Mouvement ── -->
<section class="band" aria-labelledby="motion-title">
  <div class="container">
    <div class="section-head" data-sr>
      <p class="kicker">Mouvement</p>
      <h2 id="motion-title" class="section-title">Des gestes <em>d’archiviste</em></h2>
      <p class="lede">
        Tout bouge comme du papier dans une main : on distribue, on pose, on encre, on tamponne.
        Courbes douces, rebond léger, jamais de rebond de dessin animé. En mouvement réduit, tout
        apparaît en fondu, et l’ambiance se fige.
      </p>
    </div>
    <ul class="motions">
      <li data-play>
        <div class="motion-stage deal-stage">
          {#each [-6, 2, 8] as t, i (t)}
            <IndexCard cote="N° {i + 1}" tilt={t / 4} deal={i} class="deal-card">
              <span class="deal-line"></span>
            </IndexCard>
          {/each}
        </div>
        <p class="motion-name">Distribuer</p>
        <p class="motion-text">Les fiches arrivent en cascade et se calent de biais.</p>
      </li>
      <li data-play>
        <div class="motion-stage ink-stage">
          <InkReveal from="left" blur>
            <span class="ink-word">Velmarche</span>
          </InkReveal>
        </div>
        <p class="motion-name">Encrer</p>
        <p class="motion-text">Le trait se dépose de gauche à droite, l’encre sèche.</p>
      </li>
      <li data-play>
        <div class="motion-stage stamp-stage">
          <Stamp text="Établi" size="l" animate label="Tampon «&nbsp;Établi&nbsp;»" />
        </div>
        <p class="motion-name">Tamponner</p>
        <p class="motion-text">Le tampon frappe, l’encre s’étale, la case encaisse.</p>
      </li>
      <li data-play>
        <div class="motion-stage sway-stage">
          <PaperSheet tone="aged" fastener="pin" sway as="div">
            <span class="deal-line"></span>
            <span class="deal-line short"></span>
          </PaperSheet>
        </div>
        <p class="motion-name">Respirer</p>
        <p class="motion-text">Une feuille épinglée se balance, la lampe vacille.</p>
      </li>
    </ul>
  </div>
</section>

<!-- ── Illustration ── -->
<section class="band" aria-labelledby="illu-title">
  <div class="container split">
    <div class="section-head" data-sr>
      <p class="kicker">Illustration</p>
      <h2 id="illu-title" class="section-title">Gravure <em>rehaussée d’aquarelle</em></h2>
      <div class="prose">
        <p>
          Un trait d’encre ferro-gallique bleu-noir, des hachures pour le volume, puis des lavis
          transparents qui débordent un peu, comme la main d’un coloriste. Les documents du jeu sont
          du papier dans la lumière ; l’interface autour reste sombre, nette et discrète.
        </p>
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
      <p class="kicker">Usage</p>
      <h2 id="usage-title" class="section-title">À faire, <em>à éviter</em></h2>
    </div>
    <div class="do-dont">
      <div data-sr>
        <PaperSheet tone="new" tilt={-0.6} fastener="clip" as="div">
          <h3 class="do-title"><Icon name="check" /> À faire</h3>
          <ul class="rules">
            {#each dos as d (d)}<li>{d}</li>{/each}
          </ul>
        </PaperSheet>
      </div>
      <div data-sr style:--i="1">
        <PaperSheet tone="aged" tilt={0.6} fastener="clip" as="div">
          <h3 class="dont-title"><Icon name="close" /> À éviter</h3>
          <ul class="rules">
            {#each donts as d (d)}<li>{d}</li>{/each}
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
      <p class="kicker">Signature</p>
      <h2 id="partners-title" class="section-title">Logos <em>de la maison</em></h2>
      <p class="lede">
        Dans cet ordre, sur une même ligne de base : CARDOR Media, CM Interactive, CM Creative Lab.
        Monochromes sur le site et dans le jeu ; couleurs d’origine ci-dessous, pour la presse.
      </p>
    </div>
    <ul class="partners">
      {#each HOUSE_LOGOS as logo, i (logo.id)}
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
      <p class="kicker">Ressources</p>
      <h2 id="dl-title" class="section-title">À <em>télécharger</em></h2>
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
      {#each HOUSE_LOGOS as l (l.id)}
        <li>
          <!-- Fichiers servis depuis apps/site/static/brand/ (copie de static/brand/). -->
          <a href={asset(`brand/${l.id}.svg`)} download><Icon name="save" /> Logo {l.name}</a>
          <span class="dl-detail">SVG, couleurs d’origine</span>
        </li>
      {/each}
      <li>
        <span class="dl-soon">Titre du jeu (SVG et PNG)</span>
        <Badge tone="neutral" variant="outline">Bientôt</Badge>
      </li>
      <li>
        <span class="dl-soon">Art clé et carte de la Velmarche en haute définition</span>
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
