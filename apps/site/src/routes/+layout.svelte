<script lang="ts">
  import '@arbre/ui/styles/index.css';
  import '#lib/styles/site.css';
  import { ArtDefs, SkipLink } from '@arbre/ui';
  import type { Snippet } from 'svelte';
  import literata from '@arbre/ui/fonts/literata-latin-opsz-normal.woff2?url';
  import instrument from '@arbre/ui/fonts/instrument-sans-latin-wght-normal.woff2?url';
  import SiteFooter from '#lib/components/SiteFooter.svelte';
  import SiteHeader from '#lib/components/SiteHeader.svelte';

  let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
  <!-- Les deux seuls préchargements autorisés (DESIGN §4). -->
  <link rel="preload" as="font" type="font/woff2" href={instrument} crossorigin="anonymous" />
  <link rel="preload" as="font" type="font/woff2" href={literata} crossorigin="anonymous" />
</svelte:head>

<!-- Motifs de gravure (#art-hatch…) partagés par la carte et les portraits : une fois par page. -->
<ArtDefs />
<SkipLink href="#contenu" label="Aller au contenu" />
<SiteHeader />
<main id="contenu" tabindex="-1">
  {@render children()}
</main>
<SiteFooter />

<style>
  main:focus {
    outline: none;
  }
</style>
