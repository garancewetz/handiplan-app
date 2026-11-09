# Données réelles pour roder le rapprochement

Neuf endroits, téléchargés le 9 novembre 2026, pour tester `rapprochement.utils.ts` sur de vraies
données (`rapprochement.reel.test.ts`) : un quartier dense de Paris, le centre d'une ville moyenne, une
ville de banlieue et une petite ville.

| Fichier | Centre | Rayon |
|---|---|---|
| `paris-hotel-de-ville.json` | Hôtel de Ville, Paris | 400 m |
| `tours-centre.json` | place Plumereau, Tours | 500 m |
| `montreuil-centre.json` | centre de Montreuil | 600 m |
| `sarlat.json` | centre de Sarlat-la-Canéda | 500 m |
| `lyon-presquile.json` | Presqu'île, Lyon | 500 m |
| `lille-vieux-lille.json` | Vieux-Lille | 500 m |
| `marseille-cours-julien.json` | cours Julien, Marseille | 500 m |
| `dinan.json` | centre de Dinan | 600 m |
| `riquewihr.json` | Riquewihr | 500 m |

Les quatre premiers ont servi à régler les règles ; les cinq suivants à les mettre à l'épreuve, règles
figées, avant d'y corriger ce qu'ils ont révélé.

Seuls les champs utiles sont gardés.

- `osm` : cafés, restaurants, bars et toilettes (Overpass). © les contributeurs d'OpenStreetMap,
  licence ODbL.
- `acceslibre` : les mêmes activités dans le fichier national Acceslibre (data.gouv.fr), Licence
  Ouverte 2.0.

Ne pas les mettre à jour sans relire les paires : les tests comptent les paires de chaque endroit.
