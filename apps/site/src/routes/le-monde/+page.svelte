<!--
  Le monde v2 (DESIGN §14) : la carte interactive épinglée sur le bureau (seule partie hydratée),
  puis l'histoire tapée sur une feuille de registre, le lexique ostrien en fiches bristol et les
  lieux en fiches distribuées. Révélations au défilement : data-sr / data-play (hooks.server.ts).
-->
<script lang="ts">
  import { IndexCard, Icon, PaperSheet, Tape } from '@arbre/ui';
  import VineDivider from '#lib/components/VineDivider.svelte';
  import Seo from '#lib/components/Seo.svelte';
  import WorldMapExplorer from '#lib/components/WorldMapExplorer.svelte';
  import { PLACES } from '#lib/content/world';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const history: { date: string; text: string }[] = [
    { date: '1214', text: 'Fondation d’Aubrelieu, ville-pont sur l’Orvelle.' },
    { date: '1488', text: 'Les seigneuries de la vallée forment le duché de Velmarche.' },
    { date: '1602', text: 'Traité de Vellaak : l’Ostrie, au nord, est rattachée à la Velmarche.' },
    {
      date: '1811',
      text: 'Charte de Velmarche : Grand-Duché constitutionnel et création de l’état civil communal.',
    },
    { date: '1848', text: 'Liberté de la presse ; fondation du Courrier d’Aubrelieu.' },
    {
      date: '1889',
      text: 'Grande Exposition d’Aubrelieu : le pays se montre moderne, verre, papier, savon et navires.',
    },
    {
      date: '1916–1919',
      text: 'Guerre des Cols contre la Thalberie voisine, pour le col de Corvenne.',
    },
    { date: '1929', text: 'Krach de la banque Sorbelle, la plus vieille du pays.' },
    {
      date: '1937',
      text: 'Coup d’État du général Destrade : le Grand-Duc abdique, la Régence commence.',
    },
    {
      date: '1938',
      text: 'Loi sur la pureté des registres : des citoyens sont radiés de l’état civil et déclarés «\u00a0absents\u00a0».',
    },
    { date: '1952', text: 'Journées d’avril : soulèvement d’Aubrelieu et fin de la Régence.' },
    { date: '1953', text: 'Constitution de la République.' },
    {
      date: '1973',
      text: 'Loi de réinscription civile : un Office est chargé de rendre leur nom aux absents.',
    },
    { date: '1974', text: 'Octobre. Une succession arrive sur votre bureau.' },
  ];

  const lexicon: [string, string][] = [
    ['vel', 'mer'],
    ['tenn', 'feu, lumière'],
    ['ok', 'cap, pointe'],
    ['laak', 'abri, eau calme'],
    ['kess', 'pierre'],
    ['aar', 'île'],
    ['vik', 'baie'],
    ['taalik', 'messager'],
  ];
</script>

<Seo
  title="Le monde"
  description="La Velmarche, petit pays imaginaire entre mer Grise et monts Corvins : sa carte gravée et aquarellée, son histoire, ses langues et ses lieux."
  path="/le-monde/"
/>

<header class="container page-head world-head">
  <div class="head-copy">
    <p class="kicker">Le monde</p>
    <h1>La <em>Velmarche</em></h1>
    <p class="lede">
      Un petit pays de vallée et de côtes, inventé pour le jeu : la vallée de l’Orvelle et sa
      capitale Aubrelieu au centre, le plateau et les fjords de l’Ostrie au nord, le golfe d’Ambre à
      l’ouest et, au sud-est, les monts Corvins qui le séparent de la Thalberie.
    </p>
  </div>
  <img
    class="art-img head-spot mv-rise"
    src={data.spots.lighthouse.src}
    width={data.spots.lighthouse.width}
    height={data.spots.lighthouse.height}
    alt=""
    decoding="async"
  />
</header>

<section class="container map-section" aria-labelledby="carte-title">
  <h2 id="carte-title" class="visually-hidden">Carte interactive</h2>
  <div class="map-pinned">
    <Tape class="tape-a" length="7rem" rotate={-8} />
    <Tape class="tape-b" length="7rem" rotate={6} />
    <WorldMapExplorer />
  </div>
  <p class="map-note">
    <Icon name="compass" size="1.1rem" />
    <span
      >Flèches : se déplacer · + et − : zoomer · 0 : vue d’ensemble · Tab : passer de lieu en lieu.
      Au doigt : glisser, pincer, toucher un lieu.</span
    >
  </p>
</section>

<VineDivider vine={data.vine} />

<section class="band" aria-labelledby="histoire-title">
  <div class="container split">
    <div class="section-head" data-sr>
      <p class="kicker">Histoire</p>
      <h2 id="histoire-title" class="section-title">Sept siècles <em>en quelques dates</em></h2>
      <p class="lede">
        Un Grand-Duché devenu République, une Régence de quinze ans qui effaçait les gens des
        registres, et une loi qui, en 1973, promet de les y réinscrire.
      </p>
      <img
        class="art-img side-spot mv-parallax"
        src={data.spots.register.src}
        width={data.spots.register.width}
        height={data.spots.register.height}
        alt=""
        loading="lazy"
        decoding="async"
      />
    </div>
    <div data-sr style:--i="1" style:--reveal-tilt="1.5deg">
      <PaperSheet tone="aged" tilt={-0.5} fastener="pin" as="article" class="register">
        <p class="register-head">Registre chronologique · Archives d’Aubrelieu</p>
        <ol class="timeline">
          {#each history as h (h.date)}
            <li>
              <span class="date num">{h.date}</span>
              <span class="event">{h.text}</span>
            </li>
          {/each}
        </ol>
      </PaperSheet>
    </div>
  </div>
</section>

<VineDivider vine={data.vine} />

<section class="band" aria-labelledby="langues-title">
  <div class="container split">
    <div class="section-head" data-sr>
      <p class="kicker">Langues</p>
      <h2 id="langues-title" class="section-title">Trois langues, <em>une carte</em></h2>
      <div class="prose">
        <p>
          Le <strong>velmarchois</strong>, langue officielle, est rendu en français dans le jeu,
          avec ses tournures d’époque : la «&nbsp;maison commune&nbsp;» des vieux actes, la lieue,
          le florin.
        </p>
        <p>
          Au nord, l’<strong>ostrien</strong> a ses voyelles doublées et ses noms de lieux qui se
          lisent comme des paysages ; le nom d’une femme y prend le suffixe <em>-essa</em>. Plus
          loin, la <strong>Thalberie</strong> parle une langue étrangère, aux noms en <em>-in</em>
          et <em>-ko</em>.
        </p>
      </div>
    </div>
    <div class="lexicon-wrap">
      <h3 class="lexicon-title" data-sr>Petit lexique ostrien</h3>
      <ul class="lexicon">
        {#each lexicon as [word, meaning], i (word)}
          <li class="word-card" data-sr style:--i={i % 4} style:--reveal-tilt="{i % 2 ? 4 : -4}deg">
            <IndexCard tilt={[-1.2, 0.8, -0.4, 1.4][i % 4]}>
              <span class="word">{word}</span>
              <span class="visually-hidden"> : </span>
              <span class="meaning">{meaning}</span>
            </IndexCard>
          </li>
        {/each}
      </ul>
      <p class="lexicon-note" data-sr>
        D’où <em>Tennok</em>, «&nbsp;cap du feu&nbsp;», et <em>Kessaar</em>, «&nbsp;île de
        pierre&nbsp;».
      </p>
    </div>
  </div>
</section>

<VineDivider vine={data.vine} />

<section class="band" aria-labelledby="lieux-title">
  <div class="container">
    <div class="section-head center" data-sr>
      <p class="kicker">Lieux</p>
      <h2 id="lieux-title" class="section-title">Les lieux <em>de la carte</em></h2>
      <p class="lede">D’ouest en est. Chacun, dans le jeu, ouvre ses propres archives.</p>
    </div>
    {#if PLACES.length}
      <ul class="places">
        {#each PLACES as p, i (p.id)}
          <li data-sr style:--i={i % 3} style:--reveal-tilt="{i % 2 ? 5 : -5}deg">
            <IndexCard title={p.name} cote={p.kindLabel} tilt={[-1, 0.6, -0.3, 1.1][i % 4]}>
              <p class="place-desc">{p.description}</p>
            </IndexCard>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="empty">
        <Icon name="map" size="1.1rem" /> Les lieux de la carte seront bientôt décrits ici.
      </p>
    {/if}
  </div>
</section>

<style>
  .world-head {
    grid-template-columns: minmax(0, 1fr) minmax(8rem, 15rem);
    align-items: end;
    gap: var(--space-8);
  }
  .head-copy {
    display: grid;
    justify-items: start;
    gap: var(--space-4);
  }
  .head-spot {
    --i: 2;
  }
  .map-section {
    padding-block-end: var(--space-8);
  }
  .map-pinned {
    position: relative;
  }
  .map-pinned :global(.tape-a),
  .map-pinned :global(.tape-b) {
    position: absolute;
    z-index: 2;
    inset-block-start: calc(var(--space-3) * -1);
  }
  .map-pinned :global(.tape-a) {
    inset-inline-start: var(--space-6);
  }
  .map-pinned :global(.tape-b) {
    inset-inline-end: var(--space-6);
  }
  .map-note {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    margin-block-start: var(--space-5);
    font-family: var(--font-type);
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .map-note :global(svg) {
    flex: none;
    color: var(--fern);
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
  .side-spot {
    inline-size: min(16rem, 70%);
    margin-block-start: var(--space-6);
  }
  .register-head {
    margin-block-end: var(--space-4);
    padding-block-end: var(--space-3);
    border-block-end: 2px solid var(--brand);
    font-family: var(--font-label);
    font-size: var(--step--1);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--brand);
  }
  .timeline {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .timeline li {
    display: grid;
    grid-template-columns: 6.5rem minmax(0, 1fr);
    gap: var(--space-4);
    padding-block: var(--space-3);
    border-block-end: var(--border) solid var(--line);
  }
  .timeline li:last-child {
    border-block-end: 0;
  }
  .date {
    font-family: var(--font-type);
    font-weight: var(--weight-bold);
    color: var(--ink-type);
  }
  .event {
    font-family: var(--font-read);
    line-height: var(--leading-read);
  }
  .timeline li:last-child .event {
    font-family: var(--font-hand);
    font-size: var(--step-1);
    color: var(--ink-hand);
  }
  .lexicon-wrap {
    display: grid;
    gap: var(--space-5);
  }
  .lexicon-title {
    font-family: var(--font-label);
    font-size: var(--step-0);
    font-weight: var(--weight-regular);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--brand);
  }
  .lexicon {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
    gap: var(--space-5);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .word-card :global(.index-card) {
    block-size: 100%;
  }
  /* Sur la réglure : l'interligne reste le pas de la fiche (--rule-gap). */
  .word {
    display: block;
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-style: italic;
    font-size: var(--step-1);
    line-height: var(--rule-gap);
    color: var(--ink);
  }
  .meaning {
    display: block;
    font-family: var(--font-type);
    color: var(--ink-muted);
  }
  .lexicon-note {
    font-family: var(--font-read);
    color: var(--text-muted);
  }
  .places {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
    gap: var(--space-8) var(--space-6);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .places li :global(.index-card) {
    block-size: 100%;
  }
  .place-desc {
    font-family: var(--font-read);
    color: var(--ink);
  }
  .empty {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--text-muted);
  }
  @media (max-width: 63.9375rem) {
    .split {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-8);
    }
  }
  @media (max-width: 37.4375rem) {
    .world-head {
      grid-template-columns: minmax(0, 1fr);
    }
    .head-spot {
      inline-size: 9rem;
      grid-row: 1;
    }
    .timeline li {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-1);
    }
  }
</style>
