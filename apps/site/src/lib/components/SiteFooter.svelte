<!-- Pied de page : signature CARDOR Media et ses divisions (DESIGN §11), liens secondaires. -->
<script lang="ts">
  import { resolve } from '$app/paths';
  import { HOUSE_LOGOS } from '#lib/art/brand';
  import BrandLogo from './BrandLogo.svelte';
</script>

<footer class="site-footer">
  <div class="inner">
    <ul class="logos" aria-label="Une production CARDOR Media">
      {#each HOUSE_LOGOS as logo (logo.id)}
        <li>
          <BrandLogo {logo} />
          <span class="role">{logo.role}</span>
        </li>
      {/each}
    </ul>
    <nav class="links" aria-label="Pied de page">
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
    margin-block-start: var(--space-16);
    border-block-start: var(--border) solid var(--line);
    background: var(--surface-1);
    color: var(--text-muted);
  }
  .inner {
    display: grid;
    gap: var(--space-8);
    max-inline-size: var(--container);
    margin-inline: auto;
    padding: var(--space-12) var(--gutter) var(--space-10);
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
    /* Zone de protection : ½ hauteur du logo (DESIGN §11). */
    padding: var(--space-5) var(--space-5) 0 0;
  }
  .logos :global(.brand-logo) {
    block-size: var(--space-10);
    inline-size: auto;
  }
  .role {
    font-size: var(--step--1);
  }
  .links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-4);
  }
  .links a {
    display: inline-flex;
    align-items: center;
    min-block-size: var(--hit);
  }
  .legal {
    max-inline-size: var(--measure);
    font-size: var(--step--1);
  }
</style>
