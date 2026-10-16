<!--
  Les affaires du jeu (accueil, presse) : une chemise kraft ou manille par dossier (Folder, DESIGN
  §6.2), cote du dossier à l'étiqueteuse, lieu et date tapés, accroche de la lettre de mission, puis
  chiffres et durée. L'affaire récente porte une étiquette rouge « Nouveau · 1.5 ». Statique (aucune
  chemise n'est un contrôle : le choix se fait dans le jeu). Texte : situation de départ seulement.
-->
<script lang="ts">
  import { DymoLabel, Folder, Icon } from '@arbre/ui';
  import { SITE_CASES } from '#lib/content/cases';
  import Rich from '#lib/i18n/Rich.svelte';
  import type { SiteStrings } from '#lib/i18n/index';

  interface Props {
    strings: SiteStrings['cases'];
    /** Id du titre de section (unique dans la page). */
    headingId?: string;
  }
  let { strings: c, headingId = 'affaires-title' }: Props = $props();

  const cases = $derived(SITE_CASES.map((meta, i) => ({ meta, text: c.items[i]! })));
</script>

<section class="band" aria-labelledby={headingId}>
  <div class="container">
    <div class="section-head center" data-sr>
      <p class="kicker">{c.kicker}</p>
      <h2 id={headingId} class="section-title"><Rich text={c.title} /></h2>
      <p class="lede">{c.lede}</p>
    </div>
    <ul class="cases" aria-label={c.listLabel}>
      {#each cases as { meta, text }, i (meta.id)}
        <li data-sr style:--i={i}>
          <Folder
            id="affaire-{meta.id}"
            title={text.title}
            cote={c.file(meta.file)}
            tone={i % 2 ? 'manila' : 'kraft'}
            headingLevel={3}
            class="case"
          >
            <!-- Onglet court (« Affaire 1 ») : le titre entier, trop long pour un onglet, est le
                 titre caché de la chemise (h3) et s'affiche en tête du contenu. -->
            {#snippet tabs()}
              <span class="case-tab" aria-hidden="true">{c.tab(i + 1)}</span>
            {/snippet}
            <div class="case-body">
              <p class="case-title" aria-hidden="true">{text.title}</p>
              <p class="when">{text.when}</p>
              <p class="pitch">{text.text}</p>
              <p class="stats">
                <span class="num">{c.stats(meta.slots, meta.documents, meta.endings)}</span>
                <span class="duration"
                  ><Icon name="clock" size="1rem" />
                  {text.duration}</span
                >
              </p>
              {#if meta.since}
                <DymoLabel text={c.newLabel(meta.since)} tone="red" tilt={-1.5} class="new" />
              {/if}
            </div>
          </Folder>
        </li>
      {/each}
    </ul>
  </div>
</section>

<style>
  .cases {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(19rem, 100%), 1fr));
    gap: var(--space-10) var(--space-6);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .cases li {
    display: grid;
  }
  .cases :global(.case) {
    block-size: 100%;
  }
  .case-body {
    display: grid;
    align-content: start;
    gap: var(--space-4);
    block-size: 100%;
    padding: var(--space-3) var(--space-1) var(--space-1);
  }
  /* Onglet de chemise (même matière que l'onglet de Folder, DESIGN §6.2). */
  .case-tab {
    display: inline-block;
    margin-inline: var(--space-1);
    padding: var(--space-2) var(--space-5) var(--space-1);
    background: var(--folder-bg);
    border-radius: var(--radius-tab) var(--radius-tab) 0 0;
    box-shadow: inset 0 1px 0 var(--edge-light);
    font-family: var(--font-label);
    font-size: var(--step-0);
    font-weight: var(--weight-semibold);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    line-height: 1.2;
  }
  .case-title {
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-weight: var(--weight-display);
    font-size: var(--step-2);
    line-height: var(--leading-snug);
    color: var(--ink);
    text-wrap: balance;
  }
  .when {
    font-family: var(--font-type);
    font-size: var(--step--1);
    color: var(--ink-muted);
  }
  .pitch {
    font-family: var(--font-read);
    line-height: var(--leading-read);
    color: var(--ink);
    text-wrap: pretty;
  }
  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-4);
    align-self: end;
    font-family: var(--font-type);
    font-size: var(--step--1);
    color: var(--ink-muted);
  }
  .duration {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
  }
  .case-body :global(.new) {
    justify-self: start;
  }
</style>
