import { runAdmin } from '../admin';
import { ConfigError, loadConfig } from '../config';
import { openDatabase } from '../db';

/** Point d'entrée : `node dist/admin.js <commande>` (terminal Coolify). */

try {
  const config = loadConfig(process.env);
  const db = openDatabase(config.dataDir);
  const code = runAdmin(
    process.argv.slice(2),
    { db, prefix: config.ticketPrefix },
    { out: (l) => console.log(l), err: (l) => console.error(l) },
  );
  db.close();
  process.exitCode = code;
} catch (e) {
  console.error(e instanceof ConfigError ? e.message : `Erreur : ${(e as Error).message}`);
  process.exitCode = 1;
}
