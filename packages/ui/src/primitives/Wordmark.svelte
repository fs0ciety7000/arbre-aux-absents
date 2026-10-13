<!--
	Titre du jeu (DESIGN.md §4.3, §13.1) : « L'Arbre aux absents » en Fraunces très douce et
	bancale, « aux » en italique vermillon, volute de fougère dessous, surtitre à l'étiqueteuse.
	`size` : `hero` (écran titre, site), `title` (titres d'écran), `header` (en-têtes, 1 ligne).
	`animate` : les mots s'encrent l'un après l'autre (flou → net), la volute se dessine, et
	un halo de lampe vacille derrière le titre (boucle d'ambiance, coupée en mouvement réduit).
	Le texte est réel : `headingLevel` en fait un vrai titre (déf. 1) ; `as="p"` sinon.
-->
<script lang="ts">
  import Ornament from './Ornament.svelte';
  import InkReveal from './InkReveal.svelte';

  interface Props {
    size?: 'hero' | 'title' | 'header';
    headingLevel?: 1 | 2;
    as?: 'heading' | 'p' | 'span';
    kicker?: string;
    tagline?: string;
    animate?: boolean;
    /** Halo de lampe qui vacille derrière le titre. */
    glow?: boolean;
    align?: 'start' | 'center';
    class?: string;
  }
  let {
    size = 'hero',
    headingLevel = 1,
    as = 'heading',
    kicker,
    tagline,
    animate = false,
    glow = false,
    align = 'start',
    class: className = '',
  }: Props = $props();
  const tag = $derived(as === 'heading' ? `h${headingLevel}` : as);
</script>

<div class="wordmark {size} align-{align} {className}">
  {#if glow}<span class="halo mv-flicker" aria-hidden="true"></span>{/if}
  {#if kicker && size !== 'header'}
    <p class="kick mat-label red" class:mv-stamp={animate} style:--i="0">{kicker}</p>
  {/if}
  <svelte:element this={tag} class="name" aria-label="L’Arbre aux absents">
    <span class="w" class:mv-ink={animate} style:--i="1" aria-hidden="true">L’Arbre</span>
    <span class="w aux" class:mv-ink={animate} style:--i="2" aria-hidden="true">aux</span>
    <span class="w" class:mv-ink={animate} style:--i="3" aria-hidden="true">absents</span>
  </svelte:element>
  {#if size !== 'header'}
    <div class="flourish">
      {#if animate}
        <InkReveal index={2}><Ornament name="flourish" size="100%" weight={1.5} /></InkReveal>
      {:else}
        <Ornament name="flourish" size="100%" weight={1.5} />
      {/if}
    </div>
  {/if}
  {#if tagline && size !== 'header'}
    <p class="tagline" class:mv-rise={animate} style:--i="6">{tagline}</p>
  {/if}
</div>

<style>
  .wordmark {
    position: relative;
    isolation: isolate;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
    color: var(--text);
  }
  .align-center {
    align-items: center;
    text-align: center;
  }
  .halo {
    position: absolute;
    z-index: -1;
    inset: -30% -20%;
    background: radial-gradient(closest-side, var(--lamp-pool), transparent);
    pointer-events: none;
  }
  .name {
    margin: 0;
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-weight: var(--weight-display-black);
    line-height: var(--leading-display);
    letter-spacing: var(--tracking-display);
    text-wrap: balance;
  }
  .w {
    display: inline-block;
  }
  .aux {
    font-style: italic;
    font-weight: var(--weight-display);
    color: var(--brand);
    padding-inline: 0.04em 0.1em;
  }
  .hero .name {
    font-size: var(--step-6);
  }
  .title .name {
    font-size: var(--step-5);
  }
  .header .name {
    font-size: var(--step-1);
    font-weight: var(--weight-display);
    white-space: nowrap;
    letter-spacing: var(--tracking-tight);
  }
  .header .aux {
    font-weight: var(--weight-medium);
  }
  .flourish {
    width: min(100%, 22rem);
    color: var(--fern);
    margin-block-start: calc(var(--space-2) * -1);
  }
  .title .flourish {
    width: min(100%, 16rem);
  }
  .tagline {
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-style: italic;
    font-weight: 400;
    font-size: var(--step-2);
    color: var(--text-muted);
    max-width: 30ch;
    line-height: var(--leading-snug);
  }
  .kick {
    transform: rotate(-2deg);
  }
</style>
