# KMER ZONE - Spécifications Techniques Détaillées du Backend (MongoDB Edition)

Ce document sert de guide complet pour la construction du serveur API RESTful pour la marketplace **KMER ZONE**, en utilisant une base de données NoSQL. Il détaille l'architecture, les modèles de données, la logique métier et les points d'API nécessaires pour alimenter l'application frontend.

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
-   **Base de Données :** [MongoDB](https://www.mongodb.com/) (Atlas ou auto-hébergé)
-   **ODM :** [Mongoose](https://mongoosejs.com/)
-   **Authentification :** [JSON Web Tokens (JWT)](https://jwt.io/)
-   **Validation :** [Zod](https://zod.dev/)

---

## ⚙️ Guide d'Installation

### 1. Prérequis
-   Node.js (v18+), NPM/Yarn, MongoDB, Git

### 2. Démarrage
1.  **Cloner le dépôt :** `git clone [URL_DU_DEPOT_BACKEND]`
2.  **Installer les dépendances :** `npm install`
3.  **Configurer `.env`** en se basant sur `.env.example`:
    ```ini
    # URI de connexion MongoDB (local ou Atlas)
    MONGODB_URI="mongodb://localhost:27017/kmerzone"
    
    # Port du serveur
    PORT=5000
    
    # Clé secrète pour les JWT (très importante)
    JWT_SECRET="UNE_PHRASE_SECRETE_TRES_LONGUE_ET_COMPLEXE"
    ```
4.  **Lancer le serveur en mode développement :** `npm run dev`

---

## 🗂️ Modèles de Données (Mongoose Schemas)

Voici des exemples de schémas Mongoose pour les collections principales.

### User (`User.model.ts`)
```typescript
import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false }, // Ne pas retourner le mot de passe par défaut
  role: { 
    type: String, 
    enum: ['customer', 'seller', 'superadmin', 'delivery_agent', 'depot_agent'], 
    default: 'customer' 
  },
  shopName: { type: String }, // Pour les vendeurs
  loyalty: {
      status: { type: String, enum: ['standard', 'premium', 'premium_plus'], default: 'standard' },
      orderCount: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 }
  }
}, { timestamps: true });

export default model('User', UserSchema);
```

### Product (`Product.model.ts`)
```typescript
import { Schema, model, Types } from 'mongoose';

const ReviewSchema = new Schema({
    author: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
});

const ProductSchema = new Schema({
    name: { type: String, required: true, index: true },
    price: { type: Number, required: true },
    promotionPrice: { type: Number },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    vendor: { type: String, required: true, index: true },
    stock: { type: Number, required: true, default: 0 },
    imageUrls: [String],
    reviews: [ReviewSchema],
    status: { type: String, enum: ['published', 'draft'], default: 'draft' }
    // ... autres champs comme `brand`, `weight`, etc.
}, { timestamps: true });

export default model('Product', ProductSchema);
```

### Order (`Order.model.ts`)
```typescript
import { Schema, model, Types } from 'mongoose';

const TrackingEventSchema = new Schema({
    status: String,
    date: { type: Date, default: Date.now },
    location: String,
    details: String
});

const OrderSchema = new Schema({
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    items: [{
        productId: { type: Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        quantity: Number,
        // ...
    }],
    total: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['confirmed', 'ready-for-pickup', 'picked-up', 'at-depot', 'out-for-delivery', 'delivered', 'cancelled', 'refund-requested', 'refunded'], 
        default: 'confirmed' 
    },
    shippingAddress: {
        fullName: String,
        phone: String,
        address: String,
        city: String
    },
    trackingNumber: { type: String, unique: true },
    trackingHistory: [TrackingEventSchema]
}, { timestamps: true });

export default model('Order', OrderSchema);
```

---

## 🌐 Documentation des Points d'API

La structure des points d'API reste la même que celle décrite pour la version PostgreSQL. La principale différence réside dans l'implémentation interne, qui utilisera Mongoose pour interagir avec MongoDB.

**Exemple : Créer une commande (`POST /api/orders`)**
La logique métier devra :
1.  Vérifier que l'utilisateur est authentifié (`customer`).
2.  Valider le corps de la requête (items, adresse, etc.).
3.  Pour chaque article, vérifier le stock dans la collection `Product`. Utiliser une transaction MongoDB pour assurer l'atomicité.
4.  Si le stock est suffisant, décrémenter le stock pour chaque produit.
5.  Créer un nouveau document dans la collection `Order`.
6.  Retourner la commande créée.

---

## ⚖️ Politique de Confidentialité de KMER ZONE

**Dernière mise à jour :** [Date]

Bienvenue sur KMER ZONE. Votre vie privée est d'une importance capitale pour nous. Cette Politique de Confidentialité explique quelles informations nous collectons, comment nous les utilisons, et quels sont vos droits.

### 1. Informations que nous collectons

-   **Informations de compte :** Lorsque vous créez un compte, nous collectons votre nom, votre adresse e-mail et votre mot de passe (crypté).
-   **Informations de profil et de boutique (pour les vendeurs) :** Nom de la boutique, contacts, adresse physique, documents d'identification pour vérification.
-   **Informations sur les transactions :** Détails des produits que vous achetez ou vendez, informations de livraison, historique des commandes. Nous ne stockons PAS directement vos informations de paiement (numéros de carte, etc.). Celles-ci sont gérées de manière sécurisée par nos partenaires de paiement.
-   **Communications :** Messages échangés avec d'autres utilisateurs ou avec notre support client via la plateforme.
-   **Données d'utilisation :** Informations sur la manière dont vous interagissez avec notre site (pages visitées, produits consultés, etc.).

### 2. Comment nous utilisons vos informations

-   **Pour fournir nos services :** Gérer votre compte, traiter vos commandes, faciliter les livraisons et les paiements.
-   **Pour améliorer notre plateforme :** Analyser l'utilisation pour optimiser l'expérience utilisateur et développer de nouvelles fonctionnalités.
-   **Pour la sécurité :** Vérifier les comptes, prévenir la fraude et assurer la sécurité de notre marketplace.
-   **Pour communiquer avec vous :** Vous envoyer des notifications sur vos commandes, des mises à jour de nos services ou des offres marketing (avec votre consentement).

### 3. Partage de vos informations

Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos informations uniquement dans les cas suivants :
-   **Entre utilisateurs :** Nous partageons les informations nécessaires pour finaliser une transaction (par exemple, l'adresse de livraison avec le vendeur et le livreur).
-   **Avec des prestataires de services :** Nous travaillons avec des tiers pour le paiement, la livraison et l'hébergement, qui n'ont accès qu'aux informations nécessaires pour leurs services.
-   **Pour des raisons légales :** Si la loi l'exige ou pour protéger nos droits et notre sécurité.

### 4. Sécurité de vos données

Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles robustes pour protéger vos données contre l'accès non autorisé, l'altération ou la destruction. Cela inclut le cryptage des mots de passe et l'utilisation de connexions sécurisées (SSL).

### 5. Vos droits

Conformément à la réglementation en vigueur, vous disposez des droits suivants :
-   **Droit d'accès :** Vous pouvez demander une copie des informations que nous détenons sur vous.
-   **Droit de rectification :** Vous pouvez corriger les informations inexactes dans votre profil.
-   **Droit à l'effacement :** Vous pouvez demander la suppression de votre compte et de vos données associées (sous réserve des obligations légales de conservation).

Pour exercer ces droits, veuillez nous contacter.

### 6. Contact

Pour toute question concernant cette politique de confidentialité, veuillez nous contacter à l'adresse suivante : **[Adresse email de contact, ex: support@kmerzone.com]**.

**[Nom de l'entreprise/l'opérateur de KMER ZONE]**
**[Adresse de l'entreprise]**