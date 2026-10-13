<script lang="ts">
  import { resolve } from '$app/paths';
  import { Badge } from '@arbre/ui';
  import Seo from '#lib/components/Seo.svelte';

  const facts: { term: string; value: string }[] = [
    { term: 'Titre', value: 'L’Arbre aux absents' },
    { term: 'Genre', value: 'Enquête généalogique, déduction' },
    { term: 'Développement', value: 'CM Interactive' },
    { term: 'Écriture et illustration', value: 'CM Creative Lab' },
    { term: 'Édition', value: 'CARDOR Media' },
    { term: 'Plateformes', value: 'Windows, macOS, Linux, Android ; démo navigateur' },
    { term: 'Langue', value: 'Français (textes et interface)' },
    { term: 'Joueurs', value: 'Un joueur' },
    { term: 'Durée', value: 'Six à dix heures pour l’affaire principale' },
    { term: 'Prix', value: 'À déterminer' },
    { term: 'Sortie', value: 'À annoncer' },
    { term: 'Site', value: 'arbre.fs0ciety.org' },
  ];
</script>

<Seo
  title="Presse"
  description="Dossier de presse de L’Arbre aux absents : fiche technique, présentation courte et longue, contact."
  path="/presse/"
/>

<div class="container page-head">
  <p class="kicker">Presse</p>
  <h1>Dossier de presse</h1>
  <p class="lede">
    Tout ce qu’il faut pour présenter le jeu. Les éléments visuels et leurs règles d’usage sont sur
    la <a href={resolve('charte/')}>charte graphique</a>.
  </p>
</div>

<section class="container layout" aria-label="Fiche et présentation">
  <section class="sheet grain" data-surface="paper" aria-labelledby="fiche-title">
    <h2 id="fiche-title">Fiche technique</h2>
    <dl>
      {#each facts as f (f.term)}
        <div class="row">
          <dt>{f.term}</dt>
          <dd>{f.value}</dd>
        </div>
      {/each}
      <div class="row">
        <dt>Démo</dt>
        <dd><Badge tone="accent" iconName="clock">Bientôt sur itch.io</Badge></dd>
      </div>
    </dl>
  </section>

  <div class="texts">
    <section aria-labelledby="court-title">
      <h2 id="court-title">En une phrase</h2>
      <p class="pitch">
        Un jeu d’enquête généalogique en solo : reconstituez l’arbre d’une famille sur quatre
        générations en croisant lettres, registres, photographies et coupures de presse, dans un
        pays imaginaire, la Velmarche.
      </p>
    </section>

    <section aria-labelledby="long-title">
      <h2 id="long-title">Présentation</h2>
      <div class="prose">
        <p>
          Velmarche, octobre 1974. Vingt ans après la chute de la Régence, qui rayait des registres
          les citoyens jugés indésirables, une loi permet enfin de réinscrire ceux qu’on appelait
          les «&nbsp;absents&nbsp;». Rapporteur à l’Office de Réinscription civile, le joueur reçoit
          une succession à instruire : un arbre généalogique presque vide et des cartons d’archives.
        </p>
        <p>
          Lettres, actes, photographies de groupe, annuaires, cartes postales, articles de presse et
          un lecteur de fiches d’époque qui répond aux mots-clés : rien n’est imposé dans l’ordre.
          Le joueur tire le fil qu’il veut, note, épingle et recoupe, puis remplit chaque case de
          l’arbre (nom, visage, métier). Les réponses ne se valident que par groupes : on ne devine
          pas, on déduit.
        </p>
        <p>
          Une carte gravée et aquarellée du pays ouvre les archives de chaque lieu. Des secrets
          annexes changent le dénouement ; succès et mode chronométré invitent à rejouer.
        </p>
        <p>
          <em class="title">L’Arbre aux absents</em> est développé par CM Interactive, écrit et illustré
          par CM Creative Lab, et édité par CARDOR Media.
        </p>
      </div>
    </section>

    <section aria-labelledby="contact-title" class="contact">
      <h2 id="contact-title">Contact presse</h2>
      <p>
        Le contact presse sera publié ici à l’annonce de la date de sortie. Les demandes de clé de
        test ouvriront avec la démo.
      </p>
    </section>
  </div>
</section>

<style>
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    gap: var(--space-12);
    align-items: start;
  }
  .sheet {
    padding: var(--space-8) var(--space-6);
    border-radius: var(--radius-paper);
    background: var(--canvas);
    box-shadow: var(--shadow-paper);
  }
  .sheet h2 {
    font-size: var(--step-2);
    margin-block-end: var(--space-4);
  }
  dl {
    margin: 0;
  }
  .row {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    gap: var(--space-4);
    padding-block: var(--space-3);
    border-block-end: var(--border) solid var(--line);
  }
  dt {
    color: var(--text-muted);
    font-size: var(--step--1);
    font-weight: var(--weight-semibold);
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
  }
  dd {
    margin: 0;
    font-family: var(--font-read);
  }
  .texts {
    display: grid;
    gap: var(--space-12);
  }
  .texts h2 {
    font-size: var(--step-2);
    margin-block-end: var(--space-4);
  }
  .pitch {
    max-inline-size: var(--measure);
    font-family: var(--font-read);
    font-size: var(--step-1);
    line-height: var(--leading-snug);
  }
  .title {
    font-style: italic;
  }
  .contact {
    padding: var(--space-6);
    border: var(--border) dashed var(--line-strong);
    border-radius: var(--radius-m);
    color: var(--text-muted);
  }
  .contact h2 {
    color: var(--text);
  }
  @media (max-width: 79.9375rem) {
    .layout {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (max-width: 37.4375rem) {
    .row {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-1);
    }
  }
</style>
