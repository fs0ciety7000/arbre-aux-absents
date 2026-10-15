/**
 * Tests du jeu (vitest `setupFiles`) : les sections différées du catalogue sont chargées comme
 * dans l'app une fois le Bureau ouvert (panneaux, store de partie).
 */
import { ensureMessages } from './index.svelte';

await ensureMessages('desk');
