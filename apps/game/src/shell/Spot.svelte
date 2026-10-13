<!--
  Vignette d'état vide (art/keyart/spot-*.svg, DESIGN §10.10, §13.5) : chargée à la demande
  (un petit fichier par vignette, 2 à 6 Ko gzip), inlinée sans `{@html}` (svgContent nettoie),
  décorative. Sur le bureau de nuit : `.art.on-night` ; sur une feuille : palette papier.
  L'encre se pose au montage (fondu + flou qui sèche, `mv-ink`), rien en mouvement réduit.
-->
<script lang="ts" module>
  const files = import.meta.glob<string>('../../../../art/keyart/spot-*.svg', {
    query: '?raw',
    import: 'default',
  });

  export type SpotName =
    | 'archives'
    | 'catalogue'
    | 'fern'
    | 'letter'
    | 'lighthouse'
    | 'magnifier'
    | 'map-pin'
    | 'register'
    | 'stamp'
    | 'tree';

  function loader(name: SpotName): (() => Promise<string>) | undefined {
    return files[`../../../../art/keyart/spot-${name}.svg`];
  }
</script>

<script lang="ts">
  import { svgContent } from '@arbre/map/svelte';

  interface Props {
    name: SpotName;
    /** Largeur CSS (le ratio 6:5 suit). */
    size?: string;
    /** Fond sur lequel la vignette est posée. */
    on?: 'night' | 'paper';
    class?: string;
  }
  let { name, size = '11rem', on = 'night', class: className = '' }: Props = $props();

  let markup = $state<string | null>(null);
  $effect(() => {
    const load = loader(name);
    let alive = true;
    void load?.().then(
      (svg) => alive && (markup = svg),
      () => undefined, // vignette décorative : rien à afficher en cas d'échec
    );
    return () => {
      alive = false;
    };
  });
</script>

<div
  class="spot {className}"
  class:on-night={on === 'night'}
  class:mv-ink={markup !== null}
  style:--spot-w={size}
  aria-hidden="true"
  use:svgContent={markup}
></div>

<style>
  .spot {
    inline-size: min(100%, var(--spot-w));
    aspect-ratio: 6 / 5;
    flex: none;
  }
  .spot :global(svg) {
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }
  @media (forced-colors: active) {
    .spot {
      display: none;
    }
  }
</style>
