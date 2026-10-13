<!--
  Un logo de la maison, nommé pour les lecteurs d'écran (DESIGN §11).
  Monochrome (pied de page, crédits) : un masque CSS sur le fichier servi depuis /brand/, teinté
  par --text-muted (encre sur papier) ; la page ne porte plus les tracés (−25 Ko gzip par page).
  En couleur (Charte) : SVG inline, teintes via --logo-t1/t2/t3.
-->
<script lang="ts">
  import type { BrandLogo } from '#lib/art/brand';
  import { asset } from '$app/paths';
  import ArtSvg from '#lib/svg/ArtSvg.svelte';

  interface Props {
    logo: BrandLogo;
    /** Monochrome (masque), sauf sur la page Charte. */
    mono?: boolean;
    class?: string;
  }
  let { logo, mono = true, class: className = '' }: Props = $props();

  const ratio = $derived.by(() => {
    const vb = String(logo.node?.a.viewBox ?? '')
      .split(/[\s,]+/)
      .map(Number);
    const [, , w = 0, h = 0] = vb;
    return w > 0 && h > 0 ? `${w} / ${h}` : '1 / 1';
  });
</script>

{#if logo.node && mono}
  <span
    class="brand-logo brand-mask {className}"
    role="img"
    aria-label={logo.name}
    style:aspect-ratio={ratio}
    style:--logo-src="url({asset(`brand/${logo.id}.svg`)})"
  ></span>
{:else if logo.node}
  <ArtSvg node={logo.node} art={false} label={logo.name} class="brand-logo {className}" />
{:else}
  <span class="brand-logo brand-text {className}">{logo.name}</span>
{/if}

<style>
  .brand-mask {
    display: inline-block;
    background: var(--text-muted);
    -webkit-mask: var(--logo-src) center / contain no-repeat;
    mask: var(--logo-src) center / contain no-repeat;
  }
  :global([data-surface='paper']) .brand-mask {
    background: var(--ink);
  }
  @media (forced-colors: active) {
    .brand-mask {
      forced-color-adjust: none;
      background: CanvasText;
    }
  }
</style>
