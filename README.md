
# KMER ZONE - Documentation du Backend

Bienvenue sur la documentation technique du backend pour la marketplace **KMER ZONE**. Ce document sert de guide complet pour le développement, la maintenance et la compréhension de l'API RESTful qui alimente l'application frontend.

**Stack Technique :**
*   **Environnement d'exécution :** Node.js
*   **Framework :** Express.js
*   **Base de données :** MongoDB avec le service cloud MongoDB Atlas
*   **ODM (Object Data Modeling) :** Mongoose
*   **Authentification :** JSON Web Tokens (JWT)
*   **Gestion des fichiers :** Multer et Cloudinary (recommandé)
*   **Communication en temps réel :** Socket.IO (pour le chat)

---

## 🚀 Mise en Route (Getting Started)

Suivez ces étapes pour configurer et lancer l'environnement de développement local.

### 1. Prérequis

Assurez-vous d'avoir les outils suivants installés sur votre machine :
*   [Node.js](https://nodejs.org/) (version 18.x ou supérieure)
*   [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
*   Un compte [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (le niveau gratuit est suffisant pour commencer).
*   Un compte [Cloudinary](https://cloudinary.com/) (pour le stockage d'images).

### 2. Installation

1.  **Clonez le dépôt** (hypothétique) :
    ```bash
    git clone https://github.com/votre-organisation/kmer-zone-backend.git
    cd kmer-zone-backend
    ```

2.  **Installez les dépendances** :
    ```bash
    npm install
    ```

### 3. Configuration de l'environnement

1.  **Créez un fichier `.env`** à la racine du projet en copiant le modèle `.env.example` :
    ```bash
    cp .env.example .env
    ```

2.  **Configurez MongoDB Atlas** :
    *   Créez un nouveau cluster sur MongoDB Atlas.
    *   Dans la section "Database Access", créez un nouvel utilisateur de base de données. Notez le nom d'utilisateur et le mot de passe.
    *   Dans la section "Network Access", ajoutez votre adresse IP actuelle (ou `0.0.0.0/0` pour un accès depuis n'importe où, non recommandé en production).
    *   Cliquez sur "Connect" pour votre cluster, choisissez "Connect your application", et copiez la chaîne de connexion.

3.  **Remplissez le fichier `.env`** avec vos informations :
    ```env
    # Fichier .env

    # Configuration du serveur
    PORT=5000

    # Connexion MongoDB Atlas
    # Remplacez <username>, <password> et <cluster-name> par vos informations
    MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/kmerzone?retryWrites=true&w=majority

    # Sécurité
    JWT_SECRET=VOTRE_SECRET_JWT_TRES_LONG_ET_ALEATOIRE
    JWT_EXPIRES_IN=7d

    # Cloudinary pour le stockage d'images
    CLOUDINARY_CLOUD_NAME=votre_nom_de_cloud
    CLOUDINARY_API_KEY=votre_api_key
    CLOUDINARY_API_SECRET=votre_api_secret

    # API Google Gemini (pour les fonctionnalités IA)
    GEMINI_API_KEY=votre_cle_api_gemini
    ```

### 4. Lancer le serveur

Pour démarrer le serveur en mode développement (avec rechargement automatique via `nodemon`) :
```bash
npm run dev
```

Pour démarrer le serveur en mode production :
```bash
npm start
```

Le serveur sera accessible à l'adresse `http://localhost:5000`.

---

## 🏗️ Structure du Projet

Le projet est organisé de manière modulaire pour faciliter la maintenance et l'évolution.

```
/
├── config/           # Configuration (DB, etc.)
├── controllers/      # Logique métier (fonctions appelées par les routes)
├── middleware/       # Fonctions intermédiaires (auth, gestion d'erreurs)
├── models/           # Schémas de la base de données (Mongoose)
├── routes/           # Définition des endpoints de l'API
├── utils/            # Fonctions utilitaires (gestion d'erreurs, etc.)
├── .env              # Fichier des variables d'environnement
├── server.js         # Point d'entrée de l'application
└── package.json
```

---

## 🔑 Concepts Clés

### Authentification (JWT)

L'authentification est basée sur les JSON Web Tokens.
1.  L'utilisateur s'enregistre ou se connecte via `POST /api/auth/register` ou `POST /api/auth/login`.
2.  Le serveur vérifie les informations, et si elles sont valides, il génère un JWT signé avec le `JWT_SECRET`.
3.  Ce token est renvoyé au client.
4.  Le client doit inclure ce token dans l'en-tête `Authorization` (`Bearer <token>`) pour toutes les requêtes nécessitant une authentification.
5.  Un middleware (`authMiddleware`) intercepte chaque requête protégée, vérifie la validité du token et attache les informations de l'utilisateur (`req.user`) à l'objet de la requête.

### Autorisation (RBAC - Role-Based Access Control)

Un middleware de contrôle des rôles (`roleMiddleware`) est utilisé pour protéger les routes spécifiques. Il vérifie que `req.user.role` correspond aux rôles autorisés pour un endpoint donné.

**Exemple :**
```javascript
// routes/products.js
// Seuls les vendeurs et les admins peuvent créer un produit
router.post('/', authMiddleware, roleMiddleware('seller', 'superadmin'), createProduct);
```

### ❗️ Sécurité de l'API Gemini

**Important :** Toutes les interactions avec l'API Google Gemini **doivent** être effectuées côté backend. Le frontend ne doit jamais contenir la clé `GEMINI_API_KEY`.

Le backend doit exposer un endpoint sécurisé (ex: `POST /api/ai/generate-description`) que le frontend peut appeler. Ce endpoint, protégé par authentification, recevra les mots-clés du vendeur, construira le prompt, appellera l'API Gemini, et renverra la description générée au frontend.

---

## 📦 Modèles de Données (Schemas Mongoose)

Les schémas sont définis dans le dossier `/models` en se basant sur les interfaces du fichier `types.ts` du frontend. Voici les modèles principaux :

*   **`userModel.js`**: Stocke les informations des utilisateurs. Le mot de passe doit être haché (avec `bcryptjs`) avant d'être sauvegardé.
*   **`storeModel.js`**: Représente une boutique, liée à un utilisateur de rôle `seller`.
*   **`productModel.js`**: Contient tous les détails des produits, y compris les variantes et les avis (`reviews`) qui peuvent être un sous-document.
*   **`orderModel.js`**: Structure complexe pour les commandes, contenant les articles, l'adresse, le statut, l'historique de suivi, etc.
*   **`categoryModel.js`**: Gère les catégories, avec une référence `parent` pour la hiérarchie.
*   ... et ainsi de suite pour chaque type de données (`flashSale`, `promoCode`, `ticket`, etc.).

---

## 🌐 Endpoints de l'API (Détaillé)

L'API est organisée par ressources. `(P)` indique une route protégée nécessitant une authentification. `(R: role)` indique un rôle spécifique requis.

### `Auth & Users` (`/api/auth`)
-   `POST /register` : Créer un compte client. `body: { name, email, password }`
-   `POST /login` : Se connecter. `body: { email, password }`
-   `POST /forgot-password` : Envoyer un lien de réinitialisation. `body: { email }`
-   `POST /reset-password` : Réinitialiser le mot de passe. `body: { token, newPassword }`
-   `GET /me` (P) : Obtenir les informations de l'utilisateur connecté.
-   `PUT /me` (P) : Mettre à jour les informations de l'utilisateur (nom). `body: { name }`
-   `PUT /me/password` (P) : Changer le mot de passe. `body: { oldPassword, newPassword }`

### `User Profile` (`/api/profile`) (P)
-   `GET /addresses` : Obtenir les adresses de l'utilisateur.
-   `POST /addresses` : Ajouter une nouvelle adresse. `body: { fullName, phone, address, city }`
-   `PUT /addresses/:id` : Modifier une adresse.
-   `DELETE /addresses/:id` : Supprimer une adresse.
-   `POST /addresses/:id/default` : Définir une adresse par défaut.
-   `GET /followed-stores` : Obtenir les boutiques suivies.
-   `POST /followed-stores/:storeId` : Suivre/Ne plus suivre une boutique.

### `Public Data` (pas de préfixe)
-   `GET /api/products` : Obtenir la liste des produits publiés (avec filtres en query params).
-   `GET /api/products/:id` : Obtenir les détails d'un produit.
-   `GET /api/stores` : Obtenir la liste des boutiques actives.
-   `GET /api/stores/:name` : Obtenir le profil public d'une boutique par son nom.
-   `GET /api/categories` : Obtenir l'arborescence des catégories.
-   `GET /api/flash-sales/active` : Obtenir les ventes flash en cours.
-   `GET /api/content/:slug` : Obtenir le contenu des pages statiques (about, faq, etc.).
-   `GET /api/announcements/active` : Obtenir les annonces actives pour le type d'utilisateur.
-   `GET /api/pickup-points` : Obtenir la liste des points de retrait.
-   `GET /api/payment-methods` : Obtenir la liste des moyens de paiement.

### `Orders` (`/api/orders`) (P, R: customer)
-   `POST /` : Passer une commande. `body: { items, shippingAddress, deliveryMethod, ... }`
-   `GET /my-orders` : Obtenir l'historique des commandes du client.
-   `GET /:id` : Obtenir les détails d'une commande spécifique.
-   `POST /:id/cancel` : Annuler une commande (si statut le permet).
-   `POST /:id/refund` : Demander un remboursement. `body: { reason, evidenceUrls }`
-   `POST /:id/dispute` : Envoyer un message dans un litige. `body: { message }`
-   `POST /:id/repeat` : Recréer un panier à partir d'une ancienne commande.

### `Promo Codes` (`/api/promo-codes`)
-   `POST /apply` (P, R: customer) : Vérifier et appliquer un code promo au panier. `body: { code, subtotal }`

### `AI Features` (`/api/ai`) (P)
-   `POST /generate-description` (R: seller) : Générer une description de produit. `body: { keywords, productName, categoryName }`
-   `POST /visual-search` : Lancer une recherche par image. `body: { image_base64 }`

### `Chat` (`/api/chat`) (P)
-   *Principalement géré par Socket.IO pour le temps réel.*
-   `GET /conversations` : Obtenir la liste des conversations de l'utilisateur.
-   `GET /conversations/:id/messages` : Obtenir l'historique des messages d'une conversation.
-   `POST /conversations/:id/messages` : Envoyer un message (alternative à Socket.IO). `body: { text }`

### `Seller Dashboard` (`/api/seller`) (P, R: seller)
-   `POST /become-seller` : Soumettre une demande pour devenir vendeur. `body: { shopName, location, ... }`
-   `GET /dashboard` : Obtenir les données et statistiques du tableau de bord.
-   `GET /profile`, `PUT /profile` : Gérer les informations de la boutique.
-   `POST /profile/stories` : Ajouter une Story. `body: { imageUrl }`
-   `DELETE /profile/stories/:storyId` : Supprimer une Story.
-   `GET /products`, `POST /products`, `PUT /products/:id`, `DELETE /products/:id` : CRUD pour les produits de la boutique.
-   `PUT /products/bulk-update` : Mettre à jour plusieurs produits. `body: [{ id, price, stock }]`
-   `POST /products/:productId/reviews/:reviewId/reply`: Répondre à un avis. `body: { replyText }`
-   `GET /orders`, `GET /orders/:id` : Gérer les commandes de la boutique.
-   `PUT /orders/:id/status` : Mettre à jour le statut d'une commande. `body: { status }`
-   `POST /orders/:id/dispute` : Envoyer un message dans un litige. `body: { message }`
-   `GET /promocodes`, `POST /promocodes`, `DELETE /promocodes/:code` : Gérer les codes promo.
-   `POST /flash-sales/:id/propose` : Proposer un produit pour une vente flash. `body: { productId, flashPrice }`
-   `POST /documents/upload` : Téléverser un document requis. `body: { documentName, file }`
-   `GET /finances` : Obtenir les informations financières (revenus, soldes).
-   `GET /collections`, `POST /collections`, `PUT /collections/:id`, `DELETE /collections/:id`: Gérer les collections de produits.

### `Delivery Agent Dashboard` (`/api/delivery`) (P, R: delivery_agent)
-   `GET /missions` : Obtenir la liste des commandes à récupérer et à livrer.
-   `PUT /orders/:id/status` : Mettre à jour le statut (picked-up, out-for-delivery, etc.).
-   `POST /orders/:id/delivered` : Confirmer la livraison avec preuve. `body: { proofUrl }`
-   `POST /orders/:id/failed` : Signaler un échec de livraison. `body: { reason, details, photoUrl }`
-   `PUT /availability` : Mettre à jour son statut de disponibilité. `body: { status: 'available' | 'unavailable' }`

### `Depot Agent Dashboard` (`/api/depot`) (P, R: depot_agent)
-   `POST /orders/check-in` : Enregistrer un colis au dépôt. `body: { trackingNumber, storageLocation, notes }`
-   `POST /orders/process-departure` : Traiter la sortie d'un colis. `body: { trackingNumber, recipientInfo }`
-   `POST /orders/discrepancy` : Signaler une anomalie. `body: { trackingNumber, reason }`

### `Support Tickets` (`/api/tickets`) (P)
-   `GET /` : Obtenir la liste de ses propres tickets.
-   `POST /` : Créer un nouveau ticket. `body: { subject, message, relatedOrderId }`
-   `POST /:id/reply` : Répondre à un ticket. `body: { message }`

### `Super Admin Dashboard` (`/api/admin`) (P, R: superadmin)
-   **Users**:
    -   `GET /users`, `POST /users`, `PUT /users/:id`
    -   `POST /users/:id/sanction` : Sanctionner un livreur.
-   **Stores**:
    -   `GET /stores`
    -   `PUT /stores/:id/status` : Approuver, suspendre, réactiver.
    -   `PUT /stores/:id/premium-status` : Gérer le statut premium.
    -   `POST /stores/:id/warn` : Envoyer un avertissement.
    -   `POST /stores/:id/documents` : Demander un nouveau document.
    -   `PUT /stores/:storeId/documents/:docName/verify` : Vérifier/rejeter un document.
    -   `POST /stores/:id/activate-subscription` : Activer un abonnement.
-   **Orders**:
    -   `GET /orders`
    -   `PUT /orders/:id/status`
    -   `POST /orders/:id/assign-agent`
    -   `POST /orders/:id/resolve-refund`
-   **Products & Categories**:
    -   `GET /categories`, `POST /categories`, `DELETE /categories/:id`, `PUT /categories/:id/image`
    -   `PUT /reviews/moderate` : Approuver/rejeter les avis.
-   **Promotions**:
    -   `GET /flash-sales`, `POST /flash-sales`
    -   `PUT /flash-sales/:id/submissions` : Gérer les soumissions des vendeurs.
-   **Content & Marketing**:
    -   `GET /site-content`, `PUT /site-content`
    -   `GET /advertisements`, `POST /advertisements`, `PUT /advertisements/:id`, `DELETE /advertisements/:id`
    -   `GET /announcements`, `POST /announcements`, `PUT /announcements/:id`, `DELETE /announcements/:id`
-   **Logistics**:
    -   `GET /pickup-points`, `POST /pickup-points`, `PUT /pickup-points/:id`, `DELETE /pickup-points/:id`
-   **Finances**:
    -   `POST /payouts` : Initier un paiement à un vendeur.
-   **Support**:
    -   `GET /tickets`
    -   `POST /tickets/:id/reply`
    -   `PUT /tickets/:id/status`
-   **Platform**:
    -   `GET /settings`, `PUT /settings` : Gérer les paramètres globaux du site.
    -   `GET /logs` : Consulter les logs d'activité.

---

Ce document fournit une base solide et complète pour construire un backend de qualité professionnelle pour KMER ZONE.
