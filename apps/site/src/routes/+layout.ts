// Site entièrement statique : tout est prérendu, sans JS client par défaut.
// Seule la page « Le monde » réactive l'hydratation pour la carte interactive.
export const prerender = true;
export const trailingSlash = 'always';
export const csr = false;
