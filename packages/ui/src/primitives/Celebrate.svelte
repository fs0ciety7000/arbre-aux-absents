<!--
	Célébration d'une branche révélée (DESIGN.md §8, « revealed-branch ») : gerbe de confettis
	de papier (kraft, manille, vermillon, céladon, safran) + feuilles de fougère, depuis le
	centre du parent. Décoratif (aria-hidden) : l'annonce est faite par le jeu (région live).
	Joué à chaque changement de `key` ; mouvement réduit : rien ne s'affiche (durée ~0).
-->
<script lang="ts">
  interface Props {
    /** Changer la clé rejoue la gerbe. */
    key?: number | string;
    /** Nombre de confettis (≤ 40). */
    count?: number;
    /** Origine (en % du parent). */
    x?: number;
    y?: number;
    class?: string;
  }
  let { key = 0, count = 28, x = 50, y = 45, class: className = '' }: Props = $props();
  const TONES = [
    'var(--kraft)',
    'var(--manila)',
    'var(--brand)',
    'var(--fern)',
    'var(--accent)',
    'var(--paper-new)',
  ];
  const bits = $derived(
    Array.from({ length: Math.min(40, Math.max(0, count)) }, (_, k) => {
      const r = (n: number) => {
        const v = Math.sin((k + 3) * 78.233 * n + String(key).length) * 12543.13;
        return v - Math.floor(v);
      };
      const a = r(1) * Math.PI * 2;
      const dist = 80 + r(2) * 180;
      return {
        cx: Math.cos(a) * dist,
        cy: Math.sin(a) * dist * 0.7 - 40,
        cr: (r(3) - 0.5) * 1080,
        w: 6 + r(4) * 8,
        h: 4 + r(5) * 10,
        tone: TONES[k % TONES.length],
        delay: r(6) * 120,
        leaf: k % 7 === 0,
      };
    }),
  );
</script>

{#key key}
  <div class="burst {className}" aria-hidden="true" style:--ox="{x}%" style:--oy="{y}%">
    {#each bits as b, i (i)}
      <span
        class="bit"
        class:leaf={b.leaf}
        style:--cx="{b.cx}px"
        style:--cy="{b.cy}px"
        style:--cr="{b.cr}deg"
        style:width="{b.w}px"
        style:height="{b.h}px"
        style:background={b.tone}
        style:animation-delay="{b.delay}ms"
      ></span>
    {/each}
  </div>
{/key}

<style>
  .burst {
    position: absolute;
    inset: 0;
    overflow: visible;
    pointer-events: none;
    z-index: var(--z-raised);
  }
  .bit {
    position: absolute;
    left: var(--ox);
    top: var(--oy);
    border-radius: 1px;
    opacity: 0;
    box-shadow: 0 0 0 0.5px var(--kraft-edge);
    animation: m-confetti var(--dur-celebrate) var(--ease-out) both;
  }
  .leaf {
    border-radius: 0 80% 0 80%;
  }
  @media (forced-colors: active) {
    .burst {
      display: none;
    }
  }
</style>
