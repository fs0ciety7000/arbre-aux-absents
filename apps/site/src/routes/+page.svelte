<svelte:head>
  <title>L'Arbre aux absents</title>
  <meta
    name="description"
    content="L'Arbre aux absents : un jeu d'enquête généalogique dans un monde imaginaire, par CM Interactive et CM Creative Lab."
  />
</svelte:head>

<main>
  <h1>L'Arbre aux absents</h1>
  <p>Reconstituez l'arbre d'une famille en croisant archives, recherches et carte du monde.</p>
  <p class="muted">Page provisoire : le site arrive bientôt.</p>
  <footer class="muted">CM Interactive · CM Creative Lab</footer>
</main>

<style>
  main {
    min-height: 100dvh;
    display: grid;
    place-content: center;
    gap: var(--space-2);
    padding: var(--space-8) var(--space-4);
    max-width: var(--measure);
    margin: 0 auto;
    text-align: center;
  }
  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(2rem, 6vw, 3.5rem);
  }
  .muted {
    color: var(--text-muted);
  }
</style>
