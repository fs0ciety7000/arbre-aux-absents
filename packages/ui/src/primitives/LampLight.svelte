<!--
	Lumière de la lampe (DESIGN.md §6.7, §8) : calque décoratif posé sur une scène (écran
	titre, bureau, hero du site) — cône de lumière chaude, respiration lente, vacillement
	optionnel, poussières qui dérivent dans le faisceau. aria-hidden, sans pointeur, ne lit
	que des tokens ; boucles coupées en mouvement réduit (les poussières disparaissent).
	Le parent doit être positionné (relative) ; le calque se place en `inset: 0`.
-->
<script lang="ts">
  interface Props {
    /** Position du foyer (en % de la scène). */
    x?: number;
    y?: number;
    /** Rayon du cône (CSS, déf. 60vmax). */
    radius?: string;
    /** Nombre de poussières (0 pour aucune ; ≤ 24). */
    dust?: number;
    flicker?: boolean;
    breathe?: boolean;
    class?: string;
  }
  let {
    x = 30,
    y = 8,
    radius = '60vmax',
    dust = 14,
    flicker = false,
    breathe = true,
    class: className = '',
  }: Props = $props();

  /** Poussières déterministes (pas d'aléa au rendu : SSR et capture stables). */
  const motes = $derived(
    Array.from({ length: Math.min(24, Math.max(0, dust)) }, (_, k) => {
      const r = (n: number) => {
        const v = Math.sin((k + 1) * 12.9898 * n) * 43758.5453;
        return v - Math.floor(v);
      };
      return {
        left: x - 18 + r(1) * 36,
        top: y + 6 + r(2) * 48,
        size: 1.5 + r(3) * 2.5,
        dx: (r(4) - 0.5) * 60,
        dy: -20 - r(5) * 50,
        dur: 12 + r(6) * 14,
        delay: -r(7) * 20,
        o: 0.35 + r(8) * 0.55,
      };
    }),
  );
</script>

<div
  class="lamp {className}"
  aria-hidden="true"
  style:--lx="{x}%"
  style:--ly="{y}%"
  style:--lr={radius}
>
  <div class="pool" class:mv-breathe={breathe}></div>
  {#if flicker}<div class="flicker mv-flicker"></div>{/if}
  {#each motes as m, i (i)}
    <span
      class="mote mv-dust"
      style:left="{m.left}%"
      style:top="{m.top}%"
      style:--mote-s="{m.size}px"
      style:--mote-dx="{m.dx}px"
      style:--mote-dy="{m.dy}px"
      style:--mote-d="{m.dur}s"
      style:--mote-delay="{m.delay}s"
      style:--mote-o={m.o}
    ></span>
  {/each}
</div>

<style>
  .lamp {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    z-index: 0;
  }
  .pool,
  .flicker {
    position: absolute;
    left: calc(var(--lx) - var(--lr));
    top: calc(var(--ly) - var(--lr) * 0.55);
    width: calc(var(--lr) * 2);
    height: calc(var(--lr) * 1.6);
    background: radial-gradient(closest-side, var(--lamp-pool), var(--lamp-glow) 55%, transparent);
    transform-origin: 50% 35%;
  }
  .flicker {
    background: radial-gradient(closest-side, var(--lamp-glow), transparent 70%);
  }
  .mote {
    position: absolute;
    width: var(--mote-s);
    height: var(--mote-s);
    border-radius: 50%;
    background: var(--lamp-dust);
    filter: blur(0.4px);
    opacity: 0;
  }
  @media (forced-colors: active) {
    .lamp {
      display: none;
    }
  }
</style>
