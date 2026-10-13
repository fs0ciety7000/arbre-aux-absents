<script lang="ts">
  import Seo from '#lib/components/Seo.svelte';
  import WorldMapExplorer from '#lib/components/WorldMapExplorer.svelte';
  import { PLACES } from '#lib/content/world';

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
      text: 'Loi sur la pureté des registres : des citoyens sont radiés de l’état civil et déclarés «&nbsp;absents&nbsp;».',
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

<div class="container page-head">
  <p class="kicker">Le monde</p>
  <h1>La Velmarche</h1>
  <p class="lede">
    Un petit pays de vallée et de côtes, inventé pour le jeu : la vallée de l’Orvelle et sa capitale
    Aubrelieu au centre, le plateau et les fjords de l’Ostrie au nord, le golfe d’Ambre à l’ouest
    et, au sud-est, les monts Corvins qui le séparent de la Thalberie.
  </p>
</div>

<section class="container" aria-labelledby="carte-title">
  <h2 id="carte-title" class="visually-hidden">Carte interactive</h2>
  <WorldMapExplorer />
  <p class="map-note">
    Flèches : se déplacer · + et − : zoomer · 0 : vue d’ensemble · Tab : passer de lieu en lieu. Au
    doigt : glisser, pincer, toucher un lieu.
  </p>
</section>

<section class="band" aria-labelledby="histoire-title">
  <div class="container split">
    <div class="section-head">
      <p class="kicker">Histoire</p>
      <h2 id="histoire-title">Sept siècles en quelques dates</h2>
      <p class="lede">
        Un Grand-Duché devenu République, une Régence de quinze ans qui effaçait les gens des
        registres, et une loi qui, en 1973, promet de les y réinscrire.
      </p>
    </div>
    <ol class="timeline">
      {#each history as h (h.date)}
        <li>
          <span class="date num">{h.date}</span>
          <span class="event">{h.text}</span>
        </li>
      {/each}
    </ol>
  </div>
</section>

<section class="band grain" data-surface="paper" aria-labelledby="langues-title">
  <div class="container split">
    <div class="section-head">
      <p class="kicker">Langues</p>
      <h2 id="langues-title">Trois langues, une carte</h2>
    </div>
    <div class="prose">
      <p>
        Le <strong>velmarchois</strong>, langue officielle, est rendu en français dans le jeu, avec
        ses tournures d’époque : la « maison commune » des vieux actes, la lieue, le florin.
      </p>
      <p>
        Au nord, l’<strong>ostrien</strong> a ses voyelles doublées et ses noms de lieux qui se
        lisent comme des paysages ; le nom d’une femme y prend le suffixe <em>-essa</em>. Plus loin,
        la
        <strong>Thalberie</strong> parle une langue étrangère, aux noms en <em>-in</em> et
        <em>-ko</em>.
      </p>
      <table class="lexicon">
        <caption>Petit lexique ostrien</caption>
        <thead>
          <tr><th scope="col">Ostrien</th><th scope="col">Sens</th></tr>
        </thead>
        <tbody>
          {#each lexicon as [word, meaning] (word)}
            <tr><td class="word">{word}</td><td>{meaning}</td></tr>
          {/each}
        </tbody>
      </table>
      <p>D’où <em>Tennok</em>, « cap du feu », et <em>Kessaar</em>, « île de pierre ».</p>
    </div>
  </div>
</section>

<section class="band" aria-labelledby="lieux-title">
  <div class="container">
    <div class="section-head">
      <p class="kicker">Lieux</p>
      <h2 id="lieux-title">Les lieux de la carte</h2>
      <p class="lede">D’ouest en est. Chacun, dans le jeu, ouvre ses propres archives.</p>
    </div>
    {#if PLACES.length}
      <ul class="places">
        {#each PLACES as p (p.id)}
          <li>
            <h3>{p.name}</h3>
            <p class="kind">{p.kindLabel}</p>
            <p>{p.description}</p>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="empty">Les lieux de la carte seront bientôt décrits ici.</p>
    {/if}
  </div>
</section>

<style>
  .map-note {
    margin-block-start: var(--space-4);
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .split {
    display: grid;
    grid-template-columns: minmax(0, 4fr) minmax(0, 8fr);
    gap: var(--space-10);
    align-items: start;
  }
  .timeline {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
    border-inline-start: var(--border-strong) solid var(--line);
  }
  .timeline li {
    position: relative;
    display: grid;
    grid-template-columns: 7rem minmax(0, 1fr);
    gap: var(--space-4);
    padding: var(--space-3) 0 var(--space-3) var(--space-6);
  }
  .timeline li::before {
    content: '';
    position: absolute;
    inset-inline-start: calc(var(--space-1) * -1.75);
    inset-block-start: calc(var(--space-3) + 0.45em);
    inline-size: var(--space-3);
    block-size: var(--space-3);
    border-radius: var(--radius-pill);
    background: var(--accent);
  }
  .date {
    font-family: var(--font-display);
    font-weight: var(--weight-semibold);
    color: var(--accent);
  }
  .event {
    font-family: var(--font-read);
    line-height: var(--leading-read);
  }
  .lexicon {
    border-collapse: collapse;
    font-family: var(--font-ui);
    font-size: var(--step-0);
  }
  .lexicon caption {
    margin-block-end: var(--space-2);
    text-align: start;
    font-weight: var(--weight-semibold);
  }
  .lexicon th,
  .lexicon td {
    padding: var(--space-2) var(--space-6) var(--space-2) 0;
    border-block-end: var(--border) solid var(--line);
    text-align: start;
  }
  .lexicon .word {
    font-family: var(--font-read);
    font-style: italic;
  }
  .places {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-6);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .places li {
    display: grid;
    align-content: start;
    gap: var(--space-2);
    padding: var(--space-5);
    border-radius: var(--radius-m);
    background: var(--surface-1);
    box-shadow: var(--shadow-1);
  }
  .places h3 {
    font-size: var(--step-1);
  }
  .places .kind {
    color: var(--accent);
    font-size: var(--step--1);
    font-weight: var(--weight-semibold);
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
  }
  .places p:last-child {
    color: var(--text-muted);
  }
  .empty {
    color: var(--text-muted);
  }
  @media (max-width: 79.9375rem) {
    .split {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-6);
    }
    .places {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 37.4375rem) {
    .places {
      grid-template-columns: minmax(0, 1fr);
    }
    .timeline li {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-1);
    }
  }
</style>
