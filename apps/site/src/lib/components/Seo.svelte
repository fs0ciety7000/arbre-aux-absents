<!-- Métadonnées SEO et Open Graph d'une page. -->
<script lang="ts">
  import {
    OG_IMAGE,
    OG_IMAGE_ALT,
    OG_IMAGE_HEIGHT,
    OG_IMAGE_TYPE,
    OG_IMAGE_WIDTH,
    SITE_NAME,
    SITE_URL,
  } from '#lib/site';

  interface Props {
    /** Titre de la page (sans le nom du site, sauf à l'accueil). */
    title: string;
    description: string;
    /** Chemin canonique, avec la barre finale (`/le-monde/`). */
    path: string;
    /** Vidéo de la page (lecteur intégrable, `og:video`), 16:9. */
    video?: { embedUrl: string; width: number; height: number };
    /** Données structurées schema.org (JSON-LD), sérialisées dans un `<script>` de données. */
    jsonLd?: Record<string, unknown>;
  }

  let { title, description, path, video, jsonLd }: Props = $props();

  const fullTitle = $derived(title === SITE_NAME ? title : `${title} · ${SITE_NAME}`);
  const url = $derived(new URL(path, SITE_URL).href);
  const image = new URL(OG_IMAGE, SITE_URL).href;
  // `<`, `>` et `&` échappés en \uXXXX : rien à échapper pour le HTML, aucune sortie de balise.
  const ldJson = $derived(
    jsonLd
      ? JSON.stringify({ '@context': 'https://schema.org', ...jsonLd }).replace(
          /[<>&]/g,
          (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`,
        )
      : '',
  );
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
  <meta property="og:image:type" content={OG_IMAGE_TYPE} />
  <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
  <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
  <meta property="og:image:alt" content={OG_IMAGE_ALT} />
  {#if video}
    <meta property="og:video" content={video.embedUrl} />
    <meta property="og:video:secure_url" content={video.embedUrl} />
    <meta property="og:video:type" content="text/html" />
    <meta property="og:video:width" content={String(video.width)} />
    <meta property="og:video:height" content={String(video.height)} />
  {/if}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content={image} />
  <meta name="twitter:image:alt" content={OG_IMAGE_ALT} />
  {#if ldJson}
    <!-- svelte:element : un <script> écrit tel quel serait lu comme du JS par Prettier. -->
    <svelte:element this={"script"} type="application/ld+json">{ldJson}</svelte:element>
  {/if}
</svelte:head>
