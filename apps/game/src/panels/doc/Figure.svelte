<!--
  Figure d'un document : illustration SVG de l'affaire (`illustrations/<nom>.svg`), commune aux
  figures du corps (`![alt](…)`) et à l'illustration d'en-tête (`illustration: { file, alt }` du
  frontmatter). Le SVG vient du contenu compilé, chargé à la demande (un module par SVG, jamais
  de requête externe : CSP et Tauri hors ligne) et inséré sans `{@html}` (`svgContent`, nettoyé).
  - Chargement paresseux : rien n'est demandé tant que la figure n'approche pas de l'écran
    (sauf `eager`, pour la copie de la loupe) ; la place est réservée pendant ce temps.
  - Texte alternatif obligatoire : nom accessible de l'image ; en transcription ou si l'image
    manque, il est écrit en clair.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Loader } from '@arbre/ui';
  import { svgContent } from '@arbre/map/svelte';
  import { BODY_LABELS, type ReadMode } from './context';

  interface Props {
    asset: string;
    alt: string;
    mode: ReadMode;
    /** SVG de l'asset : `undefined` pendant le chargement, `null` si indisponible. */
    load: (asset: string) => string | null | undefined;
    /** Charge tout de suite (copie décorative de la loupe). */
    eager?: boolean;
    /** Illustration d'en-tête du document (frontmatter) plutôt qu'une figure du corps. */
    lead?: boolean;
    /** Légende (inlines) ; `captionPath` = `data-path` du conteneur (surlignages). */
    caption?: Snippet;
    captionPath?: string;
  }

  let {
    asset,
    alt,
    mode,
    load,
    eager = false,
    lead = false,
    caption,
    captionPath,
  }: Props = $props();

  // Sans IntersectionObserver (rendu serveur des tests, vieux moteurs) : chargement immédiat.
  let near = $state(typeof IntersectionObserver === 'undefined');
  const original = $derived(mode === 'original');
  const svg = $derived(original && (eager || near) ? load(asset) : undefined);

  /** Passe `near` à vrai quand la figure approche de la zone visible (une seule fois). */
  function lazy(node: HTMLElement) {
    if (eager || near) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          near = true;
          io.disconnect();
        }
      },
      { rootMargin: '25% 0px' },
    );
    io.observe(node);
    return { destroy: () => io.disconnect() };
  }
</script>

<figure class="doc-figure" class:lead data-asset={asset}>
  {#if original && svg}
    <div class="art-box" role="img" aria-label={alt} use:svgContent={svg}></div>
  {:else if original && svg === undefined}
    <div class="art-box loading" use:lazy>
      <Loader label={BODY_LABELS.imageLoading} />
    </div>
  {:else}
    <p class="figure-alt">
      <span class="caps">{BODY_LABELS.figure}</span>
      <span>{alt}</span>
      {#if original}<span class="figure-error">{BODY_LABELS.imageError}</span>{/if}
    </p>
  {/if}
  {#if caption}
    <figcaption data-path={captionPath}>{@render caption()}</figcaption>
  {/if}
</figure>

<style>
  .doc-figure {
    margin: 0;
    display: grid;
    gap: var(--space-2);
  }
  /* Illustration d'en-tête : tirage collé en tête de la pièce, sous le titre. */
  .doc-figure.lead {
    margin-block-end: var(--space-4);
  }
  .doc-figure.lead .art-box {
    padding: var(--space-2);
    box-shadow: var(--shadow-paper);
  }
  .art-box {
    inline-size: 100%;
    background: var(--surface-1);
    border-radius: var(--radius-paper);
  }
  .art-box.loading {
    display: grid;
    place-items: center;
    aspect-ratio: 4 / 3;
  }
  .art-box :global(svg) {
    display: block;
    inline-size: 100%;
    block-size: auto;
  }
  figcaption {
    font-style: italic;
    color: var(--text-muted);
  }
  .figure-alt {
    display: grid;
    gap: var(--space-1);
    margin: 0;
    padding: var(--space-3);
    border: var(--border) dashed var(--line-strong);
    border-radius: var(--radius-paper);
    font-style: italic;
  }
  .figure-alt .caps {
    font-style: normal;
    color: var(--text-muted);
  }
  .figure-error {
    font-style: normal;
    color: var(--danger);
    font-family: var(--font-ui);
    font-size: var(--step-0);
  }
</style>
