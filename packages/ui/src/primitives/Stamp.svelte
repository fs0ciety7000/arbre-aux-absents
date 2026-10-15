<!--
	Tampon (DESIGN.md §9.15) : « Établi » sur les cases verrouillées, « Classé », « Confidentiel »
	sur les documents. Encre irrégulière (masque), double cadre, légère rotation.
	`animate` : le tampon frappe (scale + opacité) ; `delay` en multiples de --stagger
	pour la cascade de verrouillage (120 ms entre cases).
	En mouvement réduit : simple fondu de 100 ms, sans secousse.
-->
<script lang="ts">
  import { getUiStrings } from '../i18n';
  import type { Snippet } from 'svelte';

  interface Props {
    text?: string;
    tone?: 'established' | 'danger' | 'ink';
    size?: 's' | 'm' | 'l';
    /** Rotation en degrés (déf. −6). */
    rotate?: number;
    animate?: boolean;
    /** Rang dans une cascade (0, 1, 2…) : retard = rang × --stagger. */
    delay?: number;
    /** Texte pour les lecteurs d'écran si différent du texte visible. */
    label?: string;
    icon?: Snippet;
    class?: string;
  }

  let {
    text: textProp,
    tone = 'established',
    size = 'm',
    rotate = -6,
    animate = false,
    delay = 0,
    label,
    icon,
    class: className = '',
  }: Props = $props();
  const ui = getUiStrings();
  const text = $derived(textProp ?? ui.stamp.established);
</script>

<span
  class="stamp-wrap {size} {className}"
  class:animate
  style:--stamp-rot="{rotate}deg"
  style:--i={delay}
  role="img"
  aria-label={label ?? text}
>
  {#if animate}<span class="spread {tone}" aria-hidden="true"></span>{/if}
  <span class="stamp {tone}" aria-hidden="true">
    <span class="inner">
      {#if icon}{@render icon()}{/if}
      {text}
    </span>
  </span>
</span>

<style>
  /* v2 : le tampon frappe (chute, écrasement, rebond court), l'encre s'étale en halo flou
     derrière lui ; en mouvement réduit, fondu de 100 ms (durées et échelle à ~0). */
  .stamp-wrap {
    position: relative;
    display: inline-flex;
    transform: rotate(var(--stamp-rot));
  }
  .stamp {
    --tone: var(--established);
    display: inline-flex;
    padding: 3px;
    border: var(--border-strong) solid var(--tone);
    border-radius: var(--radius-xs);
    color: var(--tone);
    -webkit-mask-image: var(--stamp-texture);
    mask-image: var(--stamp-texture);
    -webkit-mask-size: 120px 120px;
    mask-size: 120px 120px;
    user-select: none;
  }
  .danger {
    --tone: var(--danger);
  }
  .ink {
    --tone: var(--text);
  }
  .inner {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-0-5) var(--space-2);
    border: var(--border) solid var(--tone);
    border-radius: 2px;
    font-family: var(--font-label);
    font-weight: var(--weight-bold);
    text-transform: uppercase;
    letter-spacing: calc(0.12em + var(--tracking-extra));
    line-height: 1.1;
    white-space: nowrap;
  }
  .s .inner {
    font-size: var(--step--1);
  }
  .m .inner {
    font-size: var(--step-0);
  }
  .l .inner {
    font-size: var(--step-2);
    padding: var(--space-1) var(--space-3);
  }
  /* Halo d'encre : même couleur, flou, s'élargit puis disparaît */
  .spread {
    --tone: var(--established);
    position: absolute;
    inset: -6px -10px;
    border-radius: 40%;
    background: radial-gradient(closest-side, var(--tone), transparent);
    opacity: 0;
    pointer-events: none;
    animation: m-spread var(--dur-spread) var(--ease-out) both;
    animation-delay: calc(var(--i, 0) * var(--stagger) + var(--dur-stamp) * 0.5);
  }
  .animate .stamp {
    animation:
      m-fade-in var(--dur-fade-fast) linear backwards,
      m-stamp-local var(--dur-stamp) var(--ease-stamp) backwards;
    animation-delay: calc(var(--i, 0) * var(--stagger));
  }
  @keyframes m-stamp-local {
    0% {
      transform: rotate(-8deg) scale(var(--stamp-from));
    }
    55% {
      transform: scale(0.94);
    }
    78% {
      transform: scale(1.03);
    }
    100% {
      transform: none;
    }
  }
  :global(:root[data-contrast='high']) .stamp {
    -webkit-mask-image: none;
    mask-image: none;
  }
  @media (forced-colors: active) {
    .stamp {
      -webkit-mask-image: none;
      mask-image: none;
      border-color: CanvasText;
    }
    .spread {
      display: none;
    }
  }
</style>
