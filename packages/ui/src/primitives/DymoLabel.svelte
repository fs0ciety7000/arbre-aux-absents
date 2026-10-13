<!--
	Étiquette d'étiqueteuse à relief (DESIGN.md §6.6) : bande plastique bleue ou rouge,
	capitales embossées. Cotes de dossier, noms de tiroirs, intitulés de cases.
	Texte réel (lu par les lecteurs d'écran), jamais seul porteur d'une information d'état.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    text?: string;
    tone?: 'blue' | 'red';
    /** Légère inclinaison en degrés (collée à la main). */
    tilt?: number;
    children?: Snippet;
    class?: string;
  }
  let { text, tone = 'blue', tilt = 0, children, class: className = '' }: Props = $props();
</script>

<span
  class="mat-label {className}"
  class:red={tone === 'red'}
  style:transform={tilt ? `rotate(${tilt}deg)` : undefined}
  >{#if children}{@render children()}{:else}{text}{/if}</span
>
