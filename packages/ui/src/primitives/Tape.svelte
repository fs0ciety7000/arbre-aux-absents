<!--
	Ruban adhésif mat (DESIGN.md §6.5) : bande translucide aux bouts dentelés, posée de biais
	sur un coin de photo ou de coupure. Décoratif (aria-hidden). Positionner via `class`/`style`
	du parent (position absolue).
-->
<script lang="ts">
  interface Props {
    /** Longueur CSS (déf. 88px). */
    length?: string;
    /** Inclinaison en degrés (déf. −4). */
    rotate?: number;
    class?: string;
  }
  let { length = '88px', rotate = -4, class: className = '' }: Props = $props();
</script>

<span
  class="mat-tape {className}"
  style:--tape-w={length}
  style:--tape-r="{rotate}deg"
  aria-hidden="true"
></span>
