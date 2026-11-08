# Audit : facile à comprendre et accessible (8 novembre 2026)

Fait sur les 14 écrans de l'appli, pour une proche : AVC,
hémiparésie (une seule main), marche. Principe du projet : **le plus simple possible, la meilleure
accessibilité possible**.

## Les références

| Référence | Ce qu'on en retient |
|---|---|
| **W3C, *Making Content Usable for People with Cognitive and Learning Disabilities*** (COGA) | Aider à savoir où l'on est et quoi faire ; un but par écran ; éviter les erreurs et aider à les corriger ; ne pas compter sur la mémoire ; pas de limite de temps ; s'adapter (voix, lecture à voix haute) |
| **WCAG 2.2** (niveau AA) | Contrastes, focus visible et jamais caché (2.4.11), cibles de 24 px au moins (2.5.8), pas de geste à deux doigts ni de glisser obligatoire (2.5.1, 2.5.7), aide au même endroit (3.2.6), ne pas redemander ce qui est connu (3.3.7) |
| **FALC** (Facile à lire et à comprendre, Inclusion Europe) | Phrases courtes, une idée par phrase, mots courants, pas d'abréviation, toujours les mêmes mots pour la même chose, une image avec le texte |
| **Après un AVC** (consignes « aphasia-friendly » des associations d'aide aux personnes après un AVC) | Gros texte, beaucoup d'espace, peu de choix à la fois, icône + mot, pouvoir écouter au lieu de lire, fatigue rapide : aller droit au but |
| **Une main, un côté affaibli** | Tout au pouce, en bas ; aucun geste à deux mains ; et attention à la **négligence ou à la perte du champ visuel d'un côté** (fréquentes après un AVC) : rien d'important ne doit vivre seulement sur un bord |

## Ce qui va déjà bien

- Un verdict en mots en haut de la fiche (Facile / Attention / Difficile), avec symbole et couleur.
- Jamais la couleur seule ; textes de 18 px et plus ; gros boutons.
- Tout ce qu'on touche est en bas : barre du pouce, « Fermer / Y aller », questions.
- Une question à la fois, avec résumé « Vous confirmez » avant d'envoyer, et « Corriger ».
- Dictée à côté du champ ; aide au premier usage ; « Souvent » et « Récemment » (pas besoin de
  se souvenir ni de retaper).
- Fenêtres accessibles au clavier et au lecteur d'écran, animations réduites si demandé.

## À améliorer, par priorité

### 1. Important

1. **Quelle main ?** Les boutons d'action sont à droite (« Y aller », micro, + et −, « Annuler »).
   Si elle tient le téléphone de la main gauche, ils sont au plus loin du pouce ; et si son côté
   droit est touché, elle peut aussi moins bien *voir* ce côté de l'écran. → Lui demander, puis
   un réglage « main gauche / main droite » qui inverse ces boutons.
2. **Écouter au lieu de lire.** Après un AVC, lire fatigue (et l'aphasie touche parfois la
   lecture). → Un bouton « Écouter » sur la fiche, qui lit le verdict et l'essentiel (synthèse
   vocale du téléphone, sans service externe).
3. **La carte d'accueil est trop chargée.** Des dizaines de pastilles se chevauchent : difficile à
   lire et à toucher juste. → Regrouper les pastilles proches (un rond avec un nombre) ou
   n'afficher que les plus proches, comme la liste.
4. **« Au 3e étage » sous « Entrée sans marche ».** Contradictoire : la vraie question est
   « y a-t-il un ascenseur ? ». → Quand un lieu est à l'étage et qu'on ne sait rien de
   l'ascenseur, l'écrire (« Ascenseur : on ne sait pas », en attention) ; et compter l'étage dans
   le verdict.
5. **« Attention » pour des toilettes inconnues.** Le verdict jaune dit « toilettes : on ne sait
   pas », mais la légende réserve « On ne sait pas » au blanc pointillé. Deux sens pour les mêmes
   mots. → Garder « Attention », mais dire ce qu'il faut faire : « Toilettes : à demander sur
   place ».

### 2. Utile

6. **Le trajet** : « Démarrer le guidage » tient sur deux lignes (→ « Y aller »), la carte est
   trop dézoomée, et le tracé ne part pas du point où l'on est (déjà noté).
7. **« Je ne sais pas, passer »** est un lien souligné, petit à viser d'une main. → Un vrai bouton
   (bordure, même hauteur que les autres).
8. **La légende** dit « Place » : seul, le mot est flou. → « Place handicapée » (comme le reste).
9. **« D'où viennent les infos »** reste long et dense pour une lecture FALC. → Une phrase par
   source, le reste derrière « En savoir plus ».
10. **Trois mots pour sortir** : « Fermer », « Annuler », « D'accord ». C'est juste (on ferme une
    info, on annule une action, on valide un message), mais on peut garder « Fermer » partout où
    rien n'est perdu.

### 3. À tester avec elle

- Les mots « Facile / Attention / Difficile » lui parlent-ils, ou préfère-t-elle « Sans souci /
  À vérifier / Galère » ?
- Taille du texte : 18 px suffit-il, ou faut-il un réglage « très gros » ?
- La feuille de recherche qui laisse voir la carte : rassurant, ou distrayant ?
- Combien d'écrans avant la fatigue ? Chronométrer « trouver un café avec toilettes adaptées ».

## Fait (8 novembre 2026)

Les points 3 à 10 sont faits (décision interface D21). Point 2 (« Écouter ») : essayé puis retiré ; si la lecture la fatigue, la lecture à voix haute du téléphone le fera partout. Point 1 : elle tient son téléphone de la
main gauche, mais on garde les boutons à leur place habituelle, à droite, pour ne pas bousculer ses
habitudes (décision D20). Reste la partie « À tester avec elle », dont : atteint-elle bien la
droite du bas de l'écran ?
