<!--
  Métadonnées SEO et Open Graph d'une page, dans la langue de la page : URL canonique de la
  langue, `hreflang` vers chaque langue (x-default : le français, D8), `og:locale` et ses
  alternatives, données structurées (JSON-LD) avec `inLanguage`.
-->
<script lang="ts">
  import { page } from '$app/state';
  import type { ChromeStrings } from '#lib/i18n/index';
  import {
    OG_LOCALES,
    SITE_LOCALES,
    SOURCE_LOCALE,
    pagePath,
    type SitePath,
  } from '#lib/i18n/pages';
  import {
    OG_IMAGE,
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
    /** Page du site (slug commun aux langues, `''` pour l'accueil). */
    path: SitePath;
    /** Vidéo de la page (lecteur intégrable, `og:video`), 16:9. */
    video?: { embedUrl: string; width: number; height: number };
    /** Données structurées schema.org (JSON-LD), sérialisées dans un `<script>` de données. */
    jsonLd?: Record<string, unknown>;
  }

  let { title, description, path, video, jsonLd }: Props = $props();

  // Textes de l'habillage (load du layout) : pas de catalogue ici, Seo sert aussi la page hydratée.
  const t = $derived(page.data.chrome as ChromeStrings);
  const lang = $derived(t.lang);
  const abs = (p: string) => new URL(p, SITE_URL).href;
  const fullTitle = $derived(title === SITE_NAME ? title : `${title} · ${SITE_NAME}`);
  const url = $derived(abs(pagePath(lang, path)));
  const alternates = $derived(
    SITE_LOCALES.map((l) => ({ hreflang: l as string, href: abs(pagePath(l, path)) })).concat({
      hreflang: 'x-default',
      href: abs(pagePath(SOURCE_LOCALE, path)),
    }),
  );
  const image = abs(OG_IMAGE);
  /**
   * Données structurées : celles de la page (`jsonLd`) si elle en a, sinon la page elle-même
   * (WebPage du site). Toujours un seul bloc, avec `inLanguage` (une donnée propre peut le fixer).
   */
  const graph = $derived(
    jsonLd
      ? { inLanguage: lang, ...jsonLd }
      : {
          '@type': 'WebPage',
          name: fullTitle,
          description,
          url,
          inLanguage: lang,
          isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: abs('/') },
        },
  );
  // `<`, `>` et `&` échappés en \uXXXX : rien à échapper pour le HTML, aucune sortie de balise.
  const ldJson = $derived(
    JSON.stringify({ '@context': 'https://schema.org', ...graph }).replace(
      /[<>&]/g,
      (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`,
    ),
  );
</script>

<svelte:head>
  <title>{fullTitle}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={url} />
  {#each alternates as alt (alt.hreflang)}
    <link rel="alternate" hreflang={alt.hreflang} href={alt.href} />
  {/each}
  <meta property="og:type" content="website" />
  <meta property="og:locale" content={OG_LOCALES[lang]} />
  {#each SITE_LOCALES.filter((l) => l !== lang) as other (other)}
    <meta property="og:locale:alternate" content={OG_LOCALES[other]} />
  {/each}
  <meta property="og:site_name" content={SITE_NAME} />
  <meta property="og:title" content={fullTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={url} />
  <meta property="og:image" content={image} />
  <meta property="og:image:type" content={OG_IMAGE_TYPE} />
  <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
  <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
  <meta property="og:image:alt" content={t.ogImageAlt} />
  {#if video}
    <meta property="og:video" content={video.embedUrl} />
    <meta property="og:video:secure_url" content={video.embedUrl} />
    <meta property="og:video:type" content="text/html" />
    <meta property="og:video:width" content={String(video.width)} />
    <meta property="og:video:height" content={String(video.height)} />
  {/if}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content={image} />
  <meta name="twitter:image:alt" content={t.ogImageAlt} />
  <!-- svelte:element : un <script> écrit tel quel serait lu comme du JS par Prettier. -->
  <svelte:element this={"script"} type="application/ld+json">{ldJson}</svelte:element>
</svelte:head>
