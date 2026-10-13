<!--
	Tampon (DESIGN.md §9.15) : « Établi » sur les cases verrouillées, « Classé », « Confidentiel »
	sur les documents. Encre irrégulière (masque), double cadre, légère rotation.
	`animate` : le tampon frappe (scale + opacité) ; `delay` en multiples de --stagger
	pour la cascade de verrouillage (120 ms entre cases).
	En mouvement réduit : simple fondu de 100 ms, sans secousse.
-->
<script lang="ts">
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
    text = 'Établi',
    tone = 'established',
    size = 'm',
    rotate = -6,
    animate = false,
    delay = 0,
    label,
    icon,
    class: className = '',
  }: Props = $props();
</script>

<span
  class="stamp {tone} {size} {className}"
  class:animate
  style:--stamp-rot="{rotate}deg"
  style:--stamp-delay="calc(var(--stagger) * {delay})"
  role="img"
  aria-label={label ?? text}
>
  <span class="inner" aria-hidden="true">
    {#if icon}{@render icon()}{/if}
    {text}
  </span>
</span>

<style>
  .stamp {
    --tone: var(--established);
    display: inline-flex;
    padding: 3px;
    border: var(--border-strong) solid var(--tone);
    border-radius: var(--radius-xs);
    color: var(--tone);
    transform: rotate(var(--stamp-rot));
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
    font-family: var(--font-type);
    font-weight: var(--weight-bold);
    text-transform: uppercase;
    letter-spacing: 0.12em;
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
  .animate {
    animation:
      stamp-fade var(--dur-fade-fast) linear var(--stamp-delay) both,
      stamp-press var(--dur-stamp) var(--ease-stamp) var(--stamp-delay) both;
  }
  @keyframes stamp-fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes stamp-press {
    from {
      transform: rotate(var(--stamp-rot)) scale(var(--stamp-from));
    }
    to {
      transform: rotate(var(--stamp-rot)) scale(1);
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
  }
</style>
