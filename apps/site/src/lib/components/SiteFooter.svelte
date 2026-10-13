<!--
  Pied de page v2 (DESIGN §14.4, §11) : volute de fougère, crédits studio en Oswald, mention à
  la machine à écrire, signature CARDOR Media et ses divisions en monochrome, liens secondaires.
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import { Icon, Ornament } from '@arbre/ui';
  import { HOUSE_LOGOS } from '#lib/art/brand';
  import BrandLogo from './BrandLogo.svelte';
</script>

<footer class="site-footer">
  <div class="fern" aria-hidden="true"><Ornament name="fern" size="9rem" /></div>
  <div class="inner">
    <div class="sign">
      <p class="studios"><Icon name="fern" size="1.1rem" /> CM Interactive · CM Creative Lab</p>
      <p class="type">Velmarche, 1974 — un monde imaginaire</p>
    </div>
    <ul class="logos" aria-label="Une production CARDOR Media">
      {#each HOUSE_LOGOS as logo (logo.id)}
        <li>
          <BrandLogo {logo} />
          <span class="role">{logo.role}</span>
        </li>
      {/each}
    </ul>
    <nav class="links" aria-label="Pied de page">
      <a href={resolve('le-monde/')}>Le monde</a>
      <a href={resolve('artbook/')}>Artbook</a>
      <a href={resolve('presse/')}>Presse</a>
      <a href={resolve('charte/')}>Charte graphique</a>
      <a href={resolve('credits/')}>Crédits</a>
    </nav>
    <p class="legal">
      © 2026 CARDOR Media. « L’Arbre aux absents » est un jeu de CM Interactive, écrit et illustré
      par CM Creative Lab. Monde, lieux et personnages sont imaginaires.
    </p>
  </div>
</footer>

<style>
  .site-footer {
    margin-block-start: var(--space-20);
    /* Hors écran : ni mise en page ni logos (masques) chargés avant d'en approcher. */
    content-visibility: auto;
    contain-intrinsic-size: auto 24rem;
    color: var(--text-muted);
  }
  /* Filet coupé par une fronde de fougère. */
  .fern {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    max-inline-size: var(--container);
    margin-inline: auto;
    padding-inline: var(--gutter);
    color: var(--fern);
  }
  .fern::before,
  .fern::after {
    content: '';
    flex: 1;
    block-size: var(--border);
    background: var(--line);
  }
  .inner {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-8) var(--space-12);
    max-inline-size: var(--container);
    margin-inline: auto;
    padding: var(--space-10) var(--gutter) var(--space-10);
  }
  .sign {
    display: grid;
    gap: var(--space-2);
    align-content: start;
  }
  .studios {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-label);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--text);
  }
  .studios :global(svg) {
    color: var(--fern);
  }
  .type {
    font-family: var(--font-type);
    font-size: var(--step--1);
  }
  .logos {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--space-8);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .logos li {
    display: grid;
    justify-items: start;
    gap: var(--space-2);
  }
  .logos :global(.brand-logo) {
    block-size: var(--space-8);
    inline-size: auto;
  }
  .role {
    font-size: var(--step--1);
  }
  .links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-5);
    font-family: var(--font-label);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
  }
  .links a {
    display: inline-flex;
    align-items: center;
    min-block-size: var(--hit);
    text-decoration: none;
  }
  .links a:hover {
    text-decoration: underline;
  }
  .legal {
    grid-column: 1 / -1;
    max-inline-size: var(--measure);
    font-size: var(--step--1);
  }
  @media (max-width: 63.9375rem) {
    .inner {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
