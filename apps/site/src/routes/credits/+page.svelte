<script lang="ts">
  import { HOUSE_LOGOS } from '#lib/art/brand';
  import BrandLogo from '#lib/components/BrandLogo.svelte';
  import Seo from '#lib/components/Seo.svelte';
  import ArtSvg from '#lib/svg/ArtSvg.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const divisions: Record<string, string[]> = {
    'cardor-monogram': ['Édition', 'Production'],
    interactive: [
      'Développement du jeu',
      'Game design et level design',
      'Interface et système de design',
      'Site vitrine',
    ],
    creative: [
      'Scénario et monde de la Velmarche',
      'Documents d’archives',
      'Portraits et illustrations',
      'Carte gravée et aquarellée',
    ],
  };

  const fonts = [
    'Literata',
    'Instrument Sans',
    'Courier Prime',
    'Caveat',
    'Atkinson Hyperlegible Next',
  ];
  const tools = ['Svelte et SvelteKit', 'Vite', 'Tauri', 'TypeScript', 'zod', 'svgo'];
</script>

<Seo
  title="Crédits"
  description="Crédits de L’Arbre aux absents : CARDOR Media, CM Interactive et CM Creative Lab, polices et outils libres."
  path="/credits/"
/>

<div class="container page-head">
  <p class="kicker">Crédits</p>
  <h1>Une production CARDOR Media</h1>
  <p class="lede">
    <span class="title">L’Arbre aux absents</span> est imaginé, écrit, dessiné et développé par les divisions
    de CARDOR Media.
  </p>
</div>

<section class="container" aria-labelledby="maison-title">
  <h2 id="maison-title" class="visually-hidden">La maison</h2>
  <div class="emblem-row">
    {#if data.emblem?.node}
      <ArtSvg node={data.emblem.node} art={false} label="CARDOR Media" class="emblem logo-mono" />
    {/if}
    <p>
      CARDOR Media réunit des studios de création : jeux, écriture, illustration. Chaque division
      signe ici sa part du travail.
    </p>
  </div>

  <ul class="divisions">
    {#each HOUSE_LOGOS as logo (logo.id)}
      <li>
        <BrandLogo {logo} />
        <h3>{logo.name}</h3>
        <ul class="roles">
          {#each divisions[logo.id] ?? [] as role (role)}<li>{role}</li>{/each}
        </ul>
      </li>
    {/each}
  </ul>
</section>

<section class="band" aria-labelledby="libres-title">
  <div class="container libres">
    <div>
      <h2 id="libres-title">Polices</h2>
      <p class="muted">Sous licence SIL Open Font License 1.1, merci à leurs auteurs.</p>
      <ul class="tags">
        {#each fonts as f (f)}<li>{f}</li>{/each}
      </ul>
    </div>
    <div>
      <h2>Outils libres</h2>
      <p class="muted">Le jeu et ce site reposent sur des logiciels libres.</p>
      <ul class="tags">
        {#each tools as t (t)}<li>{t}</li>{/each}
      </ul>
    </div>
  </div>
</section>

<section class="container-narrow notice" aria-labelledby="fiction-title">
  <h2 id="fiction-title">Avertissement</h2>
  <p>
    La Velmarche, ses villes, ses institutions, ses journaux et ses habitants sont imaginaires.
    Toute ressemblance avec des personnes ou des lieux existants serait fortuite.
  </p>
</section>

<style>
  .title {
    font-style: italic;
  }
  .emblem-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-8);
    padding-block-end: var(--space-10);
    border-block-end: var(--border) solid var(--line);
  }
  .emblem-row p {
    max-inline-size: var(--measure);
    font-family: var(--font-read);
    font-size: var(--step-read);
    line-height: var(--leading-read);
    flex: 1 1 20rem;
  }
  .emblem-row :global(.emblem) {
    block-size: var(--space-24);
    inline-size: auto;
  }
  .divisions {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-8);
    margin: var(--space-10) 0 0;
    padding: 0;
    list-style: none;
  }
  .divisions > li {
    display: grid;
    align-content: start;
    justify-items: start;
    gap: var(--space-3);
    padding: var(--space-8) var(--space-6);
    border-radius: var(--radius-l);
    background: var(--surface-1);
    box-shadow: var(--shadow-1);
  }
  .divisions :global(.brand-logo) {
    block-size: var(--space-12);
    inline-size: auto;
    margin-block-end: var(--space-3);
  }
  .divisions h3 {
    font-size: var(--step-2);
  }
  .roles {
    display: grid;
    gap: var(--space-1);
    padding-inline-start: var(--space-5);
    color: var(--text-muted);
  }
  .libres {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-10);
  }
  .libres h2 {
    font-size: var(--step-2);
  }
  .muted {
    margin-block: var(--space-2) var(--space-4);
    color: var(--text-muted);
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .tags li {
    padding: var(--space-1) var(--space-3);
    border: var(--border) solid var(--line-strong);
    border-radius: var(--radius-pill);
    font-size: var(--step--1);
  }
  .notice {
    padding-block: var(--space-4);
  }
  .notice h2 {
    font-size: var(--step-1);
    margin-block-end: var(--space-2);
  }
  .notice p {
    color: var(--text-muted);
  }
  @media (max-width: 79.9375rem) {
    .divisions {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (max-width: 37.4375rem) {
    .libres {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
