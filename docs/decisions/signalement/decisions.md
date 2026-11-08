tags: contribution, openstreetmap, vie-privee

# Signalement : ajouter une place, corriger un lieu

## D1 — Où envoyer les signalements ?

> **Remplacée par D5** : l'appli n'envoie plus de notes.

**Options**
- Renvoyer vers l'éditeur OpenStreetMap.
- Une base à nous, avec un serveur.
- Des notes OpenStreetMap créées depuis l'appli, plus un lien vers la fiche Acceslibre.

**Choisi** : des notes OSM anonymes (API `notes.json`, autorisée depuis un navigateur), plus le
lien Acceslibre pour corriger la fiche complète d'un lieu.

**Écarté**
- L'éditeur OSM : bien trop complexe pour l'utilisatrice visée.
- Une base à nous : il faudrait un serveur et une modération, et les signalements resteraient
  enfermés dans l'appli au lieu de profiter à toutes les cartes qui utilisent OSM.

## D2 — Comment éviter de polluer la vraie carte pendant les essais ?

> **Remplacée par D5** : l'appli n'envoie plus de notes.

**Choisi** : en développement (`import.meta.env.DEV`), les notes partent sur le serveur de test
`master.apis.dev.openstreetmap.org`. Seul le build de production écrit sur la vraie carte.

**Écarté** : un interrupteur manuel, trop facile à oublier.

## D3 — Que montrer avant que la carte soit mise à jour ?

> **Remplacée par D5** : l'appli n'envoie plus de notes.

**Choisi** : la place signalée est gardée sur le téléphone (`localStorage`) et affichée en
pointillés, tout de suite.

**Écarté** : ne rien afficher. La personne croirait que son signalement n'a pas marché, et
la vérification par les bénévoles peut prendre des semaines.

## D4 — Que peut-on répondre sur un lieu ?

> **Remplacée par D5** : l'appli n'envoie plus de notes.

**Options** : quelques corrections en une touche ; un questionnaire avec toutes les catégories ;
un juste milieu.

**Choisi** : quatre questions « Oui / Non » toujours visibles, celles qui décident si l'on peut y
aller (entrée sans marche, toilettes adaptées, toilettes au rez-de-chaussée, place handicapée tout
près). Six autres attendent derrière « Ajouter des détails » (rampe, largeur et type de porte,
sonnette, intérieur, ascenseur). Aucune n'est obligatoire, toucher à nouveau une réponse l'efface,
et « Envoyer » montre le résumé avant d'envoyer une seule note. La note donne aussi les étiquettes
OSM quand elles sont évidentes (`toilets:wheelchair=no`…), pour les bénévoles. Les places
handicapées gardent leurs trois corrections en une touche.

**Écarté** :
- Les quatorze questions d'un coup, rangées par thème : essayé, beaucoup trop long à l'écran.
- Un champ de texte libre : écrire est difficile après un AVC, et c'est plus long à vérifier.

## D5 — Ne plus envoyer de notes anonymes

**Contexte** : des contributeurs d'OpenStreetMap se sont plaints sur le forum francophone
(novembre 2026). Leurs reproches :
- Les notes de Handiplan étaient anonymes : impossible de répondre ou de poser une question.
- Elles demandaient aux bénévoles un travail qu'on pouvait faire soi-même en modifiant le lieu
  (`wheelchair`, `toilets:wheelchair`…).
- Certaines formulations étaient trompeuses (« toilettes au rez-de-chaussée » ne veut pas dire
  « accessibles »).

Ils envisageaient de fermer automatiquement ces notes, voire de bloquer l'appli.

**Options** :
- Garder les notes en les rendant meilleures.
- Ouvrir la fiche du lieu sur Acceslibre ou OpenStreetMap pour la modifier soi-même.
- Modifier OSM depuis l'appli avec un compte (OAuth).

**Choisi** : pour l'instant, « Modifier ou compléter » ouvre la fiche Acceslibre du lieu
(formulaire guidé), sinon l'éditeur d'OpenStreetMap sur l'objet lui-même. Un lieu absent
d'Acceslibre peut y être ajouté (« Ajouter un établissement », `/contrib/start/`) : c'est plus
simple que l'éditeur d'OSM. Une petite fenêtre prévient avant de quitter l'appli (compte gratuit,
modification signée). Le bouton « place
handicapée ici » ouvre l'éditeur à l'endroit où l'on est. Les modifications sont faites avec son
propre compte et signées de son pseudo. Plus aucune note n'est envoyée.

**Écarté** :
- De meilleures notes anonymes : elles restent anonymes et laissent le travail aux bénévoles.
- L'OAuth tout de suite : c'est la bonne suite (les réponses deviendraient des étiquettes posées
  sur le lieu), mais il faut d'abord enregistrer l'appli sur OpenStreetMap et bien la tester.

## D6 — Placer précisément une place handicapée avant de l'ajouter

**Contexte** : le GPS d'un téléphone se trompe souvent de 10 à 30 m. Ouvrir OpenStreetMap
directement à la position donnait des places approximatives, ce que la communauté a aussi relevé.

**Choisi** : une petite carte avec un repère bleu fixe au milieu. On fait glisser la carte dessous
(sans inertie, pour s'arrêter là où le doigt lâche), et l'adresse la plus proche s'affiche pour
confirmer l'endroit (géocodage inverse de la Géoplateforme). « C'est ici » ouvre OpenStreetMap
exactement à ce point.

**Écarté** : faire glisser un marqueur. Viser un petit point avec le doigt est difficile, surtout
après un AVC ; c'est plus facile de faire bouger toute la carte.

## D7 — Répondre dans l'appli, avec un compte OSM

**Choisi** : pour un lieu d'OpenStreetMap, « Modifier ou compléter » propose de répondre ici, une
fois connecté à OSM (OAuth 2 avec PKCE, sans serveur). Comme StreetComplete :
- une question à la fois, avec les valeurs du wiki : entrée `wheelchair` = yes / limited / no,
  toilettes `toilets:wheelchair` = yes / no, ou `wheelchair` pour des toilettes publiques ;
- « Je ne sais pas, passer » n'écrit rien ;
- un résumé « la carte dit / vous dites » avant d'envoyer, signé du pseudo ;
- un groupe de modifications par lieu (`comment` clair, `created_by=Handiplan`,
  `hashtags=#handiplan`), et `check_date:<clé>` à chaque réponse.

**Serveur de test d'abord** : par défaut, tout s'écrit sur `master.apis.dev.openstreetmap.org`.
Les lieux de la vraie carte n'y existent pas : on y crée une copie du lieu, avec les réponses. Rien
n'apparaît sur la vraie carte. Passer à la vraie carte demande de le dire explicitement
(`VITE_OSM_URL=https://www.openstreetmap.org`), après en avoir parlé sur le forum.

Sans appli enregistrée (`VITE_OSM_CLIENT_ID`), l'ancien fonctionnement reste : liens vers Acceslibre
ou l'éditeur d'OSM.

## D8 — Ajouter une place sans quitter l'appli

**Choisi** : connecté à OSM, on place le repère, on touche « C'est ici », on vérifie (adresse la
plus proche, avertissement si une place est déjà connue à moins de 15 m), puis l'appli crée le point
`amenity=parking_space` + `parking_space=disabled` (wiki FR:Tag:parking_space=disabled), dans son
propre groupe (`#handiplan`). Serveur de test par défaut. Sans appli enregistrée, l'éditeur d'OSM
s'ouvre à l'endroit choisi, comme avant.

**Écarté** : l'éditeur d'OSM pour tout le monde. C'était le plus gros saut de difficulté de l'appli.
