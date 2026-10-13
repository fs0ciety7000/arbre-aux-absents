<!-- Métadonnées SEO et Open Graph d'une page. -->
<script lang="ts">
  import { OG_IMAGE, SITE_NAME, SITE_URL } from '#lib/site';

  interface Props {
    /** Titre de la page (sans le nom du site, sauf à l'accueil). */
    title: string;
    description: string;
    /** Chemin canonique, avec la barre finale (`/le-monde/`). */
    path: string;
  }

  let { title, description, path }: Props = $props();

  const fullTitle = $derived(title === SITE_NAME ? title : `${title} · ${SITE_NAME}`);
  const url = $derived(new URL(path, SITE_URL).href);
  const image = new URL(OG_IMAGE, SITE_URL).href;
</script>

<svelte:head>
  <title>{fullTitle}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={url} />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="fr_FR" />
  <meta property="og:site_name" content={SITE_NAME} />
  <meta property="og:title" content={fullTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={url} />
  <meta property="og:image" content={image} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta
    property="og:image:alt"
    content="La carte gravée et aquarellée de la Velmarche, sous le titre L’Arbre aux absents."
  />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>
