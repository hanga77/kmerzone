require('dotenv').config(); // Charge les variables du fichier .env
const esbuild = require('esbuild');

async function startServer() {
  try {
    // Create a context for the build
    const ctx = await esbuild.context({
      entryPoints: ['index.tsx'], // Le point d'entrée de notre application
      bundle: true,               // Rassembler tout le code en un seul fichier
      outfile: 'bundle.js',       // Le nom du fichier de sortie
      define: {
        // Injecte la clé API dans le code
        'process.env.API_KEY': `"${process.env.API_KEY}"`
      },
      loader: { '.tsx': 'tsx' },  // Indique comment charger les fichiers .tsx
      sourcemap: true,            // Enable source maps for better debugging
    });

    // Start the development server
    const { host, port } = await ctx.serve({
      servedir: '.', // Le dossier à servir (la racine de notre projet)
      port: 3000,     // Le port pour le serveur de développement
    });

    console.log(`\n=================================================`);
    console.log(`🚀 Serveur de développement démarré sur :`);
    console.log(`   http://${host}:${port}`);
    console.log(`=================================================\n`);

  } catch (error) {
    console.error('Failed to start esbuild server:', error);
    process.exit(1);
  }
}

startServer();
