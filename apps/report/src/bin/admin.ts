import { runAdmin } from '../admin';
import { ConfigError, loadConfig } from '../config';
import { openDatabase } from '../db';

/**
 * Point d'entrée : `node dist/admin.js <commande>` (terminal Coolify).
 *
 * `healthcheck` : sonde du conteneur (HEALTHCHECK Docker et healthcheck « commande » de Coolify,
 * l'image n'ayant ni curl ni wget). Interroge `GET /healthz` en IPv4 sans ouvrir la base ;
 * code 0 si 200, sinon 1.
 */

if (process.argv[2] === 'healthcheck') {
  const port = Number(process.env.PORT) || 8090;
  fetch(`http://127.0.0.1:${port}/healthz`, { signal: AbortSignal.timeout(3000) }).then(
    (r) => {
      process.exitCode = r.ok ? 0 : 1;
    },
    () => {
      process.exitCode = 1;
    },
  );
} else {
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
}
