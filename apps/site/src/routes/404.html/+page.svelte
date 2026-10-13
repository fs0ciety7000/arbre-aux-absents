<!--
  404 v2 : le registre cadenassé (vignette d'aquarelle) tamponné « Introuvable », titre d'affiche
  et retour à l'accueil. Servie par nginx pour toute adresse inconnue ; prérendue, sans JS.
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import { Button, Stamp } from '@arbre/ui';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>Page introuvable · L’Arbre aux absents</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="container lost">
  <div class="art">
    <img
      class="art-img mv-rise"
      src={data.spot.src}
      width={data.spot.width}
      height={data.spot.height}
      alt=""
      decoding="async"
    />
    <Stamp
      text="Introuvable"
      tone="danger"
      size="m"
      rotate={-12}
      animate
      delay={3}
      class="lost-stamp"
    />
  </div>
  <div class="copy">
    <p class="kicker">Erreur 404</p>
    <h1>Cette page est <em>absente des registres</em></h1>
    <p class="lede">L’adresse demandée n’existe pas, ou plus. Le reste du dossier vous attend.</p>
    <div class="actions">
      <Button variant="primary" size="l" href={resolve('/')} iconName="back"
        >Retour à l’accueil</Button
      >
      <Button variant="secondary" size="l" href={resolve('le-monde/')} iconName="map"
        >Explorer la carte</Button
      >
    </div>
  </div>
</div>

<style>
  .lost {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    align-items: center;
    gap: var(--space-12);
    padding-block: var(--space-20) var(--space-12);
  }
  .art {
    position: relative;
  }
  .art :global(.lost-stamp) {
    position: absolute;
    inset-block-end: 12%;
    inset-inline-end: 4%;
  }
  .copy {
    display: grid;
    justify-items: start;
    gap: var(--space-5);
  }
  h1 {
    font-weight: var(--weight-display-black);
    font-size: var(--step-5);
    line-height: var(--leading-display);
    letter-spacing: var(--tracking-display);
    text-wrap: balance;
  }
  h1 em {
    font-style: italic;
    font-weight: var(--weight-display);
    color: var(--brand);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }
  @media (max-width: 47.4375rem) {
    .lost {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-6);
      padding-block-start: var(--space-10);
    }
    .art {
      inline-size: min(18rem, 80%);
    }
  }
</style>
