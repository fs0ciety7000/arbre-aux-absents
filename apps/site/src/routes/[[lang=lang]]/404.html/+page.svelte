<!--
  404 v2 : le registre cadenassé (vignette d'aquarelle) tamponné « Introuvable », titre d'affiche
  et retour à l'accueil. Servie par nginx pour toute adresse inconnue ; prérendue, sans JS.
-->
<script lang="ts">
  import { Button, Stamp } from '@arbre/ui';
  import { STRINGS } from '#lib/i18n/index';
  import { currentLang, localHref } from '#lib/i18n/app';
  import Rich from '#lib/i18n/Rich.svelte';
  import { SITE_NAME } from '#lib/site';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const lang = $derived(currentLang());
  const t = $derived(STRINGS[lang]);
</script>

<svelte:head>
  <title>{t.notFound.title} · {SITE_NAME}</title>
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
      text={t.notFound.stamp}
      tone="danger"
      size="m"
      rotate={-12}
      animate
      delay={3}
      class="lost-stamp"
    />
  </div>
  <div class="copy">
    <p class="kicker">{t.notFound.kicker}</p>
    <h1><Rich text={t.notFound.heading} /></h1>
    <p class="lede">{t.notFound.lede}</p>
    <div class="actions">
      <Button variant="primary" size="l" href={localHref(lang, '')} iconName="back"
        >{t.common.backHome}</Button
      >
      <Button variant="secondary" size="l" href={localHref(lang, 'le-monde/')} iconName="map"
        >{t.common.exploreMap}</Button
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
  h1 :global(em) {
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
