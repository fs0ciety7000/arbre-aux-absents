"""Surcharges anglaises des SVG qui portent des mots courants (lot T2, règle 12.8).

    python3 art/tools/locales_en.py

Lit les SVG français (source de vérité) et écrit, pour chacun, une copie dont seuls les textes
changent : même viewBox, mêmes ids, mêmes chemins. Une ligne de la table = un `<text>` repéré par
son contenu français exact ; chaque remplacement doit toucher exactement le nombre d'occurrences
attendu, sinon le script s'arrête (la base a changé : revoir la table). Le résultat est donc
déterministe et se régénère après toute retouche des SVG français (`build.py`, `illustrations/`).

Règles (docs/i18n/en/GLOSSAIRE.md) : noms propres, lieux de la carte, sigles, dates numériques et
chiffres inchangés ; anglais britannique ; `N°` → `No.` ; heures `23 h 10` → `23.10`.
Écrit `art/map/locales/en/labels.svg` et `content/cases/<id>/locales/en/illustrations/<nom>.svg`.
Python 3.10+, aucune dépendance.
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))

# (texte FR, texte EN, occurrences, attributs à remplacer {nom: valeur} ou None)
MAP_LABELS = [
    ('estuaire', 'estuary', 1, None),
    ('marais de Grisenoue', 'Grisenoue marshes', 1, None),
    ('collines de Sorbe', 'Sorbe hills', 1, None),
    ('route de Brénica', 'Brénica road', 1, None),
    ('ligne des Paquebots de l’Orvelle', 'Orvelle Packet line', 1, None),
    ('O', 'W', 1, None),  # rose des vents : ouest
    ('Échelle de dix lieues velmarchoises', 'Scale of ten Velmarche leagues', 1, None),
    ('la lieue vaut 4,6 km', 'one league = 4.6 km', 1, None),
    ('Carte de la Velmarche et de l’Ostrie', 'Map of Velmarche and Ostrie', 1, None),
    ('La Velmarche', 'Velmarche', 1, None),
    ('pour l’Office de Réinscription civile, d’après la carte',
     'for the Civil Re-registration Office, after the map', 1, None),
    ('de la Grande Exposition (1889), revue en 1974', 'of the Grand Exhibition (1889), revised 1974', 1, None),
    ('dressée et gravée par CM Creative Lab', 'drawn and engraved by CM Creative Lab', 1, None),
]
MAP_TITLE = ('La Velmarche : toponymes, cadre et cartouche', 'Velmarche: place names, frame and cartouche')

H = 'revenant-hautcorvin'
ILLUSTRATIONS = {
    (H, 'cp-01'): [('Cap de Tennok — le phare', 'Cap de Tennok — the lighthouse', 1, None)],
    (H, 'cp-02'): [('Vernezac — la Combe-aux-Sables, les carriers',
                    'Vernezac — the Combe-aux-Sables, the quarrymen', 1, None)],
    (H, 'ct-01'): [('N° 112', 'No. 112', 1, None)],
    (H, 'ex-02'): [('A — billet au crayon, 1.12.1937', 'A — pencilled note, 1.12.1937', 1, None),
                   ('A contre B – E', 'A against B – E', 1, None)],
    (H, 'ex-03'): [('III — négatif du 9.1.76', 'III — negative of 9.1.76', 1, None)],
    (H, 'lt-05'): [('Destinataire absent', 'Addressee absent', 1, None),
                   ('Loi du 2 février 1938, art. 6', 'Act of 2 February 1938, Art. 6', 1, None)],
    (H, 'lt-06'): [('N° 4117', 'No. 4117', 1, None)],
    # inscription gravée plus longue : corps 15 → 13,5 pour rester dans le gobelet
    (H, 'ob-02'): [('À la fille du souffleur', 'To the glassblower’s daughter', 1, {'font-size': '13.5'})],
    (H, 'pb-01'): [('ses guides · ses pistes · son refuge', 'its guides · its trails · its refuge', 1, None)],
    (H, 'ph-08'): [('Pour B. — L. — août 37', 'For B. — L. — August 37', 1, None)],
    (H, 'ph-16'): [('École de ski', 'Ski school', 1, None),
                   ('POSTES', 'POST OFFICE', 1, {'font-size': '11'})],
    (H, 'rg-11'): [('Liste n° 9', 'List No. 9', 1, None)],
    (H, 'rg-18'): [('23 h 10 — M. B. au magasin…', '23.10 — M. B. at the packing…', 3, None)],
}


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def translate(svg, table, where):
    for fr, en, count, attrs in table:
        pat = re.compile(r'(<text\b[^>]*>)' + re.escape(esc(fr)) + r'(</text>)')
        found = len(pat.findall(svg))
        if found != count:
            sys.exit(f'{where} : « {fr} » trouvé {found} fois, {count} attendu(s)')

        def repl(m, en=en, attrs=attrs):
            tag = m.group(1)
            for k, v in (attrs or {}).items():
                tag, n = re.subn(rf'\s{k}="[^"]*"', f' {k}="{v}"', tag)
                if n != 1:
                    sys.exit(f'{where} : attribut {k} absent de « {fr} »')
            return tag + esc(en) + m.group(2)

        svg = pat.sub(repl, svg)
    return svg


def write(rel, svg):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(svg)
    print(rel)


def main():
    with open(os.path.join(ROOT, 'art', 'map', 'labels.svg'), encoding='utf-8') as fh:
        svg = fh.read()
    if svg.count(MAP_TITLE[0]) != 1:
        sys.exit('labels.svg : titre introuvable')
    svg = translate(svg.replace(MAP_TITLE[0], MAP_TITLE[1]), MAP_LABELS, 'labels.svg')
    write('art/map/locales/en/labels.svg', svg)
    for (case, name), table in ILLUSTRATIONS.items():
        base = os.path.join('content', 'cases', case, 'illustrations', f'{name}.svg')
        with open(os.path.join(ROOT, base), encoding='utf-8') as fh:
            svg = fh.read()
        write(os.path.join('content', 'cases', case, 'locales', 'en', 'illustrations', f'{name}.svg'),
              translate(svg, table, base))


if __name__ == '__main__':
    main()
