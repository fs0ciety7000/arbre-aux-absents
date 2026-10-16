/**
 * Les 34 marques de l'affaire `marques-de-longuegreve` (docs/scenario/affaire-3/09-marques.md §4–§5) :
 * 23 marques justes (19 cases + 4 marques de fille, `altPortraits`) et 11 leurres (D1–D11).
 * `id` : nom de travail de la bible (`lg-m-…`), jamais publié : le fichier prend l'id neutre de
 * `art/tools/portraits/ids-marques-de-longuegreve.json` (même table que les visages de l'affaire).
 * `style` : rendu de la case (le relevé de Marest ; les deux gravures D10 et D11 gardent leur facture).
 */
export const MARKS = [
  // ── marques justes (23) ──
  { id: 'lg-m-y', code: 'Y', slot: 'C01', who: 'Gervais Goémard' },
  { id: 'lg-m-y-t-o', code: 'Y-tO', slot: 'C02', who: 'Perrine Oyard' },
  { id: 'lg-m-o', code: 'O', slot: 'C03', who: 'Clovis Oyard' },
  { id: 'lg-m-o-t-a', code: 'O-tA', slot: 'C04', who: 'Toinette Cormaud' },
  { id: 'lg-m-a', code: 'A', slot: 'C05', who: 'Siméon Cormaud' },
  { id: 'lg-m-a-t-p', code: 'A-tP', slot: 'C06', who: 'Ursule Lestaud' },
  { id: 'lg-m-p', code: 'P', slot: 'C07', who: 'Lubin Lestaud' },
  { id: 'lg-m-p-t-y', code: 'P-tY', slot: 'C08', who: 'Apolline Goémard' },
  { id: 'lg-m-y-g', code: 'Y-g', slot: 'C09', who: 'Josse Goémard' },
  { id: 'lg-m-y-g-t-p', code: 'Y-g-tP', slot: 'C10', who: 'Reine Lestaud' },
  { id: 'lg-m-p-pt', code: 'P-pt', slot: 'C10', alt: true, who: 'Reine Lestaud (fille, 1868–1879)' },
  { id: 'lg-m-o-g-t-y', code: 'O-g-tY', slot: 'C11', who: 'Jacquette Goémard' },
  { id: 'lg-m-y-pt', code: 'Y-pt', slot: 'C11', alt: true, who: 'Jacquette Goémard (fille, 1868–1876)' },
  { id: 'lg-m-o-g', code: 'O-g', slot: 'C12', who: 'Médard Oyard' },
  { id: 'lg-m-y-d', code: 'Y-d', slot: 'C13', who: 'Blaise Goémard' },
  { id: 'lg-m-p-g-t-o', code: 'P-g-tO', slot: 'C15', who: 'Ernestine Oyard' },
  { id: 'lg-m-o-pt', code: 'O-pt', slot: 'C15', alt: true, who: 'Ernestine Oyard (fille, 1869–1877)' },
  { id: 'lg-m-p-g', code: 'P-g', slot: 'C16', who: 'Fulbert Lestaud' },
  { id: 'lg-m-p-d', code: 'P-d', slot: 'C17', who: 'Benoît Lestaud' },
  { id: 'lg-m-a-b', code: 'A-b', slot: 'C19', who: 'Noël Cormaud' },
  { id: 'lg-m-a-b-t-p', code: 'A-b-tP', slot: 'C20', who: 'Honorine Lestaud' },
  { id: 'lg-m-p-pt2', code: 'P-pt-pt', slot: 'C20', alt: true, who: 'Honorine Lestaud (fille, 1876–1885)' },
  { id: 'lg-m-o-g-g', code: 'O-g-g', slot: 'C23', who: 'Elzéar Oyard' },
  // ── leurres (11) ──
  { id: 'lg-m-a-g', code: 'A-g', decoy: 'D1', who: 'Jean Cormaud, noyé en 1869' },
  { id: 'lg-m-a-d', code: 'A-d', decoy: 'D2', who: 'Yves Cormaud, noyé en 1869' },
  { id: 'lg-m-mer', code: 'mer', decoy: 'D3', who: 'marque de mer (noyés inconnus de l’Aurore)' },
  { id: 'lg-m-o-d', code: 'O-d', decoy: 'D4', who: 'Ange Oyard, parti en mer' },
  { id: 'lg-m-y-pt2', code: 'Y-pt-pt', decoy: 'D5', who: 'Marthe Goémard, morte enfant' },
  { id: 'lg-m-y-g-g', code: 'Y-g-g', decoy: 'D6', who: 'aviron de Gatien (qui signe)' },
  { id: 'lg-m-a-b-g', code: 'A-b-g', decoy: 'D7', who: 'aviron de Lazare (qui signe)' },
  { id: 'lg-m-p-g-pt', code: 'P-g-pt', decoy: 'D8', who: 'Delphine Lestaud' },
  { id: 'lg-m-x', code: 'X', decoy: 'D9', who: 'copie du commis (registre de 1877)' },
  { id: 'lg-m-fourche-couronnee', code: 'fourche-couronnee', decoy: 'D10', style: 'gravure', who: 'marque de commerce du Comptoir' },
  { id: 'lg-m-ile', code: 'ile', decoy: 'D11', style: 'gravure', who: 'cartouche du plan de 1868, cloche' },
];
