<!--
  Pied de page v2 (DESIGN §14.4, §11) : volute de fougère, crédits studio en Oswald, mention à
  la machine à écrire, signature CARDOR Media et ses divisions en monochrome, liens secondaires.
-->
<script lang="ts">
  import { Icon, Ornament } from '@arbre/ui';
  import { houseLogos } from '#lib/art/brand';
  import { resolve } from '$app/paths';
  import { localPath } from '#lib/i18n/app';
  import type { ChromeStrings } from '#lib/i18n/index';
  import Rich from '#lib/i18n/Rich.svelte';
  import BrandLogo from './BrandLogo.svelte';

  /** Textes de l'habillage (load du layout). */
  let { t }: { t: ChromeStrings } = $props();
  const lang = $derived(t.lang);
  const links = [
    'le-monde/',
    'artbook/',
    'presse/',
    'charte/',
    'credits/',
    'signaler/',
    'problemes-connus/',
    'tickets/',
    'confidentialite/',
  ] as const;
</script>

<footer class="site-footer">
  <div class="fern" aria-hidden="true"><Ornament name="fern" size="9rem" /></div>
  <div class="inner">
    <div class="sign">
      <p class="studios"><Icon name="fern" size="1.1rem" /> CM Interactive · CM Creative Lab</p>
      <p class="type">{t.footer.tagline}</p>
    </div>
    <ul class="logos" aria-label={t.footer.logos}>
      {#each houseLogos(t.brand) as logo (logo.id)}
        <li>
          <BrandLogo {logo} />
          <span class="role">{logo.role}</span>
        </li>
      {/each}
    </ul>
    <nav class="links" aria-label={t.footer.nav}>
      {#each links as link (link)}
        <a href={resolve(localPath(lang, link))}>{t.footer.links[link]}</a>
      {/each}
    </nav>
    <p class="legal"><Rich text={t.footer.legal} /></p>
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
