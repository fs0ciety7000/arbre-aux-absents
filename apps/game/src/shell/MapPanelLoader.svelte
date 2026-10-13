<!-- Panneau Carte chargé à la demande (avec la carte du monde compilée). -->
<script lang="ts">
  import { pm } from '../panels/messages';
  import LazyPanel from './LazyPanel.svelte';

  const load = () => import('../panels/MapPanel.svelte');
</script>

<LazyPanel title={pm.map.title} {load} />
