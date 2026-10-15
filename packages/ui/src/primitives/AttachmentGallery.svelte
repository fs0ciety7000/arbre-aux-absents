<!--
	Captures jointes à un signalement, en lecture (DESIGN.md §9.38) : vignettes « photo
	d'archive » ; activation = la capture agrandie dans une `Dialog`. Image injoignable (hors
	ligne, lien expiré) : vignette vide et « Image indisponible », sans casser la fiche.
-->
<script lang="ts">
  import { getUiStrings } from '../i18n';
  import Dialog from './Dialog.svelte';
  import Icon from './Icon.svelte';
  import type { GalleryImage } from '../attachments';

  interface Props {
    images: GalleryImage[];
    /** Titre de la boîte agrandie (« AA-0042 »…), avant le numéro de la capture. */
    title?: string;
    headingLevel?: 2 | 3;
    surface?: 'desk' | 'paper';
  }

  let { images, title, headingLevel = 3, surface = 'paper' }: Props = $props();
  const ui = getUiStrings();
  const t = $derived(ui.gallery);

  let current = $state<number | null>(null);
  let open = $state(false);
  let broken = $state<Record<number, boolean>>({});

  function show(i: number) {
    current = i;
    open = true;
  }
</script>

<section class="gallery">
  <svelte:element this={`h${headingLevel}`} class="heading">{t.label}</svelte:element>
  <ul class="tiles">
    {#each images as image, i (image.url)}
      <li class="tile">
        <button type="button" class="thumb" aria-label={t.open(i + 1)} onclick={() => show(i)}>
          {#if broken[i]}
            <span class="broken"><Icon name="photo" size="1.5rem" /> {t.broken}</span>
          {:else}
            <img
              src={image.url}
              alt={t.alt(i + 1)}
              width={image.width}
              height={image.height}
              loading="lazy"
              decoding="async"
              referrerpolicy="no-referrer"
              onerror={() => (broken = { ...broken, [i]: true })}
            />
          {/if}
        </button>
      </li>
    {/each}
  </ul>
</section>

{#if current !== null}
  {@const image = images[current]}
  <Dialog
    bind:open
    title={title ? `${title} · ${t.alt(current + 1)}` : t.alt(current + 1)}
    {surface}
    size="l"
    mobile="fullscreen"
    onclose={() => (current = null)}
  >
    {#if image && !broken[current]}
      <img
        class="large"
        src={image.url}
        alt={t.alt(current + 1)}
        width={image.width}
        height={image.height}
        referrerpolicy="no-referrer"
      />
    {:else}
      <p class="broken">{t.broken}</p>
    {/if}
  </Dialog>
{/if}

<style>
  .gallery {
    display: grid;
    gap: var(--space-3);
    min-inline-size: 0;
  }
  .heading {
    margin: 0;
    font-family: var(--font-label);
    font-weight: var(--weight-medium);
    font-size: var(--step-0);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 8rem), 1fr));
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .tile {
    min-inline-size: 0;
    transform: rotate(-0.6deg);
  }
  .tile:nth-child(even) {
    transform: rotate(0.6deg);
  }
  .thumb {
    display: block;
    inline-size: 100%;
    aspect-ratio: 4 / 3;
    padding: var(--space-1);
    overflow: hidden;
    border: var(--border) solid var(--line);
    border-radius: var(--radius-xs);
    background: var(--surface-1);
    box-shadow: var(--shadow-1);
    cursor: zoom-in;
    transition: transform var(--dur-fast) var(--ease-snap);
  }
  .thumb:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-2);
  }
  .thumb:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
  .thumb img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
    border-radius: var(--radius-xs);
  }
  .broken {
    display: grid;
    place-items: center;
    gap: var(--space-1);
    block-size: 100%;
    margin: 0;
    font-size: var(--step--1);
    color: var(--text-muted);
  }
  .large {
    display: block;
    max-inline-size: 100%;
    block-size: auto;
    max-block-size: 70vh;
    margin-inline: auto;
    object-fit: contain;
    border: var(--border) solid var(--line);
    border-radius: var(--radius-xs);
  }
  @media (prefers-reduced-motion: reduce) {
    .thumb {
      transition: none;
    }
  }
</style>
