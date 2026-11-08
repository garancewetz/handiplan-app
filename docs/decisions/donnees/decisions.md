tags: sources, open-data, api, fusion, cache, donnees-preparees, itineraire, geofabrik, recherche

# Données : d'où viennent les lieux et les places

## D1 — Quelle source pour les places handicapées ?

**Options**
- Un fichier national des places handicapées.
- L'open data de chaque ville (Paris, métropole de Lyon, Nevers, Roubaix…).
- OpenStreetMap (`parking_space=disabled`, `capacity:disabled`).

**Choisi** : OpenStreetMap, environ 102 000 places en France (novembre 2026), interrogeable
partout avec une seule requête.

**Écarté**
- Fichier national : il n'existe pas. La page du ministère sur l'accessibilité du stationnement
  ne liste aucune place, et l'ancienne Base nationale des lieux de stationnement n'est plus tenue.
- Open data des villes : format différent dans chaque ville. À ajouter ville par ville plus tard,
  en complément d'OSM.

## D2 — Comment interroger Acceslibre ?

**Options**
- L'API Acceslibre officielle.
- Télécharger le fichier national (environ 500 Mo) et le découper.
- L'API tabulaire de data.gouv.fr sur ce même fichier.

**Choisi** : l'API tabulaire, filtrée par zone (`latitude__greater`…) et par
`sanitaires_adaptes__exact=true`. Elle répond en environ 3 s, sans clé.

**Écarté**
- API officielle : demande un compte et une clé obtenue via un formulaire.
- Fichier complet : trop lourd pour un téléphone, et il faudrait un serveur pour le découper.

## D3 — Quels lieux Acceslibre garder ?

**Options** : tous les établissements, ou seulement ceux où l'on peut entrer librement.

**Choisi** : liste blanche d'activités (restaurants, cafés, boulangeries, supermarchés, musées,
bibliothèques, cinémas, hôtels, mairies…), dans `description-acceslibre.utils.ts`.

**Écarté** : tous les établissements. Avocats, dentistes ou coiffeurs ont des toilettes adaptées,
mais on y vient sur rendez-vous : y envoyer quelqu'un qui cherche des toilettes serait un piège.

## D4 — Que faire quand un lieu est dans les deux bases ?

**Options** : l'afficher deux fois, garder OSM, garder Acceslibre, ou fusionner.

**Choisi** : fusionner (même lieu à moins de 40 m, nom ressemblant). On garde la description
Acceslibre, plus détaillée sur l'entrée et les toilettes, et le nom OSM, plus soigné.

**Écarté** : afficher deux fois (déroutant), ou garder une seule source (on perdrait soit le
détail, soit la qualité du nom). Les places ne sont jamais fusionnées : deux places voisines
sont bien deux places.

## D5 — Que faire quand Overpass est saturé ?

**Options** : un seul serveur, plusieurs serveurs en relais, ou un serveur à nous.

**Choisi** : d'abord des données préparées à l'avance (D6). En secours : trois serveurs publics en
relais (15 s maximum chacun), chaque source affichée dès qu'elle répond, chaque zone gardée 7 jours
sur le téléphone, et un mode `?demo` avec des données OSM enregistrées du centre de Paris.

**Écarté** : un serveur à nous. C'est trop lourd pour un projet personnel.

**Mis à jour (8 novembre 2026)** : les données préparées n'existent plus (site supprimé) et, ce
jour-là, les trois serveurs internationaux étaient tous en panne (« surchargé », 504, pas de
réponse) : l'appli ne montrait que les lieux d'Acceslibre, une petite partie des bars et restos.
Le serveur d'OpenStreetMap France (`overpass.openstreetmap.fr`, toute la France) répondait : il passe
en premier, 20 s maximum par serveur. Les quartiers déjà vus restent gardés sur le téléphone
(carte, D6), et le message dit ce qui manque : « OpenStreetMap ne répond pas : il manque des cafés,
des restos et les places handicapées », avec « Réessayer ».

## D6 — Interroger les serveurs en direct, ou préparer les données à l'avance ?

**Options**
- En direct à chaque ouverture (Overpass + data.gouv).
- Un proxy à nous (fonction Netlify) avec un cache.
- Préparer chaque semaine toute la France, découpée en zones, et servir des fichiers statiques.

**Choisi** : la préparation hebdomadaire (`scripts/prepare-data.mjs`, lancé par
`.github/workflows/data.yml`, OpenStreetMap lu dans les extraits Geofabrik, voir D8), découpée en zones de 0,02° (environ 2 km) et publiée sur un site Netlify à
part (`handiplan-data`). L'appli lit l'index, puis les 1 à 4 zones autour d'elle. Le direct
ne sert plus que de secours.

**Écarté**
- Le direct seul : en novembre 2026, Overpass ne répondait parfois pas du tout et data.gouv
  mettait 20 s, d'où une appli bloquée.
- Le proxy : il dépend toujours des mêmes serveurs à la première demande, et il ajoute du code
  serveur à maintenir.
- Publier les données avec l'appli, sur le même site : chaque déploiement de l'appli écraserait
  les données, ou les données obligeraient à redéployer l'appli chaque semaine.

Conséquence acceptée : les données ont jusqu'à une semaine de retard.

**Mis à jour (novembre 2026)** : le site des données préparées a été supprimé, et l'appli ne les
lit plus. Elle interroge Overpass et data.gouv en direct, et garde les quartiers déjà vus sur le
téléphone (carte, D6). Le script (`scripts/prepare-data.mjs`) et sa tâche GitHub restent, désactivés
(lancement à la main seulement), au cas où les serveurs publics deviendraient trop peu fiables.

## D7 — Calculer le chemin dans l'appli, ou tout confier à une appli GPS ?

**Options** : ouvrir directement Google Maps, faire tout le guidage dans l'appli, ou afficher le
chemin dans l'appli puis confier le guidage vocal à l'appli GPS de son choix.

**Choisi** : le chemin et la durée sont affichés dans l'appli (itinéraire IGN, gratuit et sans
clé), la position est suivie pendant le trajet, et « Démarrer le guidage » ouvre Plans, Waze ou
Google Maps. Le choix est retenu sur le téléphone.

**Écarté**
- Ouvrir directement Google Maps : on quittait l'appli sans voir où l'on allait.
- Tout faire dans l'appli : le guidage vocal en voiture (recalcul, circulation) représente des mois
  de travail, et c'est une question de sécurité au volant.

## D8 — Pour la préparation, Overpass ou les extraits Geofabrik ?

**Options** : interroger Overpass carré par carré, ou télécharger les extraits quotidiens de
Geofabrik (France et outre-mer) et les filtrer avec osmium.

**Choisi** : Geofabrik et osmium. `osmium tags-filter` fait un tri large, puis
`scripts/lib/prepare.mjs` applique les critères exacts de l'appli (`keepOsm`) et calcule un
point par lieu (`centerOf`).

**Écarté** : Overpass. Le test sur une seule zone de Paris a mis 13 minutes, presque entièrement
à attendre un serveur saturé. Pour la France entière, cela aurait demandé environ 180 requêtes au
même serveur.

## D9 — Comment proposer des suggestions dans la recherche ?

**Options** : le géocodeur seul, ou le géocodeur plus les lieux déjà chargés.

**Choisi** : les lieux déjà chargés dont le nom correspond (« Feria Café ») en premier, puis les
adresses et lieux connus (gares, mairies) du géocodeur de la Géoplateforme, en mode
autocomplétion et classés par proximité. Le géocodeur n'est interrogé qu'après une pause de
250 ms dans la frappe, et à partir de 3 lettres.

**Écarté** : le géocodeur seul. Il ne connaît pas les bars et cafés par leur nom, alors que c'est
souvent ainsi qu'on les cherche.

## D10 — Utiliser Google Places pour compléter l'accessibilité ?

Étude du 2026-11-04, sans code. Google Places (API « New ») renseigne souvent l'entrée, les
toilettes et le parking accessibles en fauteuil (`accessibilityOptions`).

**Ce que disent les règles de Google** ([politiques Places API](https://developers.google.com/maps/documentation/places/web-service/policies))
- Des résultats Places affichés **sur une carte** doivent l'être sur une carte Google : c'est
  incompatible avec nos pictos sur le plan IGN.
- Ils peuvent être affichés **sans carte** (par exemple dans la fiche d'un lieu), avec le logo
  Google.
- Interdiction de stocker ou précharger le contenu, sauf l'identifiant du lieu : c'est
  incompatible avec les données préparées et la mémoire de 7 jours.
- Payant au-delà d'un quota gratuit mensuel. Le tarif exact des champs d'accessibilité n'a pas pu
  être confirmé : à vérifier sur la page de tarifs de Google Maps Platform avant de s'engager.

**Options**
- Ne pas utiliser Google.
- Une requête Google seulement quand on ouvre la fiche d'un lieu « à vérifier » ou « inconnu »,
  affichée en texte dans la fiche avec le logo Google, jamais sur la carte ni en mémoire.
- Passer toute la carte sur Google Maps.

**Choisi pour l'instant** : ne pas utiliser Google. Si la couverture reste insuffisante une fois
les données préparées en ligne, la deuxième option est la seule compatible : compte Google Cloud
avec facturation, clé restreinte aux adresses de l'appli, et budget plafonné.

**Écarté** : passer sur Google Maps (coût à chaque affichage, perte du plan IGN, fin des données
préparées).
