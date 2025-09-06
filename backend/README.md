# KMER ZONE - Plan de Réalisation du Backend

Ce document sert de guide et de feuille de route pour le développement complet de l'API RESTful pour la marketplace **KMER ZONE**. L'objectif est de construire un backend autonome, robuste, sécurisé et prêt à être intégré avec l'application frontend existante.

---

## Stack Technique

*   **Environnement d'exécution :** Node.js
*   **Framework :** Express.js
*   **Base de données :** MongoDB avec le service cloud MongoDB Atlas
*   **ODM (Object Data Modeling) :** Mongoose
*   **Authentification :** JSON Web Tokens (JWT)
*   **Gestion des fichiers :** Multer et Cloudinary
*   **Communication en temps réel :** Socket.IO (pour le chat)
*   **Validation des données :** `express-validator`
*   **Sécurité :** `helmet`, `cors`, `bcryptjs`, `express-rate-limit`
*   **Fonctionnalités IA :** API Google Gemini

---

## 🏗️ Structure du Projet Backend

Le projet sera organisé dans un dossier `backend/` avec la structure modulaire suivante pour faciliter la maintenance et l'évolution :

```
backend/
├── config/           # Configuration (DB, variables d'environnement)
├── controllers/      # Logique métier (fonctions appelées par les routes)
├── middleware/       # Fonctions intermédiaires (auth, gestion d'erreurs, upload)
├── models/           # Schémas de la base de données (Mongoose)
├── routes/           # Définition des endpoints de l'API
├── utils/            # Fonctions utilitaires (génération de token, gestion d'erreurs)
├── seeders/          # Scripts pour peupler la base de données
├── .env              # Fichier des variables d'environnement (ne pas commiter)
├── .env.example      # Modèle pour le fichier .env
├── server.js         # Point d'entrée de l'application
└── package.json
```

---

## 🗺️ Plan de Développement Détaillé

Le développement se déroulera en plusieurs phases séquentielles, garantissant une construction solide avant l'intégration finale.

### Phase 0 : Préparation et Configuration de l'Environnement (Fondations)

1.  **Initialisation du Projet :**
    *   Créer le dossier `backend/` et initialiser un projet Node.js (`npm init -y`).
    *   Installer les dépendances de base (`express`, `mongoose`, `dotenv`, `cors`) et de développement (`nodemon`).
    *   Mettre en place la structure de dossiers décrite ci-dessus.

2.  **Configuration du Serveur et de la Base de Données :**
    *   Créer le point d'entrée `server.js` pour le serveur Express.
    *   Configurer un cluster sur MongoDB Atlas, obtenir la chaîne de connexion.
    *   Créer et configurer le fichier `.env` avec `PORT`, `MONGODB_URI`, `JWT_SECRET`.
    *   Écrire le script de connexion à la base de données (`/config/db.js`).

3.  **Scripts `package.json` :**
    *   Ajouter les scripts `start` et `dev` pour lancer facilement le serveur.

### Phase 1 : Noyau de l'Application et Modèles de Données (Le Squelette)

1.  **Traduction de `types.ts` en Schémas Mongoose :**
    *   Créer tous les modèles de données dans `/models` en se basant scrupuleusement sur les interfaces du fichier `frontend/types.ts` pour garantir la cohérence.
    *   **`userModel.js`**: Implémenter le hachage du mot de passe avec `bcryptjs` via un hook `pre-save`.
    *   **`productModel.js`, `storeModel.js`, `orderModel.js`**: Définir les relations entre les modèles en utilisant les références (`ref`) de Mongoose.

### Phase 2 : Authentification et Gestion des Utilisateurs (Les Portes d'Entrée)

1.  **Développement de la Logique d'Authentification :**
    *   Créer les contrôleurs (`authController.js`) pour l'inscription (`register`), la connexion (`login`), et la récupération de l'utilisateur (`getMe`).
    *   Implémenter la génération et la validation des JSON Web Tokens (JWT).

2.  **Création des Middlewares de Sécurité :**
    *   `authMiddleware.js` : Middleware pour protéger les routes en vérifiant le token JWT.
    *   `roleMiddleware.js` : Middleware pour restreindre l'accès en fonction des rôles (`customer`, `seller`, `superadmin`, etc.).

3.  **Définition des Routes :** Créer `authRoutes.js` et `userRoutes.js`.

### Phase 3 : Gestion des Produits, Catégories et Boutiques (Le Cœur du E-commerce)

1.  **Développement des Contrôleurs :**
    *   `productController.js` : Logique pour le CRUD complet des produits, incluant des options avancées de filtrage, de tri et de pagination.
    *   `storeController.js`, `categoryController.js` : Logique pour la gestion des boutiques et des catégories.

2.  **Gestion des Fichiers :**
    *   Intégrer `multer` et `cloudinary` pour créer un `uploadMiddleware.js` capable de gérer le téléversement des images (logos, photos de produits).

3.  **Définition des Routes :** Créer `productRoutes.js`, `storeRoutes.js`, et `categoryRoutes.js`.

### Phase 4 : Processus de Commande et Paiement (La Transaction)

1.  **Développement du `orderController.js` :**
    *   Implémenter la logique critique de création de commande : validation du panier, vérification du stock, décrémentation atomique du stock, et sauvegarde de la commande.
    *   Créer les fonctions pour la consultation des commandes par les clients.

2.  **Définition des Routes :** Créer `orderRoutes.js`, entièrement protégé par le `authMiddleware`.

### Phase 5 : Fonctionnalités Avancées et Rôles Spécifiques (Les Tableaux de Bord)

1.  **Tableau de Bord Vendeur :** Créer les contrôleurs et routes (`sellerController.js`, `sellerRoutes.js`) permettant aux vendeurs de gérer leurs produits, commandes, et profil de boutique.
2.  **Tableau de Bord Super Admin :** Créer `adminController.js` et `adminRoutes.js` pour la gestion globale de la plateforme (validation des boutiques, gestion des utilisateurs, modération, etc.).
3.  **Tableau de Bord Livreur :** Créer `deliveryController.js` et `deliveryRoutes.js` pour la consultation des missions et la mise à jour des statuts de livraison.
4.  **Fonctionnalités IA :** Créer un endpoint sécurisé (`/api/ai/generate-description`) qui appelle l'API Gemini depuis le backend pour générer des descriptions de produits. **La clé API ne sera jamais exposée au frontend.**

### Phase 6 : Communication et Notifications (Le Temps Réel)

1.  **Intégration de `socket.io` :**
    *   Configurer Socket.IO avec le serveur Express pour permettre une communication bidirectionnelle en temps réel.

2.  **Logique du Chat :**
    *   Développer la logique côté serveur pour gérer la connexion des clients, la création de "rooms" de discussion, la réception, la sauvegarde (`MessageModel`), et la diffusion des messages.
    *   Implémenter la censure des informations de contact (numéros, emails) côté serveur.

### Phase 7 : Finalisation, Sécurité et Déploiement

1.  **Validation et Gestion des Erreurs :**
    *   Mettre en place un middleware global de gestion des erreurs pour standardiser les réponses d'erreur.
    *   Utiliser `express-validator` pour valider toutes les données entrantes des requêtes.

2.  **Renforcement de la Sécurité :**
    *   Configurer `helmet` pour sécuriser les en-têtes HTTP.
    *   Configurer `cors` de manière restrictive en production.
    *   Mettre en place une limitation de requêtes (`express-rate-limit`) sur les endpoints sensibles (login, register).

3.  **Script de "Seeding" :**
    *   Créer un script dans `/seeders/seed.js` pour peupler la base de données avec les données initiales du frontend, en s'assurant de **hacher les mots de passe** des utilisateurs.

4.  **Préparation au Déploiement :**
    *   Rédiger des instructions claires pour le déploiement sur une plateforme comme Render ou Heroku.

### Phase 8 : Intégration avec le Frontend (Étape Finale)

*Une fois le backend complet et déployé, cette phase sera entreprise par l'équipe frontend.*

1.  **Configuration du Frontend :**
    *   Configurer le frontend pour qu'il pointe vers l'URL de l'API déployée.

2.  **Mise à Jour des Appels API :**
    *   Remplacer toutes les données simulées par des appels `fetch` ou `axios` aux endpoints du backend.
    *   Implémenter la gestion du token JWT côté client (stockage sécurisé et inclusion dans les en-têtes).

3.  **Connexion du Chat :**
    *   Connecter le `ChatWidget` du frontend au serveur Socket.IO du backend.
