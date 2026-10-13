<!-- Un logo de la maison, inline (teintes via --logo-t1/t2/t3), nommé pour les lecteurs d'écran. -->
<script lang="ts">
  import type { BrandLogo } from '#lib/art/brand';
  import ArtSvg from '#lib/svg/ArtSvg.svelte';

  interface Props {
    logo: BrandLogo;
    /** Monochrome vélin (`.logo-mono`), sauf sur la page Charte. */
    mono?: boolean;
    class?: string;
  }
  let { logo, mono = true, class: className = '' }: Props = $props();
</script>

{#if logo.node}
  <ArtSvg
    node={logo.node}
    art={false}
    label={logo.name}
    class="brand-logo {mono ? 'logo-mono' : ''} {className}"
  />
{:else}
  <span class="brand-logo brand-text {className}">{logo.name}</span>
{/if}
