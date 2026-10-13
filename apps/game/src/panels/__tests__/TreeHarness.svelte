<!-- Harnais de test : fournit le store de partie au panneau Arbre (rendu serveur). -->
<script lang="ts">
  import { setGame } from '../../lib/game/context';
  import type { GameStore } from '../../lib/game/types';
  import TreePanel from '../TreePanel.svelte';

  let { game }: { game: GameStore } = $props();
  // svelte-ignore state_referenced_locally
  setGame(game);
</script>

<TreePanel />
