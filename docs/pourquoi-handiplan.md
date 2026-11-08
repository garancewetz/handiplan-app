# Pourquoi Handiplan

**Handiplan aide une proche à sortir.** Elle a eu un AVC : elle est hémiparésique (un côté affaibli,
une seule main) et elle marche. La question n'est pas « est-ce accessible en fauteuil ? » mais « est-ce
que c'est galère d'y aller ? ». Les données décrivent l'accès en fauteuil : c'est un bon indicateur.

Deux usages :
1. choisir un café ou un restaurant autour de soi ;
2. quand on va quelque part (« sortons dans le Marais »), voir les cafés et les places handicapées
   du quartier, puis ouvrir Waze ou Google Maps pour y aller.

C'est un projet personnel. Il n'est pas prévu de l'ouvrir à d'autres personnes ; s'il l'était, on en
parlerait d'abord sur le forum OpenStreetMap.

## Ce qu'aucune appli existante ne réunit

| Besoin | Handiplan | Applis existantes |
|---|---|---|
| Les **toilettes adaptées dans les cafés et restaurants**, pas seulement les toilettes publiques | Oui (OSM + Acceslibre) | Handipressante : toilettes seulement. Google Maps : l'entrée, rarement les toilettes. |
| Les **places handicapées autour de l'arrivée**, pour choisir où se garer | Oui | Wheelmap, Google Maps : non, ou noyées dans le reste |
| **OpenStreetMap et Acceslibre réunis** pour le même lieu | Oui | Chacune lit une seule base |
| Une interface **après un AVC** : gros textes, gros boutons, peu de choix, une action par écran, des mots simples | Oui (voir `decisions/interface`) | Faites pour tout le monde, donc plus chargées |
| **Accessible** au clavier et au lecteur d'écran, sans glisser, sans animations | Oui (décision interface D14, tests de bout en bout) | Variable |

## Les autres applis regardées

- **Wheelmap** : la plus proche (mêmes données OSM).
- **On Wheels** : itinéraire en un toucher, places handicapées ; surtout la Belgique.
- **StreetComplete** : pour *compléter* la carte, pas pour se déplacer. Sert de modèle pour la
  contribution (voir `bien-contribuer-a-osm.md`).
- **Google Maps** (option « lieux accessibles ») : beaucoup de lieux, surtout l'entrée.
- **Handipressante** : toilettes adaptées seulement.

## Ce que Handiplan s'engage à respecter

- **Aucune note anonyme.** On modifie le lieu soi-même, avec son compte OSM (décision signalement D5).
- **Seulement les critères handicap d'OSM**, avec leur sens exact (décision interface D12).
- **Rien d'inventé** : quand les données ne disent rien, l'appli le dit.
- **Le serveur de test d'abord** : rien n'est écrit sur la vraie carte sans l'avoir annoncé.
