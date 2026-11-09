# Handiplan face aux bonnes pratiques d'OpenStreetMap

Ce document fait deux choses :
1. il résume ce qu'OpenStreetMap attend d'une appli qui lit et modifie ses données ;
2. il passe Handiplan au crible de ces règles : ce qui va, ce qui ne va pas, ce qu'on change.

Point de départ : en novembre 2026, des contributeurs du forum francophone se sont agacés des notes
anonymes envoyées par l'appli (voir `decisions/signalement`, D5).

Pages lues le 7 novembre 2026 :
- [Guide du débutant](https://wiki.openstreetmap.org/wiki/FR:Guide_du_d%C3%A9butant)
- [Bonnes pratiques](https://wiki.openstreetmap.org/wiki/FR:Bonnes_pratiques)
- [Notes](https://wiki.openstreetmap.org/wiki/FR:Notes)
- [`wheelchair`](https://wiki.openstreetmap.org/wiki/FR:Key:wheelchair)
- [`toilets:wheelchair`](https://wiki.openstreetmap.org/wiki/FR:Key:toilets:wheelchair)
- [`parking_space=disabled`](https://wiki.openstreetmap.org/wiki/FR:Tag:parking_space%3Ddisabled)
- [Édition organisée](https://wiki.openstreetmap.org/wiki/FR:Organised_Editing_Guidelines)
- [Code de conduite des modifications automatiques](https://wiki.openstreetmap.org/wiki/Automated_Edits_code_of_conduct)
- [Règles d'attribution](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines)
- [OAuth](https://wiki.openstreetmap.org/wiki/OAuth)

---

## 1. Ce que dit OpenStreetMap, en bref

### Les notes
- Une note sert à **se parler entre humains** : on signale une erreur à des contributeurs
  expérimentés quand on ne peut pas la corriger soi-même.
- Elles sont publiques. Il vaut mieux être connecté, pour que quelqu'un puisse vous répondre.
- **Ne pas créer de notes de façon automatique.** Une appli doit expliquer que les notes
  servent aux erreurs de carte, pas aux retours sur l'appli.

### Modifier la carte
- On **corrige et on complète**, on ne supprime pas ce qui existe.
- On cartographie **ce qu'on voit sur le terrain**, pas ce qui arrange l'affichage.
- Quand on sait quoi corriger, on modifie l'objet soi-même plutôt que de laisser une note.

### Les étiquettes qui nous concernent
- **`wheelchair`** :
  - `yes` = pas de restriction, entrée sans marche ;
  - `limited` = accès partiel, une marche de **7 cm au plus** ;
  - `no` = marche de plus de 7 cm.
  Il n'y a **pas de valeur par défaut** : une étiquette absente veut dire « on ne sait pas ».
  Pour préciser, on utilise `wheelchair:description:fr`.
- **`toilets:wheelchair`** : à mettre sur un commerce ou un restaurant. `yes` demande des critères
  précis : porte d'au moins 90 cm, espace de 150 × 150 cm, barre d'appui, lavabo accessible…
  Pour des toilettes publiques (`amenity=toilets`), on utilise `wheelchair`.
- **`parking_space=disabled`** : une place handicapée, avec `amenity=parking_space`. La place
  fait au moins 3,30 × 5 m.

### Une appli qui fait modifier la carte à ses utilisateurs
- **Connexion OAuth 2.0** (avec PKCE pour une appli sans serveur). On enregistre l'appli sur
  openstreetmap.org, et chaque modification est signée par le compte de la personne.
- **Tester sur le serveur de test** (`master.apis.dev.openstreetmap.org`) avant de toucher la
  vraie carte.
- **Édition organisée** : si plusieurs personnes modifient la carte via un même outil ou projet,
  on crée une page wiki, on l'annonce publiquement et on surveille la qualité.
- **Modifications automatiques** (scripts, imports, changements en masse) : on en discute
  d'abord, on teste à petite échelle. Sinon, c'est traité comme du vandalisme.

### Réutiliser les données
- **Attribution** : la carte doit afficher « OpenStreetMap », lisible, avec un lien vers la
  licence.
- **Licence ODbL** : une base de données dérivée qu'on publie doit elle aussi être publiée sous
  ODbL, avec l'attribution.

---

## 2. Handiplan au crible

✅ conforme · ⚠️ à améliorer · ❌ à corriger

### Lire les données

| Point | État | Détail |
|---|---|---|
| Étiquette absente = « on ne sait pas » | ✅ | Les lieux sans info sont blancs en pointillé, jamais classés « accessibles ». |
| Toilettes publiques : `wheelchair` | ✅ | `osm-description.utils.ts` lit bien `wheelchair` sur `amenity=toilets`. |
| Ne jamais afficher « toilettes adaptées » sans source explicite | ✅ | Règle du projet, respectée : seulement si `toilets:wheelchair` (ou Acceslibre) le dit. |
| Texte de `wheelchair` | ✅ (corrigé) | Définitions du wiki, mot pour mot : « Accès partiel en fauteuil : marche de 7 cm au plus ». |
| Seulement des critères handicap OSM | ✅ (corrigé) | Plus d'étiquettes sans rapport (gratuit, table à langer…), plus de seuils inventés (décision interface D12). Acceslibre garde ses propres critères. |
| `wheelchair:description:fr` | ✅ | Affichée dans la fiche (« Précision laissée par un visiteur »). |
| Places handicapées | ✅ | `parking_space=disabled` et `capacity:disabled` sont lus. |
| Toilettes publiques sans `wheelchair` | ✅ (corrigé) | Elles s'affichaient « accessibles » par défaut, même notées `toilets:wheelchair=no`. On lit maintenant cette étiquette, et sans info on affiche « inconnu ». |

### Attribution et licences

| Point | État | Détail |
|---|---|---|
| « © OpenStreetMap » sur la carte, avec lien | ✅ (corrigé) | En premier dans le coin de la carte, lien vers /copyright. Sur téléphone, la mention « Leaflet » la repoussait hors de l'écran : retirée. |
| Source de chaque lieu | ✅ | « Source : Acceslibre et OpenStreetMap » en bas de la fiche. |
| **Données préparées** (script désactivé) | ✅ | Si on les republie un jour, le script écrit un `README.txt` et un champ `licences` dans `index.json` : « © OpenStreetMap contributors, ODbL », « Acceslibre, Licence Ouverte 2.0 ». |
| Page « D'où viennent les infos » | ✅ | Cite OpenStreetMap (ODbL), Acceslibre (Licence Ouverte), la Base Adresse Nationale, l'IGN et Photon. |

### Contribuer

| Point | État | Détail |
|---|---|---|
| Notes anonymes | ✅ (corrigé) | Plus aucune note depuis la décision D5. |
| Modifier soi-même | ✅ | Avec un compte OSM : deux questions dans l'appli, façon StreetComplete (voir plus bas). Sans compte : la fiche Acceslibre ou l'éditeur iD, conforme mais trop complexe après un AVC (panneaux, termes techniques, petit texte). |
| Placer une place handicapée | ✅ | Un repère à placer précisément avant d'ouvrir l'éditeur (décision D6). |
| Repérer les modifications venues de Handiplan | ✅ (corrigé) | Les liens vers iD pré-remplissent `#handiplan` (paramètre `hashtags`, documenté dans l'API d'iD). La communauté peut suivre ces modifications. On ne pré-remplit ni commentaire ni `source=survey` : l'appli ne peut pas savoir si la personne est sur place. |
| Édition organisée | ⚠️ | Dès qu'il y a plusieurs utilisateurs : créer une page wiki « Handiplan » (but, contact, étiquettes utilisées) et l'annoncer sur le forum. |

### Modifier depuis l'appli (OAuth)

On répond à deux questions dans Handiplan, et l'appli pose les étiquettes avec **le compte OSM de la
personne** : chaque modification est signée de son pseudo, jamais d'un compte commun. Les règles suivies pour que ce soit bien accueilli (toutes en place, testées de bout en bout ;
pour l'instant sur le serveur de test seulement) :

1. **Connexion OSM obligatoire** pour modifier. La page de connexion d'OSM propose aussi Google.
2. **Une modification = un lieu = un groupe de modifications (changeset)**, avec :
   - `comment` : une phrase claire (« Accessibilité vérifiée sur place : entrée, toilettes ») ;
   - `source=survey` : vu sur place (pas pour une place handicapée, qu'on peut placer de chez soi :
     son commentaire est alors « Place handicapée ajoutée », sans prétendre l'avoir vue) ;
   - `created_by=Handiplan 0.1` : l'appli et sa version ;
   - `hashtags=#handiplan`.
   Et sur le lieu, `check_date:<clé>` à la date du jour pour chaque réponse, comme StreetComplete.
3. **Montrer avant d'envoyer** ce qui va changer, en clair et en étiquettes (« Entrée sans marche →
   `wheelchair=yes` »).
4. **Questions alignées sur le wiki**, pour ne pas poser de mauvaises étiquettes :
   - « Y a-t-il des marches ? Pour entrer, et à l'intérieur » → « aucune marche » = `wheelchair=yes`,
     « une petite marche (7 cm au plus, ou dans une partie du lieu) » = `limited`, « plus haute ou un
     escalier » = `no`. Le wiki définit `yes` pour tout le lieu, pas seulement l'entrée : la question
     le demande donc.
   - « Toilettes adaptées (porte large, barre d'appui, place pour tourner) ? » →
     `toilets:wheelchair=yes` / `no`, ou « Il n'y a pas de toilettes » → `toilets=no` (et pas
     « non adaptées », qui serait faux).
   - **Aucune question hors des critères du wiki** : « toilettes au rez-de-chaussée », par
     exemple, n'a pas d'étiquette, donc on ne la pose pas.
5. **Ne jamais écraser une valeur existante sans le dire** : « OpenStreetMap dit *limité*, vous
   dites *oui* : on remplace ? ».
6. **Tester sur le serveur de test**, puis demander un avis sur le forum avant d'ouvrir à d'autres.

### Ce que fait StreetComplete (le modèle à suivre)

Lu le 8 novembre 2026 : la page wiki de StreetComplete, sa liste de questions, son guide pour créer
une question (`CONTRIBUTING_A_NEW_QUEST.md`) et le code de ses questions « fauteuil »
(`quests/wheelchair_access`). Non lus : les textes exacts affichés (traductions), et la question
sur les toilettes *dans un lieu* (`toilets:wheelchair`).

| Point | StreetComplete | Pour Handiplan |
|---|---|---|
| Réponses « fauteuil » | Trois réponses : Non / Limité / Oui → `wheelchair=no / limited / yes`, les mêmes pour un lieu et pour des toilettes publiques | Les mêmes trois valeurs. Les mots du wiki dessous : « sans marche », « petite marche, 7 cm au plus », « marche plus haute ». |
| Toilettes publiques | `wheelchair` sur `amenity=toilets`, avec date de vérification | Pareil (déjà lu ainsi). |
| Date de vérification | `check_date:wheelchair` écrit à chaque réponse sur des toilettes, même si la valeur ne change pas | Écrire `check_date:wheelchair` à chaque réponse. |
| Redemander | Toilettes : « oui » redemandé après 8 ans, le reste après 4 ans. Lieux : seulement s'il n'y a aucune info | Ne poser que les questions sans réponse ; plus tard, redemander les vieilles infos de la même façon. |
| « Je ne sais pas » | Pas dans le formulaire principal ; les cas rares vont dans un menu « Euh… » | Différence assumée : après un AVC, « Je ne sais pas, passer » reste visible. Il n'écrit **rien**. |
| Notes | Seulement en cas de question impossible (lieu fermé…), pas comme une réponse habituelle ; connexion obligatoire pour envoyer | Pas de note. Si un jour : connectée, écrite à la main. |
| Envoi | Au nom du compte OSM de la personne, un commentaire de changeset par type de question (« Survey wheelchair accessibility of places ») | Un envoi par lieu, commentaire clair, `#handiplan`. |
| Places handicapées | Pas de question trouvée | La petite carte pour placer la place, puis OSM (décision signalement D6). |
| Esprit des questions | « Aucune place au malentendu », concis, rapide ; une info la plus simple possible ; une image plutôt que des mots si un terme est ambigu ; peu de faux positifs ; pas de lieux privés | Une question par écran, de grandes réponses, une photo ou un dessin pour « petite marche ». |

### Utiliser les serveurs

| Point | État | Détail |
|---|---|---|
| Charge sur Overpass | ✅ | Une seule demande pour tous les quartiers manquants (≈ 280 m chacun), puis le quartier est gardé 7 jours sur le téléphone ; d'abord le serveur d'OpenStreetMap France, les serveurs internationaux en secours, un à la fois. Usage personnel. |
| Fond de carte | ✅ | Plan IGN, donc pas de charge sur les tuiles d'OSM. |
| Recherche par nom (Photon) | ✅ | Seulement après 3 lettres et une courte pause, et chaque nouvelle frappe annule la demande précédente. Usage personnel, bien en dessous des limites. |

---

## 3. Ce qui reste à faire

Le code suit les règles ci-dessus, vérifiées par les tests (unitaires et de bout en bout). Avant
d'écrire sur la vraie carte :

1. **Répondre sur le forum**, et recueillir les avis sur la contribution depuis l'appli.
2. **Enregistrer l'appli** sur openstreetmap.org (OAuth 2) et passer `VITE_OSM_URL` sur la vraie
   carte (voir `contribuer-en-test.md`).
3. **Créer une page wiki « Handiplan »** si l'appli est un jour utilisée par d'autres personnes
   (édition organisée).
4. **Vérifier sur la vraie carte** que le lien « Modifier sur OpenStreetMap » pré-remplit bien
   `#handiplan` dans iD (testé seulement dans le code, pas encore sur openstreetmap.org).
