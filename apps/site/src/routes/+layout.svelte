<script lang="ts">
  import '@arbre/ui/styles/index.css';
  import '#lib/styles/site.css';
  import { ArtDefs, SkipLink, UI_STRINGS, setUiStrings } from '@arbre/ui';
  import type { Snippet } from 'svelte';
  import instrument from '@arbre/ui/fonts/instrument-sans-latin-wght-normal.woff2?url';
  import SiteFooter from '#lib/components/SiteFooter.svelte';
  import SiteHeader from '#lib/components/SiteHeader.svelte';
  import type { LayoutProps } from './$types';

  let { data, children }: LayoutProps & { children: Snippet } = $props();

  // Textes des primitives (@arbre/ui) dans la langue de la page (DESIGN §4.4).
  setUiStrings(() => UI_STRINGS[data.chrome.lang]);

  // Pages hydratées : passer de /en/le-monde/ à /le-monde/ (sélecteur de langue) est une
  // navigation côté client, sans nouveau `<html lang>` du serveur ; on le tient à jour ici.
  $effect(() => {
    document.documentElement.lang = data.chrome.lang;
  });
</script>

<svelte:head>
  <!-- DESIGN §4 autorise deux préchargements (interface, titrage). Le site n'en garde qu'un :
       Fraunces (121 Ko) disputait la bande passante à l'art clé, LCP mobile ; il arrive en swap. -->
  <link rel="preload" as="font" type="font/woff2" href={instrument} crossorigin="anonymous" />
</svelte:head>

<!-- Motifs de gravure (#art-hatch…) partagés par l'art inline : une fois par page. -->
<ArtDefs />
<SkipLink href="#contenu" />
<SiteHeader t={data.chrome} />
<main id="contenu" tabindex="-1">
  {@render children()}
</main>
<SiteFooter t={data.chrome} />

<style>
  main:focus {
    outline: none;
  }
</style>
