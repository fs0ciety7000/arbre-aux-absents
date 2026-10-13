<!--
	Art clé (DESIGN.md §8.5) : « Le bureau sous la lampe », art/keyart/keyart-desk(-tall).svg.
	L'appli importe le SVG brut (`?raw`) et le passe dans `svg` : la primitive l'insère tel quel
	(class="art", jamais on-night : la nuit est peinte dedans), fond ses bords dans le bureau
	(`fade`) et anime ses groupes (`animate`, keyart.css). Nécessite <ArtDefs /> sur l'écran.
	Décor par défaut (aria-hidden) ; `label` en fait une image nommée.
	`fit` : cover (plein cadre, recadré) ou contain ; `anchor` : côté gardé au recadrage
	(start garde la lampe et la fenêtre, end la carte).
-->
<script lang="ts">
  interface Props {
    /** Balisage SVG brut de art/keyart (import `?raw`). Source de confiance du dépôt. */
    svg: string;
    animate?: boolean;
    /** Fondu des bords dans le bureau : aucun, tout autour, ou côté du menu. */
    fade?: 'none' | 'edges' | 'right' | 'bottom';
    fit?: 'cover' | 'contain';
    anchor?: 'start' | 'center' | 'end';
    label?: string;
    class?: string;
  }
  let {
    svg,
    animate = true,
    fade = 'edges',
    fit = 'cover',
    anchor = 'center',
    label,
    class: className = '',
  }: Props = $props();

  const ALIGN = { start: 'xMinYMid', center: 'xMidYMid', end: 'xMaxYMid' } as const;
  /** Recadrage : un SVG inline ignore object-fit, preserveAspectRatio s'en charge. */
  const markup = $derived(
    svg.replace(
      /<svg\b/,
      `<svg preserveAspectRatio="${ALIGN[anchor]} ${fit === 'cover' ? 'slice' : 'meet'}"`,
    ),
  );
</script>

<div
  class="keyart fade-{fade} fit-{fit} {className}"
  class:keyart-live={animate}
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- SVG du dépôt (art/keyart), vérifié par checkSvg -->
  {@html markup}
</div>

<style>
  .keyart {
    position: relative;
    overflow: hidden;
    background: var(--desk);
  }
  .keyart :global(> svg) {
    display: block;
    width: 100%;
    height: 100%;
  }
  .fit-cover :global(> svg) {
    position: absolute;
    inset: 0;
  }
  .fade-edges {
    mask-image:
      linear-gradient(to right, transparent, #000 9%, #000 91%, transparent),
      linear-gradient(to bottom, transparent, #000 7%, #000 88%, transparent);
    mask-composite: intersect;
  }
  .fade-right {
    mask-image: linear-gradient(to right, #000 52%, transparent 98%);
  }
  .fade-bottom {
    mask-image: linear-gradient(to bottom, #000 62%, transparent 99%);
  }
  @media (forced-colors: active) {
    .keyart {
      display: none;
    }
  }
</style>
