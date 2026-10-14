<!--
	Bulle de tutoriel (DESIGN.md §9.31) : une « note de service » posée près d'un élément réel de
	l'interface, avec une flèche vers lui et un liseré autour. Non modale : elle ne prend jamais
	le focus, ne bloque rien, ne couvre pas sa cible ; elle suit la cible (défilement,
	redimensionnement, changement de panneau) et se range sous une modale ouverte.
	- `anchor` : fonction relue à chaque image ; `null` (cible absente ou invisible) = bulle posée
	  en bas de la fenêtre, sans flèche (jamais d'impasse).
	- L'annonce au lecteur d'écran est faite par l'hôte dans une région live polie **permanente**
	  (une région créée avec son texte n'est pas toujours lue) ; Échap est routé par l'hôte.
-->
<script lang="ts" module>
  export type CoachPlacement = 'bottom' | 'top' | 'right' | 'left';
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';

  interface Props {
    /** Cible, relue à chaque image (`null` : bulle posée en bas, sans flèche). */
    anchor: () => HTMLElement | null;
    /** Surtitre (ex. « Note de service »). */
    kicker: string;
    text: string;
    /** Bouton principal (ex. « Compris »). */
    actionLabel: string;
    onaction: () => void;
    /** Bouton secondaire (ex. « Passer le tutoriel »), toujours proposé. */
    skipLabel?: string;
    onskip?: () => void;
    /** Côté préféré ; on bascule si la place manque. */
    placement?: CoachPlacement;
    /** Marge réservée en bas (barre d'onglets du téléphone), px. */
    bottomInset?: number;
    /** Identifiant (titre et texte : `${id}-kicker`, `${id}-text`). */
    id?: string;
    /** Contenu ajouté sous le texte (glyphe de touche…). */
    children?: Snippet;
  }

  let {
    anchor,
    kicker,
    text,
    actionLabel,
    onaction,
    skipLabel,
    onskip,
    placement = 'bottom',
    bottomInset = 0,
    id = `coach-${Math.random().toString(36).slice(2, 8)}`,
    children,
  }: Props = $props();

  const GAP = 14;
  const MARGIN = 8;
  const ARROW_EDGE = 18;

  interface Box {
    x: number;
    y: number;
    side: CoachPlacement | 'dock';
    arrow: number;
    ring: { x: number; y: number; w: number; h: number } | null;
    hidden: boolean;
  }

  let box = $state<Box>({ x: 0, y: 0, side: 'dock', arrow: 0, ring: null, hidden: true });
  let el = $state<HTMLElement | undefined>();

  function visibleRect(target: HTMLElement | null): DOMRect | null {
    if (!target || !target.isConnected) return null;
    if (target.checkVisibility && !target.checkVisibility({ visibilityProperty: true }))
      return null;
    const r = target.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    if (r.bottom < 0 || r.right < 0 || r.top > innerHeight || r.left > innerWidth) return null;
    return r;
  }

  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));

  /** Ce que la bulle évite de couvrir : tout ce qu'on peut viser, toucher ou saisir. */
  const AVOID =
    'button, a[href], input, select, textarea, [role="tab"], [role="option"], [tabindex="0"]';
  let obstacles: DOMRect[] = [];
  let obstaclesAt = -Infinity;

  /** Rectangles des contrôles visibles (relus au plus toutes les 300 ms). */
  function readObstacles(target: HTMLElement | null): DOMRect[] {
    const now = performance.now();
    if (now - obstaclesAt < 300) return obstacles;
    obstaclesAt = now;
    obstacles = [];
    for (const o of document.querySelectorAll(AVOID)) {
      if (el?.contains(o)) continue;
      if (target && (target.contains(o) || o.contains(target))) continue;
      const r = o.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (r.bottom < 0 || r.right < 0 || r.top > innerHeight || r.left > innerWidth) continue;
      obstacles.push(r);
    }
    return obstacles;
  }

  interface Candidate {
    key: string;
    x: number;
    y: number;
    side: CoachPlacement | 'dock';
    arrow: number;
    penalty: number;
  }

  /** Surface des contrôles couverts par la bulle posée en (x, y). */
  function overlap(x: number, y: number, w: number, h: number, obs: DOMRect[]): number {
    let a = 0;
    for (const o of obs) {
      const dx = Math.min(x + w, o.right) - Math.max(x, o.left);
      const dy = Math.min(y + h, o.bottom) - Math.max(y, o.top);
      if (dx > 0 && dy > 0) a += dx * dy;
    }
    return a;
  }

  let previous: string | null = null;

  function compute(): Box {
    // Sous une modale (<dialog> ouvert), la bulle serait inerte : on la range.
    const hidden = document.querySelector('dialog[open]') !== null;
    const vw = document.documentElement.clientWidth;
    const vh = innerHeight - bottomInset;
    const w = el?.offsetWidth ?? 0;
    const h = el?.offsetHeight ?? 0;
    const target = anchor();
    const r = visibleRect(target);
    const obs = readObstacles(r ? target : null);
    const cands: Candidate[] = [];
    const fitX = (x: number) => clamp(x, MARGIN, vw - MARGIN - w);
    const fitY = (y: number) => clamp(y, MARGIN, vh - MARGIN - h);

    if (r) {
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const order: CoachPlacement[] = [placement, 'bottom', 'top', 'right', 'left'];
      const rank = (s: CoachPlacement) => order.indexOf(s);
      // Au-dessus / au-dessous : centrée, alignée au début ou à la fin de la cible.
      for (const side of ['bottom', 'top'] as const) {
        const room =
          side === 'bottom' ? r.bottom + GAP + h <= vh - MARGIN : r.top - GAP - h >= MARGIN;
        if (!room) continue;
        const y = side === 'bottom' ? r.bottom + GAP : r.top - GAP - h;
        for (const [i, x0] of [cx - w / 2, r.left, r.right - w].entries()) {
          const x = fitX(x0);
          cands.push({
            key: `${side}${i}`,
            x,
            y,
            side,
            arrow: clamp(cx - x, ARROW_EDGE, w - ARROW_EDGE),
            penalty: rank(side) * 40 + i * 10,
          });
        }
      }
      for (const side of ['right', 'left'] as const) {
        const room =
          side === 'right' ? r.right + GAP + w <= vw - MARGIN : r.left - GAP - w >= MARGIN;
        if (!room) continue;
        const x = side === 'right' ? r.right + GAP : r.left - GAP - w;
        for (const [i, y0] of [cy - h / 2, r.top, r.bottom - h].entries()) {
          const y = fitY(y0);
          cands.push({
            key: `${side}${i}`,
            x,
            y,
            side,
            arrow: clamp(cy - y, ARROW_EDGE, h - ARROW_EDGE),
            penalty: rank(side) * 40 + i * 10,
          });
        }
      }
      if (cands.length === 0) {
        // Cible trop grande (un panneau entier) : la bulle se pose dans son bas, sans flèche.
        const y = fitY(Math.min(r.bottom, vh) - MARGIN - h);
        for (const [i, x0] of [cx - w / 2, r.left + MARGIN, r.right - MARGIN - w].entries())
          cands.push({ key: `in${i}`, x: fitX(x0), y, side: 'dock', arrow: 0, penalty: i * 10 });
      }
    } else {
      // Pas de cible : posée en bas (centre, début, fin), ou en haut à la fin.
      const bottom = fitY(vh - MARGIN - h);
      for (const [i, x0] of [(vw - w) / 2, MARGIN, vw - MARGIN - w].entries())
        cands.push({
          key: `dock${i}`,
          x: fitX(x0),
          y: bottom,
          side: 'dock',
          arrow: 0,
          penalty: i * 10,
        });
      cands.push({
        key: 'dock-top',
        x: fitX(vw - MARGIN - w),
        y: fitY(vh * 0.25),
        side: 'dock',
        arrow: 0,
        penalty: 40,
      });
    }

    const scored = cands.map((c) => ({ c, score: overlap(c.x, c.y, w, h, obs) + c.penalty }));
    scored.sort((a, b) => a.score - b.score);
    let best = scored[0]!;
    // Hystérésis : on ne saute pas d'une position à l'autre pour quelques pixels.
    const prev = scored.find((s) => s.c.key === previous);
    if (prev && prev.score <= best.score * 1.15 + 200) best = prev;
    previous = best.c.key;
    const ring = r ? { x: r.left - 4, y: r.top - 4, w: r.width + 8, h: r.height + 8 } : null;
    return { x: best.c.x, y: best.c.y, side: best.c.side, arrow: best.c.arrow, ring, hidden };
  }

  const same = (a: Box, b: Box) =>
    a.side === b.side &&
    a.hidden === b.hidden &&
    Math.abs(a.x - b.x) < 0.5 &&
    Math.abs(a.y - b.y) < 0.5 &&
    Math.abs(a.arrow - b.arrow) < 0.5 &&
    JSON.stringify(a.ring) === JSON.stringify(b.ring);

  // Suivi de la cible : une lecture de géométrie par image, écriture seulement si elle bouge.
  $effect(() => {
    if (!el) return;
    let frame = 0;
    const loop = () => {
      const next = compute();
      if (!same(next, box)) box = next;
      frame = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(frame);
  });
</script>

{#if box.ring && !box.hidden}
  <div
    class="ring"
    aria-hidden="true"
    style:left="{box.ring.x}px"
    style:top="{box.ring.y}px"
    style:width="{box.ring.w}px"
    style:height="{box.ring.h}px"
  ></div>
{/if}

<aside
  bind:this={el}
  class="coach {box.side}"
  class:hidden={box.hidden}
  data-surface="paper"
  data-coachmark
  aria-labelledby="{id}-kicker"
  aria-describedby="{id}-text"
  style:left="{box.x}px"
  style:top="{box.y}px"
  style:--arrow="{box.arrow}px"
>
  {#if box.side !== 'dock'}<span class="arrow" aria-hidden="true"></span>{/if}
  <p class="kicker" id="{id}-kicker">
    <Icon name="quill" size="1.1rem" />
    {kicker}
  </p>
  <p class="text" id="{id}-text">{text}</p>
  {@render children?.()}
  <div class="actions">
    {#if skipLabel && onskip}
      <Button variant="ghost" onclick={onskip}>{skipLabel}</Button>
    {/if}
    <Button variant="primary" iconName="check" onclick={onaction}>{actionLabel}</Button>
  </div>
</aside>

<style>
  .coach {
    position: fixed;
    z-index: var(--z-popover);
    inline-size: min(22rem, calc(100vw - 2 * var(--space-2)));
    padding: var(--space-3) var(--space-3) var(--space-2) var(--space-4);
    background: var(--surface-1);
    color: var(--text);
    border-inline-start: 5px solid var(--accent);
    border-radius: var(--radius-paper);
    box-shadow: var(--shadow-lifted);
    /* La note se pose (§7.3 « feuille posée ») ; mouvement réduit : fondu (tokens). */
    animation:
      m-fade-in var(--dur-fade) var(--ease-out) backwards,
      coach-settle var(--dur-open) var(--ease-paper) backwards;
    rotate: -0.4deg;
  }
  /* Jamais un obstacle : seuls les boutons captent le pointeur, le reste de la note laisse
     passer le clic vers ce qu'elle recouvre (le placement évite déjà les contrôles). */
  .coach {
    pointer-events: none;
  }
  .coach :global(button) {
    pointer-events: auto;
  }
  .coach.hidden {
    visibility: hidden;
  }
  @keyframes coach-settle {
    from {
      transform: translateY(calc(var(--rise) * 1.5)) rotate(1.2deg);
    }
  }
  .kicker {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    margin: 0 0 var(--space-1);
    color: var(--accent);
    font-family: var(--font-label);
    font-size: var(--step--1);
    letter-spacing: calc(0.08em + var(--tracking-extra));
    text-transform: uppercase;
  }
  .text {
    margin: 0;
    font-size: var(--step-0);
    line-height: var(--leading-snug);
    text-wrap: pretty;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--space-1) var(--space-2);
    margin-block-start: var(--space-2);
  }
  /* Flèche : un carré du même papier, tourné, qui dépasse du bord tourné vers la cible. */
  .arrow {
    position: absolute;
    inline-size: 14px;
    block-size: 14px;
    background: var(--surface-1);
    rotate: 45deg;
  }
  .bottom .arrow {
    inset-block-start: -7px;
    inset-inline-start: calc(var(--arrow) - 7px);
  }
  .top .arrow {
    inset-block-end: -7px;
    inset-inline-start: calc(var(--arrow) - 7px);
  }
  .right .arrow {
    inset-inline-start: -9px;
    inset-block-start: calc(var(--arrow) - 7px);
    background: var(--accent);
  }
  .left .arrow {
    inset-inline-end: -7px;
    inset-block-start: calc(var(--arrow) - 7px);
  }
  /* Liseré autour de la cible : décor, ne capte rien. */
  .ring {
    position: fixed;
    z-index: var(--z-popover);
    pointer-events: none;
    border: var(--border-strong) dashed var(--accent);
    border-radius: var(--radius-m);
    box-shadow: 0 0 0 var(--border-strong) var(--focus-halo);
    animation: m-fade-in var(--dur-fade) var(--ease-out) backwards;
  }
  @media (forced-colors: active) {
    .coach {
      border: 1px solid CanvasText;
      border-inline-start: 5px solid Highlight;
    }
    .ring {
      border-color: Highlight;
    }
    .arrow {
      display: none;
    }
  }
</style>
