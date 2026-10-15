import { ConfigError, loadConfig } from '../config';
import { openDatabase } from '../db';
import { createReportServer } from '../server';
import type { Logger } from '../service';

/** Point d'entrée : `node dist/server.js` (prod) ou `npm run dev:report` (`--dev`). */

const logger: Logger = {
  info: (msg, data) => console.log(JSON.stringify({ t: new Date().toISOString(), msg, ...data })),
  warn: (msg, data) =>
    console.warn(JSON.stringify({ t: new Date().toISOString(), level: 'warn', msg, ...data })),
};

async function main() {
  const dev = process.argv.includes('--dev');
  const config = loadConfig(process.env, { dev });
  const db = openDatabase(config.dataDir);
  const app = createReportServer({ config, db, logger, timers: true });
  const port = await app.listen();
  logger.info('listening', {
    port,
    github: config.githubToken ? 'configured' : 'disabled',
    repo: config.githubRepo,
    reports: config.reportsEnabled,
    // Origine de la clé des URL signées des pièces jointes, jamais sa valeur.
    attachmentKey: app.attachmentSecretSource,
  });
  if (app.attachmentSecretSource === 'ephemeral') {
    logger.warn('attachments.ephemeral-key', {
      hint: 'ATTACHMENT_SECRET absent : URL des captures invalides après redémarrage',
    });
  }
  let stopping = false;
  const stop = async (signal: string) => {
    if (stopping) return;
    stopping = true;
    logger.info('stopping', { signal });
    const force = setTimeout(() => process.exit(1), 10_000);
    force.unref();
    await app.close();
    db.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => void stop('SIGTERM'));
  process.on('SIGINT', () => void stop('SIGINT'));
}

main().catch((e: unknown) => {
  console.error(
    e instanceof ConfigError ? e.message : `Démarrage impossible : ${(e as Error).message}`,
  );
  process.exit(1);
});
