/** npm run content:solve [-- --report] — PROVISOIRE (lot 0) : le solveur arrive avec content-tools. */
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: { report: { type: 'boolean', default: false } } });
console.log(
  `content:solve — solveur non implémenté (lot 0)${values.report ? ', aucun rapport' : ''} : OK.`,
);
