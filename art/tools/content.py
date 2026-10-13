"""content/world/map.json (WorldMap) et content/world/places/<id>.json (Place).

Positions = ancres des vignettes de places.svg (world.PLACES), arrondies au millième.
Descriptions : ce qu'on voit sur place (bible §3, colonne « Ce qu'on y trouve »), sans rien
du rôle des lieux dans l'affaire.
"""
import json
import re
import os
from common import ASPECT
import world

MAP = {
    'aspect': ASPECT,
    'layers': ['base', 'relief', 'water', 'places', 'labels'],
    'minZoom': 1,
    'maxZoom': 6,
    'title': 'La Velmarche',
    'attribution': 'Carte dressée et gravée par CM Creative Lab',
}

DESCRIPTIONS = {
    'aubrelieu': "Capitale de la République, ville-pont sur l'Orvelle fondée en 1214 : palais des Chartes "
                 "(Archives nationales), Office de Réinscription civile, opéra, citadelle, université, "
                 "quartier des Tanneurs.",
    'moulinvert': 'Bourg industriel sur la Clairette, au pied des collines : roues, cheminées et bassins de '
                  'pâte des Papeteries Varenque, école des filles, cimetière.',
    'foret-de-sorbe': "Hêtraie entre Aubrelieu et Moulinvert ; une vieille papeterie y tombe en ruine au bord "
                      "de l'eau.",
    'lac-d-aulne': "Lac des contreforts, au sud de Moulinvert : chalets d'été, barques et aulnes.",
    'saint-ormel': "Ville épiscopale sur l'Orvelle, en aval d'Aubrelieu : cathédrale, études de notaires, "
                   'greffe.',
    'port-senane': "Grand port de l'estuaire de l'Orvelle sur le golfe d'Ambre : bassins, chantiers navals, "
                   'Compagnie des Paquebots de l\'Orvelle, hôpital maritime, théâtre.',
    'bains-de-merande': "Ville d'eaux des collines côtières du sud-ouest : thermes, sanatorium, Savonnerie "
                        'Mérande, lycée de jeunes filles.',
    'hautcorvin': "Ville de montagne de la haute vallée de l'Orvelle : verreries, garnison, papeterie "
                  "d'apprentissage.",
    'col-de-corvenne': 'Passage des monts Corvins vers la Thalberie : fortins de la guerre des Cols, croix des '
                       'morts.',
    'monts-corvins': "Chaîne du sud-est où naît l'Orvelle : sommets enneigés, forêts de pins.",
    'brenzac': 'Ville frontière thalbère, bilingue, au-delà du col de Corvenne (Brénica en thalbère).',
    'grisenoue': "Bourg des marais, au nord d'Aubrelieu : roselières et ruines calcinées de l'institution "
                 'des Pupilles.',
    'landes-d-ostrie': "Plateau de bruyères du nord : menhirs, bergeries, chemins de pierre. Au-delà, c'est "
                       "l'Ostrie, sa langue et ses fjords.",
    'tennok': 'Pointe nord-ouest de l\'Ostrie : phare blanc à bande rouge, maison du gardien, abri du canot, '
              'recette des postes ; au large, le récif des Dents de Tennok.',
    'vellaak': "Village de pêcheurs au fond d'un fjord : port, séchoirs à poisson, rédaction de Vel Taalik, "
               'atelier de photographie Ilvess.',
    'kessaar': "Rocher de la mer Grise, au large de l'Ostrie : ancien bagne (1938-1952), infirmerie, petit "
               'phare.',
    'mer-grise': 'Mer froide du nord, brumes et phoques.',
    'golfe-d-ambre': "Golfe de l'ouest, aux eaux plus douces ; on ramasse de l'ambre sur ses plages.",
    'orvelle': "Le fleuve de la Velmarche, des monts Corvins au golfe d'Ambre, et la Clairette, son affluent "
               'de rive gauche descendu des collines de Sorbe : bacs, ponts, moulins.',
}


def place_json(pid):
    p = world.PLACES[pid]
    x, y = p['pos']
    out = {
        'id': pid,
        'name': p['name'],
        'kind': p['kind'],
        'position': {'x': round(x, 3), 'y': round(y, 3)},
        'description': DESCRIPTIONS[pid],
        'focusZoom': p['focus'],
        'hitRadius': p['hit'],
    }
    return out


def write(root):
    assert set(DESCRIPTIONS) == set(world.PLACES)
    base = os.path.join(root, 'content', 'world')
    os.makedirs(os.path.join(base, 'places'), exist_ok=True)
    written = []
    with open(os.path.join(base, 'map.json'), 'w', encoding='utf-8') as fh:
        txt = json.dumps(MAP, ensure_ascii=False, indent=2)
        # mise en forme Prettier : tableau court sur une ligne
        txt = re.sub(r'\[\s+([^\[\]]*?)\s+\]', lambda m: '[' + re.sub(r',\s+', ', ', m.group(1)) + ']', txt)
        fh.write(txt + '\n')
    written.append('content/world/map.json')
    for pid in sorted(world.PLACES):
        with open(os.path.join(base, 'places', f'{pid}.json'), 'w', encoding='utf-8') as fh:
            fh.write(json.dumps(place_json(pid), ensure_ascii=False, indent=2) + '\n')
        written.append(f'content/world/places/{pid}.json')
    return written
