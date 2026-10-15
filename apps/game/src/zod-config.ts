/**
 * zod 4 sans compilation à la volée : par défaut, son premier `parse` d'objet sonde `Function('')`
 * (`allowsEval`), ce que la CSP du jeu (`script-src 'self'`, sans `'unsafe-eval'`) refuse en
 * levant une violation. `jitless` coupe la sonde et le chemin compilé. Importé en premier par
 * `boot.ts`, donc évalué avant tout module qui parse.
 */
import { z } from 'zod';

z.config({ jitless: true });
