# Données réelles pour roder le rapprochement

Quatre endroits, téléchargés le 9 novembre 2026, pour tester `rapprochement.utils.ts` sur de vraies
données (`rapprochement.reel.test.ts`) : un quartier dense de Paris, le centre d'une ville moyenne, une
ville de banlieue et une petite ville.

| Fichier | Centre | Rayon |
|---|---|---|
| `paris-hotel-de-ville.json` | Hôtel de Ville, Paris | 400 m |
| `tours-centre.json` | place Plumereau, Tours | 500 m |
| `montreuil-centre.json` | centre de Montreuil | 600 m |
| `sarlat.json` | centre de Sarlat-la-Canéda | 500 m |

Seuls les champs utiles sont gardés.

- `osm` : cafés, restaurants, bars et toilettes (Overpass). © les contributeurs d'OpenStreetMap,
  licence ODbL.
- `acceslibre` : les mêmes activités dans le fichier national Acceslibre (data.gouv.fr), Licence
  Ouverte 2.0.

Ne pas les mettre à jour sans relire les paires : les tests comptent les paires de chaque endroit.
