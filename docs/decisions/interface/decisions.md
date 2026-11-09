tags: design, accessibilite, carte, mise-en-page, installation, lieux-non-accessibles

# Interface : choix pour une personne après un AVC

## D1 — Carte, liste, ou les deux ?

**Options** : grande carte seule, liste seule, carte qui défile avec la liste, liste qui glisse
par-dessus la carte, ou carte fixe avec liste qui défile dessous.

**Choisi** : carte toujours visible, et seule la liste en dessous défile, dans sa propre zone.

**Écarté**
- Liste qui glisse par-dessus la carte : l'écran change de forme, ce qui désoriente et agace.
- Carte qui défile hors de l'écran : il faut remonter pour la retrouver.
- Carte seule : la carte devient obligatoire à lire. Liste seule : on perd le « autour de moi ».

## D2 — Combien de filtres ?

**Options** : aucun, un filtre par type (toilettes, santé, manger…), ou un seul filtre à 3 choix.

**Choisi** : Tout / Lieux / Se garer.

**Écarté**
- Une catégorie Santé : les pharmacies accessibles font déjà partie des lieux.
- Un bouton Toilettes séparé : c'est le cœur de l'appli, il est donc dans tous les lieux affichés.
- « Manger » : trop restrictif, on va aussi dans un magasin ou un musée.

## D3 — Quelles couleurs ?

**Options** : une palette « jardin » calme, ou les couleurs du drapeau de la fierté handicapée.

**Choisi** : la palette jardin. Les places handicapées sont en bleu avec un P blanc, comme au sol
en France. Le drapeau reste présent en clin d'œil sur l'icône de l'appli.

**Écarté** : les couleurs du drapeau. Elles sont pâles, et son gris de fond a été jugé triste.

## D4 — App native ou site installable ?

**Options** : une app native iOS (App Store), une app empaquetée (Capacitor), ou un site
installable sur l'écran d'accueil.

**Choisi** : un site installable : icône, plein écran, invitation « Installer » en 3 gestes sur
iPhone. Le même site sert la version ordinateur.

**Écarté** : l'App Store, qui demande un compte développeur payant et une validation par Apple.
Capacitor reste possible plus tard si on a besoin d'une vraie app.

## D5 — Fond de carte

**Options** : tuiles OpenStreetMap standard, CARTO, plan IGN.

**Choisi** : le plan IGN (Géoplateforme, sans clé), légèrement adouci en CSS.

**Écarté** : OSM standard, trop chargé en pictogrammes pour quelqu'un qui fatigue vite. CARTO,
qui demande maintenant une clé.

## D6 — Afficher les lieux pas accessibles ?

**Options** : ne pas les afficher, les afficher en jaune, ou les afficher en gris et plus petits.

**Choisi** : en gris, plus petits et un peu transparents sur la carte (30 au maximum, sous les
autres pictos), et en fin de liste sous le titre « Pas accessibles ». La fiche dit pourquoi
(« 2 marches à l'entrée, pas de rampe »). Ça évite de se déplacer pour rien vers un lieu précis.

**Écarté**
- Ne pas les afficher : on ne pouvait pas savoir qu'un restaurant précis n'est pas accessible.
- Le jaune : il veut déjà dire « à vérifier ». « Peut-être » et « non » doivent rester distincts.

Les lieux sans aucune information sont traités en D7.

## D7 — Afficher les lieux sans aucune info d'accessibilité ?

**Options** : les masquer, ou les afficher discrètement.

**Choisi** : afficher les bars, cafés, restaurants et toilettes publiques sans info, en petit,
blancs à bord pointillé, après les lieux « pas accessibles » dans la liste. La fiche propose
« Dire si c'est accessible » (modification sur OpenStreetMap, voir signalement D5). Les magasins sans info restent masqués : ils
seraient trop nombreux.

**Écarté** : les masquer (D6). À Romainville, il manquait ainsi la plupart des bars, alors qu'ils
existent dans OpenStreetMap, seulement sans info d'accessibilité.

## D8 — Taille des pastilles « pas accessible » et « inconnu »

**Choisi** (2026-11-05) : même taille que les autres lieux. Seule la couleur les distingue : gris
pour « pas accessible », blanc à bord pointillé pour « inconnu ». Elles restent dessinées sous les
autres pastilles.

**Écarté** : des pastilles plus petites et transparentes (D6, D7). Elles étaient difficiles à
toucher et à lire ; la couleur suffit à les distinguer.

## D9 — Une seule règle des couleurs

**Choisi** (2026-11-05) : `src/features/places/utils/color.utils.ts` décide la couleur à partir de
deux faits, l'entrée et les toilettes, pour toutes les sources : vert = tout bon ; jaune = en partie
(une partie va, ou on ne sait pas tout) ; gris = rien d'accessible ; pointillé = on ne sait rien.
L'étiquette de la liste dit « En partie » au lieu de « À vérifier ».

**Écarté** : une règle par source. OSM et Acceslibre donnaient des couleurs différentes pour la même
situation (des marches mais des toilettes adaptées : gris chez l'un, jaune chez l'autre), ce que
l'utilisatrice trouvait incompréhensible.

## D10 — Toutes les catégories dans la fiche d'un lieu

**Options** : seulement l'entrée et les toilettes ; tout ce que les sources savent.

**Choisi** : tout ce qui est renseigné, rangé par thème dans l'ordre du trajet (se garer, depuis la
rue, entrée, intérieur, toilettes, accueil). Ce qui n'est pas renseigné n'apparaît pas : la fiche
ne s'allonge que pour les lieux bien décrits. La fiche défile, et ne se ferme d'un glissement que
tout en haut. Quand un lieu est dans les deux sources, OpenStreetMap complète les thèmes
qu'Acceslibre ne renseigne pas.

**Écarté** : afficher « on ne sait pas » pour chaque catégorie. Une longue liste de points
d'interrogation noie les deux réponses qui comptent.

## D11 — Bouton « Ma position » en haut à droite

**Choisi** : le bouton en haut à droite ramène la carte autour de soi (et quitte l'adresse
cherchée ; pendant un trajet, il garde le chemin). « D'où viennent les infos » passe en bas de la
liste : on y va rarement, alors qu'on se perd souvent sur la carte.

## D12 — Pour OpenStreetMap, seulement ses critères handicap

**Choisi** : pour les données venues d'OpenStreetMap, l'appli n'affiche que les étiquettes du wiki
qui décrivent le handicap (`wheelchair`, `toilets:wheelchair`, `step_count`, `ramp:wheelchair`,
`automatic_door`, `door:width`, `level`, `hearing_loop`, `wheelchair:description`, places
handicapées). Elle reprend leurs définitions mot pour mot, par exemple « Accès partiel en
fauteuil : marche de 7 cm au plus » pour `limited`. Quand le wiki ne fixe pas de seuil (largeur de
porte, étage), on donne le fait sans le juger (pastille grise « i »).

On n'affiche plus les étiquettes qui ne parlent pas de handicap (gratuit ou payant, table à langer,
durée de stationnement).

Acceslibre garde ses propres critères : c'est une base officielle française, faite pour
l'accessibilité, qui en décrit beaucoup plus (pente, sol, personnel formé, accueil des personnes
sourdes).

**Écarté** : nos propres seuils (« porte étroite » sous 77 cm) et nos propres formulations
(« une marche ou une porte étroite possible »). Ils pouvaient contredire le sens donné par les
contributeurs.

## D13 — Chercher un café ou un restaurant par son nom

**Contexte** : dans Paris, en tapant le nom d'un restaurant, on ne le trouvait pas. Le géocodeur
de l'IGN connaît les adresses et les lieux publics (mairies, gares), pas les cafés ni les
restaurants. Pour « king falafel », il proposait « Résidence Universitaire Martin Luther King ».

**Choisi** : en plus de l'IGN, on interroge Photon (recherche dans OpenStreetMap, sans clé),
limité aux lieux (`osm_tag` amenity, shop, tourism, leisure ; élargi en D26), autour de soi. On garde les lieux à
moins de 20 km. D'abord ceux dont le nom contient ce qu'on a tapé, puis les noms approchants, du
plus proche au plus loin. Ordre de la liste :
1. les lieux déjà chargés autour (ils ouvrent leur fiche) ;
2. les lieux trouvés par leur nom ;
3. les adresses ;
4. les lieux publics de l'IGN à moins de 20 km.

Un même lieu n'apparaît qu'une fois, et la touche Entrée prend le premier de la liste.

**Écarté** :
- Nominatim : sa règle d'usage interdit l'autocomplétion.
- Chercher par nom dans nos données préparées : elles ne couvrent que la zone autour de soi.

## D14 — Accessible au-delà de « gros boutons »

**Contexte** : avant d'ouvrir le code, une repasse d'accessibilité. Gros textes et gros boutons ne
suffisent pas : il faut aussi le clavier, les lecteurs d'écran, les mains qui tremblent et les
personnes sensibles au mouvement.

**Choisi** :
- **Couleur jamais seule** : chaque état a un symbole et des mots, dans la liste et dans la fiche
  (le lecteur d'écran dit « Oui : Accessible en fauteuil »).
- **Contrastes AA** : le gris passe de #858680 à #696A64 (5:1 sur blanc).
- **Textes de 18 px minimum**, partout.
- **Fenêtres** (fiche, sources, modifier, installer) : Échap ferme, le focus entre et revient,
  Tab reste dedans (`useDialog`). La fiche fermée est `inert`.
- **Fermer sans glisser** : un bouton « Fermer » en haut de la fiche. Glisser reste possible.
- **Une action principale par écran** : « Y aller » seul, en grand.
- **Annonces** : chargement, erreurs et nombre de propositions sont lus par les lecteurs d'écran.
- **Mouvement** : avec « réduire les animations », rien ne glisse ni ne zoome en douceur.
- **Repères** : un titre de page (h1) pour les lecteurs d'écran, une étiquette sur la carte, un
  contour épais au clavier.

Le formulaire « une question à la fois », aligné sur le wiki d'OSM, viendra avec la connexion OSM
(fait depuis : voir `contribution/components/questionnaire.tsx`).

## D15 — Une fiche simple à lire après un AVC

**Contexte** : Acceslibre décrit parfois une dizaine de critères. Tout afficher d'un coup noie
l'essentiel ; après un AVC, chaque info en plus coûte.

**Choisi** :
- La fiche montre d'abord **ce qui décide si l'on peut y aller** : se garer, l'entrée, les
  toilettes. Puis « Y aller ».
- Le reste (chemin depuis la rue, intérieur, accueil) attend derrière **« Voir tous les détails »**.
- Le conseil « demandez au comptoir » n'apparaît que si les toilettes sont adaptées (il s'affichait
  pour tous les cafés Acceslibre, même sans toilettes adaptées).
- **Pas d'icône seule** : « Autour de moi » pour revenir à sa position, « Ajouter une place handicapée » à côté du P.

**Écarté** : tout montrer d'un coup (lourd à lire), ou ne garder que l'essentiel (on perdrait
l'étage, l'ascenseur, l'aide à l'accueil, utiles le jour où l'on en a besoin).

## D16 — Une seule main

**Contexte** : l'utilisatrice n'a qu'une main. Le pouce n'atteint confortablement que le bas de l'écran, et
pincer pour zoomer demande deux doigts.

**Choisi** :
- **Zoom** : deux gros boutons + et −, en bas à droite de la carte (comptés comme un geste à la main).
- **Fiche** : « Fermer » et « Y aller » dans une barre fixe en bas, toujours sous le pouce, même
  quand la fiche défile.
- La dictée reste à côté de la recherche, pour ne pas taper d'une main.

- **Barre du pouce** : la recherche, les filtres et « Autour de moi » descendent en bas de l'écran, comme
  Waze. La carte est en haut : elle se regarde, elle ne se touche plus.
- **Panneau de recherche plein écran**, comme Waze ou Plans : un toucher sur la barre l'ouvre, le
  clavier sort, et rien d'autre à l'écran que le champ, « Annuler » et de grandes lignes
  (récents, lieux, adresses). Il s'affiche par-dessus tout (rendu dans le corps de la page).
- **Le champ reste en bas**, à la place de la barre qu'on vient de toucher, juste au-dessus du
  clavier (le panneau suit la hauteur visible) ; les propositions s'empilent au-dessus. Un champ qui
  sauterait en haut ferait perdre le fil, et le pouce devrait remonter.

## D17 — Répondre d'abord à « est-ce que je peux y aller ? »

**Contexte** : relecture « AVC » de tous les écrans. La fiche alignait des critères (« ✕ 1 marche »,
« ✓ porte de 78 cm », « ! porte à ouvrir ») et laissait faire la synthèse ; l'accueil comptait une
dizaine de zones à toucher ; les couleurs n'étaient expliquées qu'au fond de « D'où viennent les
infos ».

**Choisi** :
- **Un verdict en haut de la fiche** : « Facile », « Attention », « Difficile » (mots revus en D18),
  « On ne sait pas encore », avec, en petit, ce qui gêne (entrée et toilettes seulement).
- **Une légende sous la carte**, avec les mêmes pastilles et leurs mots.
- **« Ajouter une place » sort de la carte**, en bas de la liste : c'est une action rare. La carte
  ne garde que + et −.
- **Des mots plus clairs** : « Où aller » au lieu de « Lieux », « Autour de moi » au lieu de « Ici »,
  « Corriger » au lieu de « Recommencer ».
- **Un seul choix** dans « Modifier ou compléter » quand les questions sont possibles.
- **« Fermer » en bas** de la page des sources, comme partout.

## D18 — Parler de facilité, le fauteuil comme indicateur

**Contexte** : l'utilisatrice n'est pas en fauteuil. Elle est hémiparésique (un côté affaibli, une seule
main) et marche. La vraie question est « est-ce que c'est galère d'y aller ? ». OSM et Acceslibre
décrivent l'accès en fauteuil, ce qui reste un bon indicateur : sans marche, porte large, toilettes
avec barre d'appui, c'est aussi plus facile pour elle.

**Choisi** :
- **Les données restent telles quelles** (`wheelchair`, `toilets:wheelchair`, champs Acceslibre),
  avec leur sens exact (D12). Seuls les mots changent.
- **Facile / Attention / Difficile / Pas d'info** (D21) partout : légende, liste, verdict de la fiche.
  « En fauteuil » n'apparaît plus qu'en détail, comme précision de la donnée.
- **Des questions sur ce qu'on voit** : « Y a-t-il une marche pour entrer ? » (aucune / une petite,
  7 cm au plus / plus haute), qui correspond exactement à `wheelchair=yes/limited/no`.
- **Les mains courantes** (Acceslibre : entrée, chemin extérieur, intérieur) s'affichent quand il
  y a des marches : avec un côté affaibli, pouvoir se tenir change tout.

**Écarté** :
- Inventer des critères « hémiparésie » dans OSM : aucun n'existe, et ils ne seraient lus par
  personne d'autre. Les mains courantes d'OSM ne sont décrites que sur les escaliers
  (`highway=steps` + `handrail`), pas sur les lieux : on ne les lit pas.

## D19 — La recherche monte du bas, sans cacher toute la carte

**Contexte** : le panneau plein écran (D16) laissait un grand vide au-dessus du champ : on ne voyait
plus la carte et on pouvait croire avoir quitté l'appli.

**Choisi** : une feuille qui monte du bas, comme la fiche d'un lieu. Elle prend la hauteur de son
contenu ; le haut de la carte reste visible, grisé. Le champ reste en bas, au-dessus du clavier.
Au premier usage (aucune recherche récente), une phrase dit quoi écrire, avec des exemples, et
rappelle le micro. On ferme avec « Annuler », Échap, ou en touchant la carte grisée.

**Champ vide, les destinations connues** : d'abord « Souvent » (trois fois ou plus, étoile), puis
« Récemment » (horloge), cinq en tout. Un lieu choisi (dans la recherche, ou « Y aller ») compte
aussi, avec son genre (« Café ») ; le toucher rouvre sa fiche. Les destinations fréquentes ne
s'oublient pas. Tout reste sur le téléphone.

**Écarté** : le plein écran façon Waze ou Plans, pensé pour des gens qui connaissent déjà ces
applis ; ici, rester dans le même décor compte plus.

## D20 — Les boutons restent à leur place habituelle, même pour la main gauche

**Contexte** : l'utilisatrice tient son téléphone de la main gauche. On a essayé de passer les actions à
gauche (Y aller, micro, + et −, Annuler), au plus près de son pouce.

**Choisi** : on garde les places habituelles : l'action principale à droite (« Y aller », « Ouvrir
le GPS » après « Fermer »), le micro au bout du champ, « Annuler » à droite, + et − en bas à droite.
Après un AVC, ce qui est appris de longue date tient bien, apprendre une nouvelle disposition
fatigue : toutes ses autres applis mettent l'action principale à droite. Les boutons sont gros et
tout en bas, où le pouce gauche va aussi.

**Écarté** :
- Les actions à gauche : plus près du pouce, mais à contre-courant de ses habitudes (risque de
  toucher « Fermer » au lieu de « Y aller »).
- Un réglage main gauche / main droite : un choix de plus à comprendre.

**À vérifier** : la regarder faire « va à Marlette » ; si elle peine à atteindre la droite, on en
reparle.

## D21 — Suite de l'audit « facile à comprendre » (novembre 2026)

Voir `docs/audit-cognition-accessibilite.md`.

- **Moins de pastilles** sur la carte : 15 utiles et 15 discrètes (carte, D4).
- **Rien d'inventé** : OSM ne décrit pas l'ascenseur d'un lieu. Un lieu à l'étage (`level`) le dit :
  « La carte ne dit pas s'il y a un ascenseur », en attention. Des toilettes inconnues disent quoi
  faire : « à demander sur place ».
- **« Pas d'info »** pour le blanc pointillé (au lieu de « On ne sait pas », qui servait aussi pour
  un seul critère), **« Place handicapée »** en entier dans la légende.
- **« Je ne sais pas, passer »** devient un vrai bouton ; **« Fermer »** partout où rien ne se perd
  (fini « D'accord ») ; **« Ouvrir le GPS »** dit qu'on quitte l'appli.
- **« D'où viennent les infos »** en phrases courtes, les couleurs d'abord.
- Trajet : on zoome jusqu'au niveau 18 pour un chemin court.

Retiré ensuite : un bouton **« Écouter »** sur la fiche. Un choix de plus sur chaque fiche, utile
seulement si la lecture la gêne ; et le téléphone sait déjà lire l'écran à voix haute (« Sélectionner
pour prononcer » sur Android, « Énoncer l'écran » sur iPhone), dans toutes ses applis.

## D22 — Les icônes de Google Maps et Waze, qu'elle connaît

**Contexte** : l'utilisatrice a l'habitude de Waze et de Google Maps. Une icône qu'on connaît se reconnaît plus vite
qu'un mot à lire ; une icône qu'on ne connaît pas, elle, se devine mal.

**Choisi** : copier ces deux applis là où elles ont une icône bien installée :
- **Ma position** : la cible de Google Maps, seule dans un rond blanc, à droite du champ (avant :
  « Autour de moi » en toutes lettres). Le lecteur d'écran dit « Ma position ».
- **Retour** : la flèche ← à gauche du champ de recherche, comme dans les deux applis (avant :
  « Annuler » à droite).
- Restent en mots : « Y aller », « Fermer », les verdicts, et « Annuler » dans les
  feuilles de questions : une icône y serait ambiguë.

Cela remplace « pas d'icône seule » (D15) pour ces deux boutons seulement.


## D23 — L'appli sert à deux choses, et rien d'autre

**Contexte** : l'appli aide une proche à sortir. La développeuse a fixé les deux usages (8 novembre 2026) :
1. regarder autour de soi dans quel café ou restaurant aller ;
2. quand on va quelque part, voir les places handicapées près de l'arrivée (et les cafés du
   quartier), puis ouvrir son appli de guidage (Waze, Google Maps).

**Choisi** :
- **On ne montre que les cafés, restaurants, toilettes publiques et places handicapées**
  (`TYPES_UTILES`). Les magasins, hôtels, musées, mairies… ne servent à aucun des deux usages ; la
  requête OSM ne demande plus les magasins.
- **Après une adresse, on voit tout** : les places pour se garer, et les cafés et restaurants du
  quartier (« sortons dans le Marais »). « Se garer » trie les places par distance : « Les plus
  proches de l'arrivée ». (Essayé puis écarté : passer tout seul sur « Se garer », qui cachait les
  cafés de là-bas.)
- **« Me garer ici » ouvre directement l'appli de guidage** vers la place. La première fois
  seulement, l'écran du trajet s'affiche pour choisir l'appli. Une place n'entre pas dans les
  destinations récentes : la destination, c'est l'adresse.
- **Une place ne se répète pas** : pas de verdict ni de ligne « Place handicapée » sous le titre
  « Place handicapée », ni dans la liste.

**Écarté** : garder l'étape « trajet » à chaque fois (un écran et un toucher de plus) ; tout montrer
« au cas où » (une carte plus chargée pour des lieux qui ne servent pas).

## D24 — Les couleurs d'un feu, et un symbole sur chaque pastille

**Contexte** : relecture des couleurs (8 novembre 2026), contrastes mesurés.
- Les pastilles jaunes « Attention » (jaune pâle) avaient un contraste de 1,05 pour 1 avec le plan :
  presque invisibles (il faut 3 pour 1 pour un élément graphique, WCAG 1.4.11).
- Sur la carte, seule la couleur séparait « facile » de « difficile » (vert et gris de même
  luminosité, 1,14 pour 1) : contraire à « jamais la couleur seule ».
- Le gris de « difficile » se confondait avec le gris pointillé de « Pas d'info », et le gris veut
  souvent dire « désactivé ».

**Choisi** :
- **Vert, orange, rouge**, comme un feu ou le trafic dans Waze et Google Maps : un code déjà appris,
  qui se lit sans effort après un AVC. Orange #C2620A (3,6 pour 1 sur le plan, 4,2 pour 1 avec
  l'icône blanche), rouge #A33A3A (5,6 pour 1). Blanc pointillé pour « Pas d'info », bleu avec un P
  pour les places, inchangés.
- **Un symbole dans le coin de chaque pastille** : ✓, !, ✕ ou ?, les mêmes que la légende. Le
  rouge et le vert ont la même luminosité : le symbole porte le sens pour qui voit mal les couleurs.
- Les mêmes couleurs partout : légende, liste, verdict de la fiche, page des sources.

**Écarté** : garder le gris pour « difficile » (plus doux, mais ambigu et peu lisible sur la carte).

## D25 — L'ordre de la liste

**Contexte** : la liste mettait les plus faciles d'abord, puis « Pas encore d'info », puis
« Difficiles d'accès », chaque groupe par distance. Un lieu sans info à 900 m passait avant un lieu
difficile à 50 m, qu'on voit pourtant depuis le trottoir.

**Choisi** : les plus faciles d'abord (facile et places, puis attention), chacun par distance. Puis
les difficiles et les sans info **mêlés, du plus proche au plus loin**, sous un seul titre :
« Difficiles ou sans info, par distance ». Chaque ligne garde son état en mots.

## D26 — Chercher n'importe quel lieu où l'on va

**Contexte** : la recherche ne trouvait que les cafés, magasins et loisirs d'OpenStreetMap. « Gare
de Lyon », depuis Paris, donnait un hôtel, un dentiste, puis des rues à Lyon : la gare n'était pas
proposée. Or on va aussi à l'hôpital, dans un centre de santé, à la mairie, à la gare.

**Choisi** : Photon cherche tous les genres de lieux où l'on peut aller (`amenity`, `shop`,
`tourism`, `leisure`, `healthcare`, `office`, `railway`, `public_transport`, `aeroway`,
`historic`, `building`, `club`, `craft`, `emergency`, `sport`), toujours sans les rues ni les villes,
que l'IGN donne déjà. On écarte les points qui portent seulement le nom d'un lieu (station de taxi
« Hôpital Saint-Antoine », bouche de métro et station de vélos « Mairie du 11e », arrêts, quais),
et l'on ne garde qu'un lieu par nom et par ville (une gare est à la fois un bâtiment et une
station). La phrase du premier usage cite « hôpital Saint-Antoine » en exemple.

Le nom tapé tel quel passe avant un nom qui le contient (« Hôpital Saint-Antoine » avant « CeGIDD -
Hôpital Saint Antoine »), sans tenir compte des accents ni des traits d'union. Quand un lieu proche
correspond, les adresses à plus de 20 km disparaissent (« Rue de la Gare, Lyon » pour « gare de
lyon »).
