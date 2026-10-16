<!--
	Cadre de marque (DESIGN.md §6.12, AFFAIRE-3 §1.2 et §1.7) : la fenêtre d'une case à marque.
	Forme, pas couleur : **coins coupés à 45°** (`--mark-corner`) au lieu d'arrondis, contour
	d'encre, et (case de l'arbre) **bande « Marque »** sous la fenêtre. La marque elle-même est le
	SVG du contenu (160 × 200, trait `currentColor`), passé en enfant par l'application ; le cadre
	lui impose son encre et son papier (`--art-ink` ← `--mark-ink`, `--art-paper` ← `--mark-paper`),
	sur le bureau sombre comme en contraste élevé.
	Sans enfant (ou `empty`), la fenêtre montre le **pied seul** (icône `unknown-mark`) sur le
	quadrillé du carnet.
	Accessibilité : décor (`aria-hidden`) par défaut, car l'hôte (case, tuile) porte le nom
	accessible ; avec `alt`, `role="img"` nommé par la description verbale (AFFAIRE-3 §1.6).
	Jamais interactif : le bouton, le focus, les états de dépôt et de sélection sont à l'hôte.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getUiStrings } from '../i18n';
  import Icon from './Icon.svelte';

  interface Props {
    /** Hauteur de la fenêtre : `slot` 72 px (case), `tile` 96 px (galerie, sélecteur),
     *  `sheet` 320 px (fiche, agrandissement), `inline` 2,5 em (texte d'une pièce). */
    size?: 'slot' | 'tile' | 'sheet' | 'inline';
    /** Bande « Marque » sous la fenêtre (déf. : oui pour `slot`, non ailleurs). */
    band?: boolean;
    /** Texte de la bande (déf. `UiStrings.mark.label` : « Marque » / « Mark »). */
    label?: string;
    /** Fenêtre vide : pied seul (déf. : vide s'il n'y a pas d'enfant). */
    empty?: boolean;
    /** Inclinaison de repos en degrés (bornée à ±3 ; les portraits de l'arbre sont à −2). */
    tilt?: number;
    /** Description verbale : rend le cadre `role="img"` nommé (sinon `aria-hidden`). */
    alt?: string;
    /** La marque (SVG inliné par l'application). */
    children?: Snippet;
    class?: string;
  }

  let {
    size = 'slot',
    band,
    label: labelProp,
    empty,
    tilt = 0,
    alt,
    children,
    class: className = '',
  }: Props = $props();

  const ui = getUiStrings();
  const label = $derived(labelProp ?? ui.mark.label);
  const showBand = $derived(band ?? size === 'slot');
  const isEmpty = $derived(empty ?? !children);
  const angle = $derived(Math.max(-3, Math.min(3, tilt)));
</script>

<span
  class="mark-frame size-{size} {className}"
  class:mf-banded={showBand}
  class:mf-empty={isEmpty}
  style:--mark-tilt="{angle}deg"
  role={alt ? 'img' : undefined}
  aria-label={alt || undefined}
  aria-hidden={alt ? undefined : 'true'}
>
  <span class="mf-plate">
    <span class="mf-window">
      {#if isEmpty}
        <span class="mf-foot"><Icon name="unknown-mark" size="62%" weight={2} /></span>
      {:else}
        {@render children?.()}
      {/if}
    </span>
    {#if showBand}
      <span class="mf-band"><span class="mf-band-text">{label}</span></span>
    {/if}
  </span>
</span>

<style>
  .mark-frame {
    --mark-h: var(--mark-h-slot);
    --mark-w: calc(var(--mark-h) * 0.8); /* 160 × 200, comme les portraits */
    --c: var(--mark-corner);
    --w: var(--mark-edge-width);
    /* coupe intérieure : même biseau à épaisseur constante (w · (√2 − 1)) */
    --ci: calc(var(--c) - var(--w) * 0.4142);
    display: inline-block;
    flex: none;
    vertical-align: middle;
    rotate: var(--mark-tilt);
    /* l'ombre suit la forme coupée (un box-shadow serait rogné par le clip-path) */
    filter: var(--mark-shadow);
    line-height: 1;
  }
  .size-tile {
    --mark-h: var(--mark-h-tile);
  }
  .size-sheet {
    --mark-h: var(--mark-h-sheet);
    --c: calc(var(--mark-corner) * 2);
  }
  .size-inline {
    --mark-h: var(--mark-h-inline);
    --c: min(var(--mark-corner), 0.15em);
    filter: none;
  }

  .mf-plate {
    display: flex;
    flex-direction: column;
    inline-size: calc(var(--mark-w) + 2 * var(--w));
    padding: var(--w);
    background: var(--mark-edge);
    clip-path: polygon(
      var(--c) 0,
      calc(100% - var(--c)) 0,
      100% var(--c),
      100% calc(100% - var(--c)),
      calc(100% - var(--c)) 100%,
      var(--c) 100%,
      0 calc(100% - var(--c)),
      0 var(--c)
    );
  }

  .mf-window {
    /* le SVG d'une marque lit --art-ink / --art-paper (art.css) : le cadre fixe les siens */
    --art-ink: var(--mark-ink);
    --art-paper: var(--mark-paper);
    position: relative;
    display: grid;
    place-items: center;
    inline-size: var(--mark-w);
    block-size: var(--mark-h);
    overflow: hidden;
    background: var(--mark-paper);
    color: var(--mark-ink);
    clip-path: polygon(
      var(--ci) 0,
      calc(100% - var(--ci)) 0,
      100% var(--ci),
      100% calc(100% - var(--ci)),
      calc(100% - var(--ci)) 100%,
      var(--ci) 100%,
      0 calc(100% - var(--ci)),
      0 var(--ci)
    );
  }
  /* Avec la bande, seuls les coins du haut de la fenêtre sont coupés : le bas tient à la bande. */
  .mf-banded .mf-window {
    clip-path: polygon(
      var(--ci) 0,
      calc(100% - var(--ci)) 0,
      100% var(--ci),
      100% 100%,
      0 100%,
      0 var(--ci)
    );
  }
  .mf-window > :global(*),
  .mf-window :global(svg) {
    inline-size: 100%;
    block-size: 100%;
  }
  .mf-window :global(svg) {
    display: block;
  }

  /* Fenêtre vide : quadrillé du carnet de Marest (décor), pied seul à l'encre */
  .mf-empty .mf-window {
    background:
      repeating-linear-gradient(
        90deg,
        var(--mark-grid) 0 var(--mark-grid-line),
        transparent var(--mark-grid-line) var(--mark-grid-step)
      ),
      repeating-linear-gradient(
        180deg,
        var(--mark-grid) 0 var(--mark-grid-line),
        transparent var(--mark-grid-line) var(--mark-grid-step)
      ),
      var(--mark-paper);
  }
  .mf-foot {
    display: grid;
    place-items: center;
    inline-size: 100%;
    block-size: 100%;
    color: var(--mark-empty);
  }
  .mf-foot :global(svg) {
    inline-size: 62%;
    block-size: 62%;
  }

  /* Bande « Marque » : l'encre du contour s'épaissit sous la fenêtre, lettres de papier. */
  .mf-band {
    display: grid;
    place-items: center;
    min-block-size: var(--mark-band-h);
    padding: var(--mark-band-pad);
    overflow: hidden;
    color: var(--mark-band-ink);
    font-family: var(--font-label);
    font-weight: var(--weight-semibold);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    white-space: nowrap;
    user-select: none;
  }
  .mf-band-text {
    /* le texte rétrécit plutôt que déborder (taille du texte ×2, langues plus longues) */
    font-size: min(var(--mark-band-text), var(--mark-w) / 5.6);
    line-height: 1.2;
  }

  :global([data-texture='off']) .mf-empty .mf-window {
    background: var(--mark-paper);
  }
  @media (forced-colors: active) {
    .mark-frame {
      filter: none;
    }
    .mf-plate {
      forced-color-adjust: none;
      background: CanvasText;
    }
    .mf-window,
    .mf-empty .mf-window {
      forced-color-adjust: none;
      --art-ink: CanvasText;
      --art-paper: Canvas;
      background: Canvas;
      color: CanvasText;
    }
    .mf-foot {
      color: CanvasText;
    }
    .mf-band {
      forced-color-adjust: none;
      color: Canvas;
    }
  }
</style>
