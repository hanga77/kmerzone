# KMER ZONE - README des Fonctionnalités

Bienvenue sur la documentation des fonctionnalités de la marketplace KMER ZONE. Ce document détaille les capacités de la plateforme pour chaque type d'utilisateur, en précisant les actions possibles pour chacun.

---

## 👤 Visiteur (Utilisateur non authentifié)

Toute personne accédant à la plateforme sans être connectée dispose des fonctionnalités de base pour explorer le catalogue.

-   **Navigation & Découverte :**
    -   **Actions :** Parcourir la page d'accueil (produits populaires, promotions, ventes flash, boutiques), consulter les pages de détail des produits, naviguer par catégories, visiter les pages des boutiques et utiliser la barre de recherche.
-   **Gestion du Panier :**
    -   **Actions :** Ajouter/supprimer des produits au panier, modifier les quantités. Le panier est sauvegardé dans la session du navigateur.
-   **Comparaison de Produits :**
    -   **Actions :** Ajouter jusqu'à 4 produits à un comparateur pour analyser leurs caractéristiques (prix, note, stock, vendeur) côte à côte.
-   **Consultation de Contenu :**
    -   **Actions :** Visionner les "stories" (publications éphémères de 24h) des boutiques et accéder aux pages d'information (À propos, FAQ, etc.) via le pied de page.

---

## 👨‍👩‍👧‍👦 Client (Utilisateur authentifié)

Le client dispose de toutes les fonctionnalités du visiteur, ainsi que des capacités transactionnelles et de gestion de compte.

-   **Gestion de Compte :**
    -   **Profil :** Mettre à jour son nom et changer son mot de passe.
    -   **Adresses :** Ajouter, modifier, supprimer et définir des adresses de livraison par défaut.
    -   **Boutiques Suivies :** S'abonner à ses boutiques préférées.
-   **Processus d'Achat Complet :**
    -   **Passer Commande :** Finaliser un achat en choisissant une méthode de livraison (domicile ou point de dépôt), un créneau horaire et une méthode de paiement.
    -   **Historique et Suivi :** Consulter la liste de toutes ses commandes, suivre leur statut en temps réel (Confirmée, En livraison, Livrée, etc.) et voir l'historique détaillé des changements de statut.
    -   **Actions sur les Commandes :**
        -   *Annuler* une commande si elle n'est pas encore expédiée.
        -   *Demander un remboursement* pour une commande livrée en fournissant un motif et des preuves (photos).
        -   *Re-commander* facilement les articles d'une commande passée.
-   **Engagement et Fidélité :**
    -   **Favoris (Wishlist) :** Sauvegarder des produits dans une liste de favoris personnelle.
    -   **Avis Clients :** Laisser une note et un commentaire sur les produits achetés (soumis à modération).
    -   **Programme de Fidélité KMER Premium :**
        -   *Devenir Premium :* Soit automatiquement en atteignant des seuils d'achats, soit instantanément en payant une caution.
        -   *Bénéficier d'avantages :* Obtenir 10% de réduction sur les frais de livraison.
        -   *Passer à Premium+ :* Souscrire à un abonnement annuel pour la livraison gratuite et d'autres avantages.
-   **Communication et Support :**
    -   **Messagerie :** Contacter les vendeurs directement depuis une page produit pour poser des questions.
    -   **Support :** Créer des tickets de support (avec possibilité d'associer une commande), y répondre et suivre leur résolution.
    -   **Gestion des Litiges :** Communiquer avec le vendeur et l'administrateur dans un fil de discussion dédié en cas de demande de remboursement.

---

## 🏪 Vendeur (Seller)

Le vendeur accède à un tableau de bord complet pour gérer son activité commerciale.

-   **Intégration et Profil :**
    -   **Inscription :** Remplir un formulaire pour soumettre une demande de création de boutique.
    -   **Gestion Documentaire :** Téléverser les documents requis (CNI, etc.) et suivre leur statut de vérification (En attente, Approuvé, Rejeté).
    -   **Gestion du Profil :** Mettre à jour les informations de la boutique (logo, nom, localisation).
-   **Gestion des Produits :**
    -   **CRUD Produits :** Créer, modifier, et supprimer des fiches produits avec des champs détaillés (marque, poids, dimensions, etc.).
    -   **Gestion des Variantes :** Créer des produits avec des options (ex: Taille, Couleur) et définir le stock et le prix pour chaque combinaison.
    -   **Gestion du Statut :** Publier des produits pour les rendre visibles aux clients ou les conserver en brouillon.
    -   **Import/Export CSV :** Exporter la liste des produits pour une gestion externe.
-   **Gestion des Commandes :**
    -   **Suivi :** Visualiser les commandes en cours, livrées et annulées.
    -   **Mise à jour de Statut :** Marquer une commande comme "Prête pour l'enlèvement" après l'avoir préparée.
    -   **Scanner de Colis :** Utiliser la caméra pour scanner le QR code d'une commande et la marquer automatiquement comme prête.
    -   **Impression d'Étiquettes :** Imprimer une étiquette simplifiée pour chaque commande avec les détails et le QR code de suivi.
-   **Marketing et Promotions :**
    -   **Promotions :** Définir des prix promotionnels avec des dates de début et de fin.
    -   **Ventes Flash :** Proposer des produits pour les événements de vente flash créés par l'administrateur et suivre le statut de la proposition (En attente, Approuvé, Rejeté).
    -   **Codes Promo :** Créer des codes de réduction personnalisés (pourcentage ou montant fixe, avec des conditions).
    -   **Stories :** Publier des images éphémères (visibles 24h) pour mettre en avant des nouveautés.
-   **Finances et Abonnements :**
    -   **Tableau de Bord Financier :** Suivre le revenu brut, les commissions, les paiements reçus (payouts) et le solde actuel à payer.
    -   **Paiement du Loyer :** Payer l'abonnement mensuel de la boutique pour la maintenir active.
-   **Communication :**
    -   **Messagerie :** Répondre aux questions des clients.
    -   **Gestion des Litiges :** Participer aux discussions tripartites (client, vendeur, admin) en cas de demande de remboursement.

---

## 🚚 Agent de Livraison (Delivery Agent)

L'agent de livraison dispose d'une interface optimisée pour ses tournées.

-   **Gestion des Missions :**
    -   **Tableau de bord :** Visualiser la liste des colis à récupérer chez les vendeurs et à livrer aux clients.
    -   **Carte Interactive :** Afficher tous les points de collecte (vendeurs, dépôts) et de livraison sur une carte pour optimiser la tournée.
-   **Suivi et Actions en Temps Réel :**
    -   **Mise à Jour de Statut :** Changer le statut des commandes (`En livraison`, `Livré`, `Échec de livraison`).
    -   **Scanner de Colis :** Utiliser la caméra pour scanner les QR codes des colis afin de confirmer la prise en charge et la livraison.
    -   **Preuve de Livraison :** Télécharger une photo comme preuve de remise du colis.
-   **Gestion Personnelle :**
    -   **Statut de Disponibilité :** Se marquer comme "Disponible" ou "Indisponible" pour recevoir de nouvelles missions.
    -   **Statistiques :** Consulter ses performances (nombre de livraisons, etc.).

---

## 🏢 Agent de Dépôt (Depot Agent)

L'agent de dépôt gère le flux des colis transitant par un point de relais.

-   **Gestion des Flux de Colis :**
    -   **Réception (Check-in) :** Scanner les colis à leur arrivée au dépôt pour les enregistrer dans le système.
    -   **Départ (Check-out) :** Scanner les colis avant leur remise à un client (retrait) ou à un agent de livraison (expédition).
-   **Gestion de l'Inventaire du Dépôt :**
    -   **Assignation d'Emplacement :** Placer virtuellement chaque colis reçu dans un emplacement de stockage (ex: A1, B7).
    -   **Plan de l'Entrepôt :** Visualiser une carte de l'entrepôt avec les emplacements occupés, libres et ceux dont les colis sont en partance.
    -   **Recherche :** Rechercher des colis dans l'inventaire par ID, client, emplacement, etc.
-   **Contrôle Qualité et Rapports :**
    -   **Signalement d'Anomalies :** Signaler un problème sur un colis (emballage endommagé, etc.), ce qui met à jour le statut de la commande.
    -   **Alertes :** Recevoir des alertes pour les colis en stockage depuis une longue période.
    -   **Rapports Journaliers :** Générer et imprimer un rapport des colis reçus et expédiés dans la journée.

---

## 👑 Super Administrateur (Super Admin)

Le Super Admin a un contrôle total sur l'ensemble de la plateforme.

-   **Tableaux de Bord et Supervision :**
    -   **Dashboard Analytique (BI) :** Explorer des visualisations de données détaillées (ventes par catégorie, top produits/boutiques, revenus, etc.) avec des filtres temporels (semaine, mois).
    -   **Logs d'Activité :** Suivre en temps réel toutes les actions importantes effectuées sur la plateforme.
-   **Gestion des Vendeurs et Boutiques :**
    -   **Validation :** Approuver ou rejeter les nouvelles demandes de boutiques.
    -   **Modération :** Suspendre, réactiver, avertir ou promouvoir des boutiques (statut Premium).
    -   **Vérification Documentaire :** Valider ou rejeter les documents soumis par les vendeurs.
-   **Gestion des Utilisateurs :**
    -   **CRUD Utilisateurs :** Créer, voir, et modifier les informations de n'importe quel utilisateur.
    -   **Gestion des Rôles :** Assigner des rôles spécifiques (client, vendeur, agent, etc.).
    -   **Sanctions :** Avertir les agents en cas de problème.
-   **Gestion du Catalogue et du Contenu :**
    -   **Catégories :** Créer et supprimer des catégories de produits.
    -   **Modération des Avis :** Approuver ou rejeter les avis laissés par les clients sur les produits.
-   **Marketing et Opérations :**
    -   **Ventes Flash :** Créer des événements de vente flash et gérer les soumissions des vendeurs.
    -   **Annonces :** Créer des bannières d'annonce pour tous les utilisateurs ou des segments spécifiques (clients, vendeurs).
    -   **Publicité :** Gérer les bannières publicitaires sur la page d'accueil.
-   **Logistique et Finances :**
    -   **Gestion Globale des Commandes :** Superviser toutes les commandes, assigner des livreurs et intervenir.
    -   **Points de Dépôt :** Gérer (créer, modifier, supprimer) les points de retrait sur une carte interactive.
    -   **Paiements (Payouts) :** Gérer et enregistrer les paiements effectués aux vendeurs.
    -   **Gestion des Litiges :** Intervenir dans les discussions de remboursement et approuver/rejeter les demandes.
-   **Configuration et Support :**
    -   **Paramètres du Site :** Configurer les règles de la plateforme (taux de commission, loyer, mode maintenance, etc.).
    -   **Gestion du Contenu :** Mettre à jour le contenu des pages statiques (FAQ, À propos...).
    -   **Support :** Gérer tous les tickets de support, y répondre et modifier leur statut/priorité.
