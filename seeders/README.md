
# Guide de Peuplement de la Base de Données (Seeding)

Ce document explique comment utiliser les données initiales fournies par l'équipe frontend pour peupler la base de données MongoDB de développement.

## Objectif

Les "seeders" sont des scripts essentiels pour :
1.  **Initialiser l'environnement de développement** avec un jeu de données cohérent (produits, utilisateurs, boutiques, etc.).
2.  **Faciliter les tests** en garantissant un état de base de données connu.
3.  **Pré-remplir les données de production** nécessaires (ex: catégories par défaut, premier compte admin).

## Source des Données

La source de vérité pour toutes les données initiales est le fichier `frontend/data.ts`. Ce fichier contient des tableaux d'objets (`initialProducts`, `initialUsers`, etc.) qui correspondent exactement aux schémas Mongoose définis dans le backend.

## Comment Implémenter le Seeder

1.  **Créez un script principal `seed.js`** à la racine de ce dossier.
2.  **Dans `seed.js` :**
    *   Importez vos modèles Mongoose (`User`, `Product`, `Store`, etc.).
    *   Importez les données depuis `frontend/data.ts`.
    *   Établissez une connexion à votre base de données MongoDB Atlas.
    *   **(Important)** Créez des fonctions pour nettoyer les collections existantes afin d'éviter les doublons (`await Product.deleteMany({})`).
    *   Créez des fonctions pour insérer les nouvelles données en utilisant `Model.insertMany()`.

### Point crucial : Hachage des Mots de Passe

Les mots de passe dans `data.ts` sont en clair pour des raisons de simplicité. **NE JAMAIS** les stocker tels quels. Avant d'insérer les utilisateurs, vous devez hacher leurs mots de passe.

**Exemple dans `seed.js` :**
```javascript
import bcrypt from 'bcryptjs';
import { initialUsers } from '../frontend/data.ts'; // Adaptez le chemin

// ...

const seedUsers = async () => {
    const usersWithHashedPasswords = await Promise.all(
        initialUsers.map(async (user) => {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(user.password, salt);
            return { ...user, password: hashedPassword };
        })
    );
    await User.insertMany(usersWithHashedPasswords);
    console.log('Users seeded successfully!');
};
```

## Comment Lancer le Seeder

Ajoutez un script à votre `package.json` pour faciliter l'exécution.

**`package.json` :**
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "seed": "node seeders/seed.js",
  "seed:destroy": "node seeders/seed.js --delete"
}
```

*   Pour peupler la base de données :
    ```bash
    npm run seed
    ```
*   Pour nettoyer la base de données :
    ```bash
    npm run seed --delete
    ```

En suivant ce guide, le backend disposera d'un mécanisme robuste et reproductible pour initialiser sa base de données, assurant une parfaite synchronisation avec le frontend.
