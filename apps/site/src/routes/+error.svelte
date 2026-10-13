<!-- Erreur générique (rare sur un site prérendu) : même voix que la 404, sans image. -->
<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { Button } from '@arbre/ui';
</script>

<svelte:head><title>Erreur · L’Arbre aux absents</title></svelte:head>

<div class="container-narrow page-head err">
  <p class="kicker">Erreur {page.status}</p>
  <h1>Ce document <em>ne s’ouvre pas</em></h1>
  <p class="lede">Une erreur est survenue. Le reste du dossier vous attend.</p>
  <Button variant="primary" href={resolve('/')} iconName="back">Retour à l’accueil</Button>
</div>

<style>
  .err {
    padding-block: var(--space-24) var(--space-16);
  }
</style>
