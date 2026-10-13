<!--
  Presse v2 : la fiche technique tapée sur une fiche bristol, le pitch en grand titre d'affiche,
  la présentation sur une feuille, le contact dans une chemise kraft. Prérendu, sans JS.
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import { Button, Folder, IndexCard, Ornament, PaperSheet, Stamp } from '@arbre/ui';
  import Seo from '#lib/components/Seo.svelte';
  import { ITCH_URL } from '#lib/site';

  const facts: { term: string; value: string }[] = [
    { term: 'Titre', value: 'L’Arbre aux absents' },
    { term: 'Genre', value: 'Enquête généalogique, déduction' },
    { term: 'Développement', value: 'CM Interactive' },
    { term: 'Écriture et illustration', value: 'CM Creative Lab' },
    { term: 'Édition', value: 'CARDOR Media' },
    { term: 'Plateformes', value: 'Windows, macOS, Linux, Android, navigateur' },
    { term: 'Langue', value: 'Français (textes et interface)' },
    { term: 'Joueurs', value: 'Un joueur' },
    { term: 'Durée', value: 'Six à dix heures pour l’affaire principale' },
    { term: 'Prix', value: 'Gratuit' },
    { term: 'Sortie', value: 'Octobre 2026' },
    { term: 'Site', value: 'arbre.cardormedia.com' },
  ];
</script>

<Seo
  title="Presse"
  description="Dossier de presse de L’Arbre aux absents : fiche technique, présentation courte et longue, contact."
  path="/presse/"
/>

<header class="container page-head">
  <p class="kicker">Presse</p>
  <h1>Dossier <em>de presse</em></h1>
  <p class="lede">
    Tout ce qu’il faut pour présenter le jeu. Les éléments visuels et leurs règles d’usage sont sur
    la <a href={resolve('charte/')}>charte graphique</a>, les planches dans l’<a
      href={resolve('artbook/')}>artbook</a
    >.
  </p>
</header>

<section class="container pitch-block" aria-labelledby="court-title" data-sr>
  <h2 id="court-title" class="kicker">En une phrase</h2>
  <p class="pitch">
    Un jeu d’enquête généalogique en solo : reconstituez l’arbre d’une famille sur quatre
    générations en croisant lettres, registres, photographies et coupures de presse, dans un pays
    imaginaire, <em>la Velmarche</em>.
  </p>
  <span class="pitch-fern" aria-hidden="true"><Ornament name="fern" size="8rem" /></span>
</section>

<section class="band" aria-label="Fiche et présentation">
  <div class="container layout">
    <div class="fiche" data-sr style:--reveal-tilt="-3deg">
      <IndexCard title="Fiche technique" cote="ORC 74 · PR" tilt={-0.8} headingLevel={2}>
        <dl>
          {#each facts as f (f.term)}
            <div class="row">
              <dt>{f.term}</dt>
              <dd>{f.value}</dd>
            </div>
          {/each}
          <div class="row">
            <dt>Téléchargement</dt>
            <dd><a href={ITCH_URL} rel="external">cardorinteractive.itch.io</a></dd>
          </div>
        </dl>
      </IndexCard>
    </div>

    <div class="texts">
      <div data-sr style:--i="1" style:--reveal-tilt="2deg">
        <PaperSheet tone="paper" tilt={0.5} fastener="clip" as="section" class="presentation">
          <h2 id="long-title" class="sheet-title">Présentation</h2>
          <div class="prose">
            <p>
              Velmarche, octobre 1974. Vingt ans après la chute de la Régence, qui rayait des
              registres les citoyens jugés indésirables, une loi permet enfin de réinscrire ceux
              qu’on appelait les «&nbsp;absents&nbsp;». Rapporteur à l’Office de Réinscription
              civile, le joueur reçoit une succession à instruire : un arbre généalogique presque
              vide et des cartons d’archives.
            </p>
            <p>
              Lettres, actes, photographies de groupe, annuaires, cartes postales, articles de
              presse et un lecteur de fiches d’époque qui répond aux mots-clés : rien n’est imposé
              dans l’ordre. Le joueur tire le fil qu’il veut, note, épingle et recoupe, puis remplit
              chaque case de l’arbre (nom, visage, métier). Les réponses ne se valident que par
              groupes : on ne devine pas, on déduit.
            </p>
            <p>
              Une carte gravée et aquarellée du pays ouvre les archives de chaque lieu. Des secrets
              annexes changent le dénouement ; succès et mode chronométré invitent à rejouer.
            </p>
            <p>
              <em>L’Arbre aux absents</em> est développé par CM Interactive, écrit et illustré par CM
              Creative Lab, et édité par CARDOR Media.
            </p>
          </div>
        </PaperSheet>
      </div>

      <div data-sr style:--i="2">
        <Folder title="Contact presse" cote="ORC 74 · CONTACT" tone="manila" headingLevel={2}>
          <div class="contact">
            <p>
              Le contact presse sera publié ici à l’annonce de la date de sortie. Les demandes de
              clé de test ouvriront avec la démo.
            </p>
            <Stamp text="À venir" tone="ink" size="s" rotate={-8} />
          </div>
        </Folder>
      </div>

      <div class="kit" data-sr style:--i="3">
        <Button variant="secondary" href={resolve('charte/')} iconName="save"
          >Logos et charte</Button
        >
        <Button variant="ghost" href={resolve('artbook/')} iconName="photo">Planches</Button>
      </div>
    </div>
  </div>
</section>

<style>
  .pitch-block {
    position: relative;
    display: grid;
    gap: var(--space-4);
    padding-block: var(--space-4) var(--space-8);
  }
  .pitch {
    max-inline-size: 56rem;
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-weight: var(--weight-display);
    font-size: var(--step-3);
    line-height: var(--leading-snug);
    text-wrap: pretty;
  }
  .pitch em {
    font-style: italic;
    color: var(--brand);
  }
  .pitch-fern {
    color: var(--fern);
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    gap: var(--space-12);
    align-items: start;
  }
  dl {
    margin: 0;
  }
  .row {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    gap: var(--space-4);
    align-items: baseline;
  }
  /* Sur la réglure de la fiche : chaque ligne tient sur un pas (--rule-gap). */
  dt,
  dd {
    line-height: var(--rule-gap);
  }
  dt {
    font-family: var(--font-label);
    font-size: var(--step--1);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--brand);
  }
  dd {
    margin: 0;
    font-family: var(--font-type);
    color: var(--ink);
  }
  .texts {
    display: grid;
    gap: var(--space-12);
  }
  .sheet-title {
    margin-block-end: var(--space-4);
    font-size: var(--step-3);
  }
  :global(.presentation) .prose {
    color: var(--ink);
  }
  .contact {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-6);
  }
  .contact p {
    flex: 1 1 18rem;
    max-inline-size: var(--measure);
    font-family: var(--font-read);
  }
  .kit {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }
  @media (max-width: 63.9375rem) {
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
