/**
 * npm run content:i18n [-- --case <id>] [-- --only <glob>] [-- --root <dossier>]
 * Contrôle des traductions (ARCHITECTURE §3.7 règle 12) sur un périmètre.
 *
 * Emplacement réservé (vague 0 de docs/i18n/PLAN.md) : le lot A1 (backend) le remplace par le
 * vrai contrôle, qui sort en code 1 en cas d'erreur sur le périmètre.
 */
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    case: { type: 'string' },
    only: { type: 'string' },
    root: { type: 'string' },
  },
});

const scope = [values.case && `affaire ${values.case}`, values.only && `fichiers ${values.only}`]
  .filter(Boolean)
  .join(', ');
console.log(`content:i18n${scope ? ` (${scope})` : ''} : not implemented yet (lot A1).`);
