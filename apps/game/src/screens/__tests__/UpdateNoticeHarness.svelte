<script lang="ts">
  import type { AppController } from '../../lib/game/app.svelte';
  import { setApp } from '../../lib/game/context';
  import UpdateNotice from '../UpdateNotice.svelte';

  /** Banc de test : fournit un contrôleur simulé à `UpdateNotice`. */
  let { app, variant }: { app: AppController; variant: 'title' | 'options' } = $props();
  // svelte-ignore state_referenced_locally
  setApp(app);
</script>

<UpdateNotice {variant} />
