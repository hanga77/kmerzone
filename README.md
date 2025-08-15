# KMER ZONE - Spécifications Techniques Détaillées du Backend

Ce document sert de guide complet pour la construction du serveur API RESTful de la marketplace **KMER ZONE**. Il détaille l'architecture, les modèles de données, la logique métier et les points d'API nécessaires pour alimenter l'application frontend.

## 🚀 Vue d'ensemble

Le backend est le cerveau de la plateforme. Ses responsabilités principales sont :
-   **Gestion des Données :** Source unique de vérité pour tous les utilisateurs, produits, boutiques, commandes, etc.
-   **Authentification & Autorisation :** Gestion des identités et contrôle d'accès via les rôles.
-   **Logique Métier :** Exécution des processus complexes (commandes, commissions, loyers).
-   **Sécurité :** Validation des données et protection des informations sensibles.

## 🛠️ Pile Technologique Recommandée

-   **Runtime :** [Node.js](https://nodejs.org/) (v18.x ou LTS)
-   **Langage :** [TypeScript](https://www.typescriptlang.org/)
-   **Framework :** [Express.js](https://expressjs.com/)
-   **Base de Données :** [PostgreSQL](https://www.postgresql.org/)
-   **ORM :** [Prisma](https://www.prisma.io/)
-   **Authentification :** [JSON Web Tokens (JWT)](https://jwt.io/)
-   **Validation :** [Zod](https://zod.dev/)

---

## ⚙️ Guide d'Installation

### 1. Prérequis
-   Node.js (v18+), NPM/Yarn, PostgreSQL, Git

### 2. Démarrage
1.  **Cloner le dépôt :** `git clone [URL_DU_DEPOT_BACKEND]`
2.  **Installer les dépendances :** `npm install`
3.  **Configurer `.env`** en se basant sur `.env.example`:
    ```ini
    DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/kmerzone?schema=public"
    PORT=5000
    JWT_SECRET="UNE_PHRASE_SECRETE_TRES_LONGUE_ET_COMPLEXE"
    ```
4.  **Appliquer les migrations BDD :** `npx prisma migrate dev --name init`
5.  **(Optionnel) Populer la BDD :** `npx prisma db seed`
6.  **Lancer le serveur :** `npm run dev`

---

## 🔐 Authentification & Rôles

Le système repose sur JWT. L'utilisateur se connecte, reçoit un token, et doit l'inclure dans l'en-tête `Authorization` de chaque requête protégée (`Authorization: Bearer <token>`).

-   **Rôles :** `customer`, `seller`, `delivery_agent`, `superadmin`.

---

## 🌐 Documentation Détaillée des Points d'API

### Authentification (`/api/auth`)

#### `POST /register`
-   **Accès :** Public
-   **Description :** Crée un nouveau compte client.
-   **Body :**
    ```json
    {
      "name": "Jean Dupont",
      "email": "jean@example.com",
      "password": "password123"
    }
    ```
-   **Succès (201) :**
    ```json
    {
      "user": { "id": "user_...", "name": "Jean Dupont", "email": "jean@example.com", "role": "customer", "loyalty": { ... } },
      "token": "ey..."
    }
    ```
-   **Erreur (409) :** `{"message": "Cet email est déjà utilisé."}`

#### `POST /login`
-   **Accès :** Public
-   **Description :** Connecte un utilisateur et retourne un JWT.
-   **Body :**
    ```json
    {
      "email": "jean@example.com",
      "password": "password123"
    }
    ```
-   **Succès (200) :**
    ```json
    {
      "user": { "id": "user_...", "name": "Jean Dupont", "role": "customer", ... },
      "token": "ey..."
    }
    ```
-   **Erreur (401) :** `{"message": "Email ou mot de passe incorrect."}`

#### `GET /me`
-   **Accès :** Privé (tous les rôles connectés)
-   **Description :** Retourne les informations de l'utilisateur connecté.
-   **Header :** `Authorization: Bearer <token>`
-   **Succès (200) :** `{ "user": { "id": "user_...", ... } }`

---

### Produits (`/api/products`)

#### `GET /`
-   **Accès :** Public
-   **Description :** Liste tous les produits publiés avec filtres et pagination.
-   **Query Params :** `?category=Vêtements&vendor=Kmer%20Fashion&minPrice=10000&maxPrice=20000&sortBy=price-asc&page=1&limit=12`
-   **Succès (200) :**
    ```json
    {
      "products": [ { "id": "...", "name": "Robe en Tissu Pagne", ... } ],
      "totalPages": 5,
      "currentPage": 1
    }
    ```

#### `GET /:id`
-   **Accès :** Public
-   **Description :** Récupère les détails d'un produit spécifique.
-   **Succès (200) :** `{ "product": { ... } }`
-   **Erreur (404) :** `{"message": "Produit non trouvé."}`

---

### Commandes (`/api/orders`)

#### `POST /`
-   **Accès :** `Customer`
-   **Header :** `Authorization: Bearer <token>`
-   **Description :** Crée une nouvelle commande. La logique backend doit vérifier le stock.
-   **Body :**
    ```json
    {
      "items": [{"productId": "prod_...", "quantity": 1, "selectedVariant": {"Taille": "M"}}],
      "deliveryMethod": "home-delivery",
      "shippingAddress": { "fullName": "Jean Dupont", "phone": "699887766", "address": "123 Rue de la Joie", "city": "Douala" },
      "pickupPointId": null,
      "appliedPromoCode": "SOLDE10"
    }
    ```
-   **Succès (201) :** `{ "order": { "id": "CMD-...", ... } }`
-   **Erreur (400) :** `{"message": "Le produit '...' est en rupture de stock."}`

#### `GET /mine`
-   **Accès :** `Customer`
-   **Header :** `Authorization: Bearer <token>`
-   **Description :** Récupère l'historique des commandes de l'utilisateur connecté.
-   **Succès (200) :** `{ "orders": [ { ... }, { ... } ] }`

---

### Boutiques (`/api/stores`)

#### `POST /become-seller`
-   **Accès :** `Customer`
-   **Header :** `Authorization: Bearer <token>`
-   **Description :** Soumet une demande pour devenir vendeur.
-   **Body :**
    ```json
    {
        "shopName": "Ma Belle Boutique",
        "location": "Douala",
        "neighborhood": "Akwa",
        "sellerFirstName": "Marie",
        "sellerLastName": "Claire",
        "sellerPhone": "677665544",
        "physicalAddress": "En face de la pharmacie Akwa",
        "latitude": 4.0483,
        "longitude": 9.702
    }
    ```
-   **Succès (201) :** `{ "store": { "id": "store_...", "status": "pending", ... } }`

---

### Vendeur (`/api/seller`)

**Note :** Toutes les routes de cette section requièrent le rôle `seller`.

#### `PUT /products/:id`
-   **Description :** Met à jour un produit appartenant au vendeur.
-   **Body (exemple partiel) :** `{ "price": 14500, "stock": 5 }`
-   **Succès (200) :** `{ "product": { ... } }`

#### `PATCH /orders/:id/status`
-   **Description :** Met à jour le statut d'une commande (limité à 'confirmed' -> 'ready-for-pickup').
-   **Body :** `{"status": "ready-for-pickup"}`
-   **Succès (200) :** `{ "order": { ... } }`

---

### Super Administration (`/api/admin`)

**Note :** Toutes les routes de cette section requièrent le rôle `superadmin`.

#### `PATCH /stores/:id/status`
-   **Description :** Approuve, rejette, suspend ou réactive une boutique.
-   **Body :** `{"status": "active"}`
-   **Succès (200) :** `{ "store": { "id": "...", "status": "active" } }`

#### `POST /stores/:id/warn`
-   **Description :** Envoie un avertissement à une boutique.
-   **Body :** `{"reason": "Non-respect des délais de livraison."}`
-   **Succès (200) :** `{ "store": { ...warnings: [...] } }`

#### `PATCH /stores/:storeId/documents/:docName/status`
-   **Description :** Approuve ou rejette un document soumis par un vendeur.
-   **Body :**
    ```json
    {
      "status": "rejected",
      "reason": "La photo est floue."
    }
    ```
-   **Succès (200) :** `{ "document": { ... } }`


#### `PATCH /users/:id/role`
-   **Description :** Modifie le rôle d'un utilisateur.
-   **Body :** `{"role": "delivery_agent"}`
-   **Succès (200) :** `{ "user": { "id": "...", "role": "delivery_agent" } }`

#### `PUT /settings`
-   **Description :** Met à jour les paramètres du site.
-   **Body :**
    ```json
    {
      "isRentEnabled": true,
      "rentAmount": 5000,
      "requiredSellerDocuments": {
        "CNI (Carte Nationale d'Identité)": true,
        "Registre de Commerce": false,
        "Photo du gérant": true,
        "Plan de localisation": false
      },
      ...
    }
    ```
-   **Succès (200) :** `{ "settings": { ... } }`

#### `POST /payouts`
-   **Description :** Enregistre un versement à un vendeur.
-   **Body :**
    ```json
    {
      "storeId": "store_...",
      "amount": 50000
    }
    ```
-   **Succès (201) :** `{ "payout": { "id": "payout_...", ... } }`
-   **Erreur (400) :** `{"message": "Le montant du versement dépasse le solde dû."}`
   
#### `POST /categories`
- **Description :** Crée une nouvelle catégorie.
- **Body :** 
  ```json
  {
      "name": "Articles de Sport",
      "imageUrl": "https://example.com/sport.jpg"
  }
  ```
- **Succès (201) :** `{ "category": { "id": "cat_...", ... } }`

#### `PATCH /reviews/moderate`
- **Description :** Approuve ou rejette un avis client.
- **Body :**
  ```json
  {
      "reviewId": 123,
      "status": "approved"
  }
  ```
- **Succès (200) :** `{ "review": { ... } }`

---

## 🏢 Logique Métier Clé

-   **Cycle de vie d'une commande :** Le statut évolue de `confirmed` à `delivered`. Chaque changement de statut doit être enregistré dans la table `TrackingEvent`.
-   **Gestion des Loyers :** Un `cron job` (tâche planifiée) doit s'exécuter quotidiennement pour vérifier les boutiques dont l'abonnement est échu et changer leur statut à `overdue`.
-   **Calcul des Paiements :** Le solde dû à un vendeur est `(Revenu Total des commandes livrées - Commission) - Total Déjà Versé`. La commission est un pourcentage fixe défini dans les `SiteSettings`.
