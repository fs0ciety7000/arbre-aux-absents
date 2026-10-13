<script lang="ts">
  import '@arbre/ui/styles/index.css';
  import '#lib/styles/site.css';
  import { ArtDefs, SkipLink } from '@arbre/ui';
  import type { Snippet } from 'svelte';
  import instrument from '@arbre/ui/fonts/instrument-sans-latin-wght-normal.woff2?url';
  import SiteFooter from '#lib/components/SiteFooter.svelte';
  import SiteHeader from '#lib/components/SiteHeader.svelte';

  let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
  <!-- DESIGN §4 autorise deux préchargements (interface, titrage). Le site n'en garde qu'un :
       Fraunces (121 Ko) disputait la bande passante à l'art clé, LCP mobile ; il arrive en swap. -->
  <link rel="preload" as="font" type="font/woff2" href={instrument} crossorigin="anonymous" />
</svelte:head>

<!-- Motifs de gravure (#art-hatch…) partagés par l'art inline : une fois par page. -->
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
