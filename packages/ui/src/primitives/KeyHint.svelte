<!--
	Aide de commande (DESIGN.md §9.16) : glyphe de touche, de bouton de manette ou de geste
	+ libellé d'action. Suit le périphérique actif (Settings.inputGlyphs ou détection).
	Les boutons de façade sont dessinés en losange (position commune à toutes les manettes) :
	la forme dit la position, la lettre ou le symbole dit la marque.
-->
<script lang="ts" module>
  import { uiFr, type UiStrings } from '../i18n';
  export type Device = 'keyboard' | 'mouse' | 'touch' | 'gamepad';
  export type PadStyle = 'xbox' | 'playstation' | 'nintendo';
  export type PadButton =
    | 'south'
    | 'east'
    | 'west'
    | 'north'
    | 'lb'
    | 'rb'
    | 'lt'
    | 'rt'
    | 'start'
    | 'select'
    | 'ls'
    | 'rs'
    | 'dpad'
    | 'lstick'
    | 'rstick';

  type Face = 'south' | 'east' | 'west' | 'north';
  const LETTERS: Record<'xbox' | 'nintendo', Record<Face, string>> = {
    xbox: { south: 'A', east: 'B', west: 'X', north: 'Y' },
    nintendo: { south: 'B', east: 'A', west: 'Y', north: 'X' },
  };
  const SHOULDERS: Record<PadStyle, Partial<Record<PadButton, string>>> = {
    xbox: { lb: 'LB', rb: 'RB', lt: 'LT', rt: 'RT', ls: 'L3', rs: 'R3' },
    playstation: { lb: 'L1', rb: 'R1', lt: 'L2', rt: 'R2', ls: 'L3', rs: 'R3' },
    nintendo: { lb: 'L', rb: 'R', lt: 'ZL', rt: 'ZR', start: '+', select: '−', ls: 'L3', rs: 'R3' },
  };

  export function isFace(b: PadButton): b is Face {
    return b === 'south' || b === 'east' || b === 'west' || b === 'north';
  }

  /** Nom d'un bouton de manette ; `strings` : textes de la langue courante (déf. français). */
  export function padLabel(b: PadButton, style: PadStyle, strings: UiStrings = uiFr): string {
    const k = strings.keyHint;
    if (isFace(b)) return style === 'playstation' ? k.playstation[b] : LETTERS[style][b];
    if (b === 'start' || b === 'select') {
      if (style === 'xbox') return k.xbox[b];
      if (style === 'playstation') return k.playstationMenu[b];
    }
    if (b === 'dpad' || b === 'lstick' || b === 'rstick') return k[b];
    return SHOULDERS[style][b] ?? b;
  }
</script>

<script lang="ts">
  import { getUiStrings } from '../i18n';
  interface Props {
    /** Libellé de l'action (« Ouvrir », « Retourner »). Omettre pour n'afficher que le glyphe. */
    action?: string;
    device?: Device;
    /** Touches clavier, dans la langue de l'interface : ['Ctrl', 'S'], ['Maj'] / ['Shift'], ['Échap'] / ['Esc']. */
    keys?: string[];
    /** Bouton de manette (position logique). */
    pad?: PadButton;
    padStyle?: PadStyle;
    /** Geste tactile ou souris : « Appui long », « Clic droit ». */
    gesture?: string;
    class?: string;
  }

  let {
    action,
    device = 'keyboard',
    keys = [],
    pad,
    padStyle = 'xbox',
    gesture,
    class: className = '',
  }: Props = $props();

  const ui = getUiStrings();
  const face = $derived(pad !== undefined && isFace(pad));
  // Symboles PlayStation, par position (croix en bas, rond à droite, carré à gauche, triangle en haut).
  const psSymbols: Record<Face, string> = {
    south: 'M7 7l6 6M13 7l-6 6',
    east: 'M10 5.5a4.5 4.5 0 1 0 0 9a4.5 4.5 0 1 0 0-9',
    west: 'M6 6h8v8H6z',
    north: 'M10 5l5 9H5z',
  };
  const dots: Record<string, [number, number]> = {
    south: [10, 16],
    east: [16, 10],
    west: [4, 10],
    north: [10, 4],
  };
</script>

<span class="hint {className}">
  {#if device === 'gamepad' && pad}
    {@const name = padLabel(pad, padStyle, ui)}
    <span class="glyphs" role="img" aria-label={ui.keyHint.button(name)}>
      {#if face}
        <svg class="diamond" viewBox="0 0 20 20" aria-hidden="true">
          {#each Object.entries(dots) as [pos, [x, y]] (pos)}
            <circle cx={x} cy={y} r="2.6" class:on={pos === pad} />
          {/each}
        </svg>
        {#if padStyle === 'playstation'}
          <svg class="cap round" viewBox="0 0 20 20" aria-hidden="true">
            <path d={psSymbols[pad as Face]} />
          </svg>
        {:else}
          <kbd class="cap round" aria-hidden="true">{name}</kbd>
        {/if}
      {:else if pad === 'dpad'}
        <svg class="cap" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M7.5 2h5v5.5H18v5h-5.5V18h-5v-5.5H2v-5h5.5z" />
        </svg>
      {:else if pad === 'lstick' || pad === 'rstick'}
        <kbd class="cap round stick" aria-hidden="true"
          >{pad === 'lstick' ? ui.keyHint.stickLetter.left : ui.keyHint.stickLetter.right}</kbd
        >
      {:else}
        <kbd class="cap pill" aria-hidden="true">{name}</kbd>
      {/if}
    </span>
  {:else if (device === 'touch' || device === 'mouse') && gesture}
    <span class="gesture">{gesture}</span>
  {:else if keys.length}
    <span class="glyphs">
      {#each keys as k, i (i)}
        {#if i > 0}<span class="plus" aria-hidden="true">+</span>{/if}
        <kbd class="cap">{k}</kbd>
      {/each}
    </span>
  {/if}
  {#if action}<span class="action">{action}</span>{/if}
</span>

<style>
  .hint {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--step--1);
    color: var(--text-muted);
    white-space: nowrap;
  }
  .glyphs {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
  }
  .cap {
    display: inline-grid;
    place-items: center;
    min-width: 1.75rem;
    height: 1.75rem;
    padding: 0 var(--space-2);
    border: var(--border) solid var(--line-strong);
    border-block-end-width: 3px;
    border-radius: var(--radius-xs);
    background: var(--surface-2);
    color: var(--text);
    font-family: var(--font-ui);
    font-size: var(--step--1);
    font-weight: var(--weight-semibold);
    line-height: 1;
  }
  svg.cap {
    padding: var(--space-0-5);
    width: 1.75rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .round {
    border-radius: var(--radius-pill);
    border-block-end-width: var(--border);
    padding: 0;
    width: 1.75rem;
  }
  .pill {
    border-radius: var(--radius-pill);
    border-block-end-width: var(--border);
  }
  .stick {
    box-shadow: inset 0 0 0 3px var(--surface-3);
  }
  .diamond {
    width: 1.25rem;
    height: 1.25rem;
  }
  .diamond circle {
    fill: none;
    stroke: var(--text-muted);
    stroke-width: 1.2;
  }
  .diamond circle.on {
    fill: var(--text);
    stroke: var(--text);
  }
  .plus {
    color: var(--text-faint);
  }
  .action {
    color: var(--text);
  }
  .gesture {
    padding: 0 var(--space-2);
    border-radius: var(--radius-pill);
    border: var(--border) dashed var(--line-strong);
    line-height: 1.75rem;
    color: var(--text);
  }
  @media (forced-colors: active) {
    .diamond circle.on {
      fill: CanvasText;
    }
  }
</style>
