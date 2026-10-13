<!--
	Motifs de gravure partagés (DESIGN.md §10.4) : #art-hatch (hachure simple),
	#art-hatch-dense (hachure croisée), #art-stipple (pointillé). À rendre UNE fois par écran
	qui contient de l'art ; les SVG de contenu les référencent par classe (.hatch…).
-->
<script lang="ts">
  // Composant sans logique : motifs SVG partagés.
</script>

<svg class="art defs" width="0" height="0" aria-hidden="true" focusable="false">
  <defs>
    <pattern
      id="art-hatch"
      width="4"
      height="4"
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(-45)"
    >
      <line class="hatch" x1="0" y1="0" x2="0" y2="4" />
    </pattern>
    <pattern
      id="art-hatch-dense"
      width="3"
      height="3"
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(-45)"
    >
      <line class="hatch-dense" x1="0" y1="0" x2="0" y2="3" />
      <line class="hatch-dense" x1="0" y1="0" x2="3" y2="0" />
    </pattern>
    <pattern id="art-stipple" width="5" height="5" patternUnits="userSpaceOnUse">
      <circle class="stipple" cx="1.2" cy="1.2" r="0.55" />
      <circle class="stipple" cx="3.7" cy="3.6" r="0.5" />
    </pattern>
  </defs>
</svg>

<style>
  .defs {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
  }
</style>
