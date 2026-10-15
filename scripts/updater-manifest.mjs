// Construit latest.json (manifeste du plugin updater) à partir des fichiers d'une release GitHub,
// quand tauri-action ne l'a pas envoyé (« Signature not found for the updater JSON » : le nom du
// produit contient « ’ », que GitHub remplace par « . » dans les noms des fichiers).
// Usage : node scripts/updater-manifest.mjs <dossier des .sig> <assets.txt « id nom »> <version>
import fs from 'node:fs';
import path from 'node:path';

const [sigDir, assetsFile, version] = process.argv.slice(2);
const { TAG = `v${version}`, GITHUB_REPOSITORY = 'fs0ciety7000/arbre-aux-absents' } = process.env;
const names = fs
  .readFileSync(assetsFile, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((l) => l.slice(l.indexOf(' ') + 1));

/** Clés de plateforme (générique + type d'installeur) → motif du fichier de mise à jour. */
const targets = [
  { keys: ['windows-x86_64', 'windows-x86_64-nsis'], test: (n) => n.endsWith('_x64-setup.exe') },
  {
    keys: ['darwin-aarch64', 'darwin-x86_64', 'darwin-aarch64-app', 'darwin-x86_64-app'],
    test: (n) => n.endsWith('.app.tar.gz'),
  },
  { keys: ['linux-x86_64', 'linux-x86_64-appimage'], test: (n) => n.endsWith('.AppImage') },
];

const platforms = {};
for (const { keys, test } of targets) {
  const file = names.find(test);
  if (!file) throw new Error(`fichier de mise à jour introuvable pour ${keys[0]}`);
  const sigPath = path.join(sigDir, `${file}.sig`);
  if (!fs.existsSync(sigPath)) throw new Error(`${file}.sig absent de la release`);
  const signature = fs.readFileSync(sigPath, 'utf8').trim();
  const url = `https://github.com/${GITHUB_REPOSITORY}/releases/download/${TAG}/${encodeURIComponent(file)}`;
  for (const key of keys) platforms[key] = { signature, url };
}

process.stdout.write(
  `${JSON.stringify({ version, notes: '', pub_date: new Date().toISOString(), platforms }, null, 2)}\n`,
);
